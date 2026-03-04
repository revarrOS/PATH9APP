export interface SafetyCheck {
  is_safe: boolean;
  severity_score: number;
  detected_patterns: string[];
  intervention_recommended: string | null;
  intervention_content?: string;
  escalation_required: boolean;
}

export interface OutputValidation {
  is_safe: boolean;
  violations: string[];
  contains_medical_advice: boolean;
  contains_diagnosis: boolean;
  contains_treatment_recommendation: boolean;
  suggested_replacement?: string;
}

export class SafetyGuardrails {
  private dangerPatterns: RegExp[];
  private catastrophizingPatterns: RegExp[];
  private overwhelmPatterns: RegExp[];
  private medicalAdvicePatterns: RegExp[];
  private diagnosisPatterns: RegExp[];
  private treatmentPatterns: RegExp[];

  constructor() {
    this.dangerPatterns = [
      /\b(want to die|kill myself|end it all|not worth living|better off dead)\b/i,
      /\b(suicide|suicidal)\b/i,
    ];

    this.catastrophizingPatterns = [
      /\b(going to die|definitely fatal|no hope|nothing will work|everyone dies from)\b/i,
      /\b(worst case|terminal|end stage) (and )?\b(definitely|certainly|for sure)\b/i,
    ];

    this.overwhelmPatterns = [
      /\b(can't handle|too much|overwhelming|drowning|falling apart)\b/i,
      /\b(panic|terrified|scared to death)\b/i,
    ];

    this.medicalAdvicePatterns = [
      /\b(you should take|I recommend taking|you need to start|you must stop)\b/i,
      /\b(the right treatment for you is|you should choose|the best option is)\b/i,
      /\b(stop taking|don't take|avoid taking) (your )?(medication|treatment|therapy)\b/i,
    ];

    this.diagnosisPatterns = [
      /\b(you (definitely |probably )?have|this means you have|you are diagnosed with)\b/i,
      /\b(your test results (show|indicate|mean) (that )?you have)\b/i,
      /\b(this is (definitely|certainly|clearly)) (a sign of|indicative of)\b/i,
    ];

    this.treatmentPatterns = [
      /\b(you should (start|begin|try|switch to)|I recommend|I suggest you take)\b/i,
      /\b((don't|do not) (start|take|try|stop)) (this )?(treatment|medication|therapy)\b/i,
      /\b(better|worse) (treatment |therapy )?option (than|compared to)\b/i,
      /\b(treatment A is (better|worse) than treatment B)\b/i,
    ];
  }

  async check(
    userMessage: string,
    userId: string,
    conversationHistory?: string[]
  ): Promise<SafetyCheck> {
    let severityScore = 1;
    const detectedPatterns: string[] = [];
    let interventionRecommended: string | null = null;
    let escalationRequired = false;

    for (const pattern of this.dangerPatterns) {
      if (pattern.test(userMessage)) {
        severityScore = 10;
        detectedPatterns.push("suicidal_ideation");
        escalationRequired = true;
        interventionRecommended = "crisis_resources";
        break;
      }
    }

    if (severityScore < 10) {
      for (const pattern of this.catastrophizingPatterns) {
        if (pattern.test(userMessage)) {
          severityScore = Math.max(severityScore, 7);
          detectedPatterns.push("catastrophizing");
          interventionRecommended = "grounding_exercise";
        }
      }
    }

    if (severityScore < 7) {
      for (const pattern of this.overwhelmPatterns) {
        if (pattern.test(userMessage)) {
          severityScore = Math.max(severityScore, 5);
          detectedPatterns.push("overwhelm");
          interventionRecommended = "calming_protocol";
        }
      }
    }

    const interventionContent = interventionRecommended
      ? this.getInterventionContent(interventionRecommended)
      : undefined;

    return {
      is_safe: severityScore < 10,
      severity_score: severityScore,
      detected_patterns: detectedPatterns,
      intervention_recommended: interventionRecommended,
      intervention_content: interventionContent,
      escalation_required,
    };
  }

  async validateOutput(llmResponse: string): Promise<OutputValidation> {
    const violations: string[] = [];
    let containsMedicalAdvice = false;
    let containsDiagnosis = false;
    let containsTreatmentRecommendation = false;

    for (const pattern of this.medicalAdvicePatterns) {
      if (pattern.test(llmResponse)) {
        containsMedicalAdvice = true;
        violations.push("medical_advice_detected");
        break;
      }
    }

    for (const pattern of this.diagnosisPatterns) {
      if (pattern.test(llmResponse)) {
        containsDiagnosis = true;
        violations.push("diagnosis_detected");
        break;
      }
    }

    for (const pattern of this.treatmentPatterns) {
      if (pattern.test(llmResponse)) {
        containsTreatmentRecommendation = true;
        violations.push("treatment_recommendation_detected");
        break;
      }
    }

    const isSafe = violations.length === 0;
    let suggestedReplacement: string | undefined;

    if (!isSafe) {
      suggestedReplacement = `I understand you're looking for guidance, but I can't provide medical advice or recommendations about treatments.

What I can do is help you:
- Understand medical terms and concepts in plain language
- Prepare questions to ask your care team
- Reflect on what you're hearing from your doctors
- Process the emotions that come up around medical decisions

Would any of those be helpful right now?`;
    }

    return {
      is_safe: isSafe,
      violations,
      contains_medical_advice: containsMedicalAdvice,
      contains_diagnosis: containsDiagnosis,
      contains_treatment_recommendation: containsTreatmentRecommendation,
      suggested_replacement: suggestedReplacement,
    };
  }

  getInterventionContent(interventionType: string): string {
    switch (interventionType) {
      case "crisis_resources":
        return `I'm really concerned about what you just shared. Your safety is the most important thing right now.

**Please reach out for immediate help:**
- **National Suicide Prevention Lifeline:** 988 (call or text)
- **Crisis Text Line:** Text HOME to 741741
- **Emergency:** Call 911 or go to nearest emergency room

These feelings can be overwhelming, especially during a health crisis, but you don't have to face them alone. Professional support is available 24/7.

I'm here to support you, but I'm not equipped to handle crisis situations. Please connect with one of these resources right away.`;

      case "grounding_exercise":
        return `I hear how scary this feels. When our mind jumps to worst-case scenarios, it's often trying to protect us—but it can make everything feel more overwhelming.

Let's take a moment to ground ourselves:

**5-4-3-2-1 Grounding Exercise:**
1. **5 things you can see** (Look around you—what colors, objects?)
2. **4 things you can touch** (Feel the chair, your clothing, temperature)
3. **3 things you can hear** (Even small sounds—A/C, birds, traffic)
4. **2 things you can smell** (Or smells you like to think about)
5. **1 thing you can taste** (Or a taste you enjoy)

This helps bring you back to the present moment, rather than the scary "what-ifs."

Want to talk about what specifically is worrying you?`;

      case "calming_protocol":
        return `It sounds like you're feeling really overwhelmed right now. That's completely understandable—you're dealing with a lot.

Let's take one thing at a time. First, a quick calming breath:

**Box Breathing (do this 3 times):**
- Breathe in for 4 counts
- Hold for 4 counts
- Breathe out for 4 counts
- Hold for 4 counts

Now, what's the **one thing** that feels most urgent or scary right now? We can tackle that first, together.`;

      default:
        return "I'm here with you. Take a deep breath. What do you need right now?";
    }
  }
}
