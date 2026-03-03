# Vertical Slice: Medical Day 1-7
## Complete End-to-End Implementation

---

## USER STORY

**Sarah, 42, just diagnosed with breast cancer.**

**Day 1 (2 hours after diagnosis):**
- Receives pathology report from doctor
- Opens Path9 app in shock/confusion
- Types: "I don't understand what any of this means"

**What Path9 Does:**
1. Detects high anxiety state
2. Translates diagnosis into plain English
3. Extracts key information into structured format
4. Creates emotional safety boundary
5. Suggests immediate coping practices

**Day 3 (First oncologist appointment scheduled):**
- Opens app, types: "I have an appointment with Dr. Chen on Friday"
- Path9 extracts appointment details, explains oncologist role, prepares questions

**Day 5 (Researching treatment options):**
- Overwhelmed by Google results
- Types: "What happens next? How long does this take?"
- Path9 infers timeline, explains typical treatment sequence, sets expectations

**Day 7 (Processing emotions):**
- Feeling scared about treatment
- Types: "I'm terrified of chemotherapy"
- Path9 detects catastrophizing, offers grounding practice, provides balanced information

---

## ARCHITECTURE OVERVIEW

### Services Built (4 total)
1. **translate-medical** - Converts medical jargon → plain English
2. **understand-appointment** - Extracts appointment data, preps questions
3. **infer-timeline** - Predicts treatment journey stages
4. **safety-guardrails** - Detects emotional distress, intervenes

### Data Flow

```
User Input (raw message)
    ↓
[gemma-respond] - Existing entry point
    ↓
Intent Classification ← NEW: Detect if medical translation needed
    ↓
[orchestrate] - Routes to appropriate service
    ↓
┌─────────────┬──────────────────┬────────────────┬──────────────────┐
│ Medical     │ Appointment      │ Timeline       │ Safety           │
│ Translation │ Understanding    │ Inference      │ Guardrails       │
└─────────────┴──────────────────┴────────────────┴──────────────────┘
    ↓
Response Assembly ← Combines insights from multiple services
    ↓
Safety Filter ← Final check before sending to user
    ↓
User receives response + structured data stored
```

### New Database Tables

```sql
-- Diagnoses (structured medical data)
CREATE TABLE diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id),
  diagnosis_name text NOT NULL,
  diagnosis_date date NOT NULL,
  stage_or_severity text,
  icd_code text,
  raw_pathology_text text,
  plain_english_summary text,
  created_at timestamptz DEFAULT now()
);

-- Appointments (care coordination)
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id),
  appointment_datetime timestamptz NOT NULL,
  provider_name text,
  provider_role text, -- oncologist, surgeon, radiologist, etc.
  appointment_type text, -- consultation, treatment, follow-up
  location text,
  preparation_notes text,
  questions_to_ask jsonb,
  status text DEFAULT 'scheduled', -- scheduled, completed, cancelled
  notes_after text,
  created_at timestamptz DEFAULT now()
);

-- Care team (who's who)
CREATE TABLE care_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id),
  provider_name text NOT NULL,
  role text NOT NULL, -- oncologist, surgeon, nurse navigator, etc.
  specialty text,
  contact_info jsonb,
  communication_preferences text,
  first_seen_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Treatment timeline (what to expect)
CREATE TABLE treatment_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id),
  diagnosis_id uuid REFERENCES diagnoses(id),
  timeline_phase text NOT NULL, -- diagnosis, surgery, chemotherapy, radiation, recovery
  phase_order integer NOT NULL,
  estimated_start_date date,
  estimated_duration_weeks integer,
  description text,
  key_milestones jsonb,
  actual_start_date date,
  actual_end_date date,
  status text DEFAULT 'upcoming', -- upcoming, in_progress, completed
  created_at timestamptz DEFAULT now()
);

-- Emotional check-ins (track state over time)
CREATE TABLE emotional_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id),
  checkin_time timestamptz DEFAULT now(),
  anxiety_level integer, -- 1-10 scale
  overwhelm_level integer,
  hope_level integer,
  physical_wellbeing integer,
  detected_from text, -- 'explicit_survey' | 'message_analysis' | 'behavior_pattern'
  intervention_offered text,
  intervention_accepted boolean
);

-- Safety interventions (crisis detection)
CREATE TABLE safety_interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id),
  intervention_time timestamptz DEFAULT now(),
  trigger_type text NOT NULL, -- 'catastrophizing', 'suicidal_ideation', 'severe_anxiety'
  trigger_content text,
  severity_score integer, -- 1-10
  intervention_type text, -- 'grounding_exercise', 'crisis_resource', 'human_escalation'
  intervention_content text,
  user_response text,
  resolved boolean DEFAULT false,
  escalated_to_human boolean DEFAULT false
);
```

---

## SERVICE 1: MEDICAL TRANSLATION

### Edge Function
`supabase/functions/translate-medical/`

Already designed in previous document (SERVICE_FAMILY_TRANSLATORS.md).

### Input Example
```json
{
  "technical_text": "Invasive ductal carcinoma, Stage IIA (T2N0M0), ER+/PR+/HER2-, Grade 2, Ki-67 20%",
  "context": {
    "journey_phase": "chaos",
    "emotional_state": "anxious",
    "user_literacy_level": 3
  },
  "request_id": "uuid"
}
```

### Output Example
```json
{
  "success": true,
  "data": {
    "plain_english": "You have a type of breast cancer that started in the milk ducts and has grown into nearby breast tissue. The cancer is about 2-5 cm in size and hasn't spread to lymph nodes or other parts of your body. Your tumor responds to hormones (estrogen and progesterone), which is actually good news—it means hormone therapy can help. It's not growing extremely fast (Grade 2 is moderate). The growth rate (Ki-67) shows about 20% of cells are actively dividing, which is moderate.",
    "key_terms": [
      {
        "term": "Invasive Ductal Carcinoma",
        "definition": "Cancer that started in milk ducts and spread to breast tissue",
        "analogy": "Think of it like water that started in a pipe but has now leaked into the surrounding area"
      },
      {
        "term": "Stage IIA",
        "definition": "Early-stage cancer, hasn't spread beyond the breast",
        "analogy": "Like a fire that's still contained to one room—serious, but manageable"
      },
      {
        "term": "ER+/PR+",
        "definition": "Your tumor has receptors for estrogen and progesterone hormones",
        "analogy": "Like a lock that has a key—we can use hormone-blocking drugs as treatment"
      },
      {
        "term": "HER2-",
        "definition": "Your tumor doesn't have extra HER2 protein",
        "analogy": "One less growth signal for the cancer, which is good"
      }
    ],
    "what_this_means": "You have early-stage breast cancer that is very treatable. Because it's hormone-sensitive, you have more treatment options available. The fact that it hasn't spread to lymph nodes is good news. Most people with this type and stage do very well with treatment.",
    "questions_to_ask": [
      "What are my treatment options given my hormone receptor status?",
      "Will I need surgery, and if so, what kind?",
      "How long will my treatment last?",
      "What's the typical recovery timeline for my stage?",
      "Do I need genetic testing (BRCA)?",
      "What's my prognosis with treatment?"
    ],
    "emotional_note": "This information might feel overwhelming. Remember: medical language often sounds scarier than it is. Take a deep breath, and let's break this down into manageable pieces. You don't need to understand everything at once.",
    "complexity_score": 9,
    "confidence_score": 10
  }
}
```

---

## SERVICE 2: APPOINTMENT UNDERSTANDING

### Purpose
Extract appointment details from user messages, explain provider roles, generate prep questions.

### Edge Function Structure
```
supabase/functions/understand-appointment/
├── index.ts           # Handler
├── service.ts         # Appointment parser
├── provider-roles.ts  # Database of medical roles
└── prompts/
    ├── system.txt
    └── extraction-template.txt
```

### Implementation

```typescript
// supabase/functions/understand-appointment/service.ts

export interface AppointmentExtraction {
  appointment_datetime: string | null;
  provider_name: string | null;
  provider_role: string | null;
  appointment_type: string | null;
  location: string | null;
  confidence_score: number;
}

export interface AppointmentUnderstanding {
  extraction: AppointmentExtraction;
  role_explanation: string;
  preparation_tips: string[];
  questions_to_ask: string[];
}

export class AppointmentParser {
  private providerRoles: Map<string, string>;

  constructor() {
    this.providerRoles = this.loadProviderRoles();
  }

  private loadProviderRoles(): Map<string, string> {
    // In production, load from database or config
    return new Map([
      ["oncologist", "Cancer specialist who coordinates your overall cancer treatment"],
      ["surgeon", "Doctor who performs operations, may remove tumors or affected tissue"],
      ["radiologist", "Doctor who interprets imaging scans (mammograms, CT, MRI)"],
      ["radiation oncologist", "Specialist who uses radiation therapy to treat cancer"],
      ["medical oncologist", "Doctor who specializes in chemotherapy and other drug treatments"],
      ["nurse navigator", "Specialized nurse who helps coordinate your care and answer questions"],
      ["pathologist", "Doctor who examines tissue samples to diagnose cancer type"],
      ["plastic surgeon", "Surgeon who performs reconstructive surgery after cancer surgery"],
    ]);
  }

  async parse(
    userMessage: string,
    userId: string,
    context: Record<string, unknown>
  ): Promise<AppointmentUnderstanding> {
    // 1. Extract structured appointment data using LLM
    const extraction = await this.extractAppointmentData(userMessage, userId);

    // 2. Explain provider role
    const roleExplanation = this.explainRole(extraction.provider_role);

    // 3. Generate preparation tips
    const prepTips = this.generatePrepTips(extraction.appointment_type, extraction.provider_role);

    // 4. Generate questions to ask
    const questions = this.generateQuestions(extraction.appointment_type, extraction.provider_role, context);

    return {
      extraction,
      role_explanation: roleExplanation,
      preparation_tips: prepTips,
      questions_to_ask: questions,
    };
  }

  private async extractAppointmentData(
    userMessage: string,
    userId: string
  ): Promise<AppointmentExtraction> {
    const systemPrompt = `You are an appointment data extractor. Extract structured appointment information from user messages.

Return JSON with these fields:
- appointment_datetime: ISO 8601 format, or null
- provider_name: Doctor's name, or null
- provider_role: Medical specialty (oncologist, surgeon, etc.), or null
- appointment_type: consultation, treatment, follow-up, imaging, or null
- location: Hospital/clinic name or address, or null
- confidence_score: 1-10, how confident are you in the extraction

If information is missing, set to null. Don't guess.`;

    const userPrompt = `Extract appointment information from this message:\n\n"${userMessage}"`;

    // Call LLM (reuse existing adapter)
    const response = await callLLM(
      {
        prompts: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        metadata: { state_hydrated: false, canon_included: false },
      },
      crypto.randomUUID(),
      userId,
      userPrompt
    );

    try {
      return JSON.parse(response.response);
    } catch {
      return {
        appointment_datetime: null,
        provider_name: null,
        provider_role: null,
        appointment_type: null,
        location: null,
        confidence_score: 0,
      };
    }
  }

  private explainRole(role: string | null): string {
    if (!role) return "I couldn't identify the type of appointment from your message.";

    const explanation = this.providerRoles.get(role.toLowerCase());
    if (explanation) {
      return `Your ${role} is a ${explanation}.`;
    }

    return `This is an appointment with a ${role}.`;
  }

  private generatePrepTips(appointmentType: string | null, providerRole: string | null): string[] {
    const tips: string[] = [
      "Bring a list of all current medications (including supplements)",
      "Bring insurance card and ID",
      "Consider bringing a friend or family member for support and note-taking",
      "Write down your questions beforehand",
    ];

    if (appointmentType === "consultation" || providerRole === "oncologist") {
      tips.push("Bring any previous test results or pathology reports");
      tips.push("Ask about treatment options and timeline");
    }

    if (providerRole === "surgeon") {
      tips.push("Ask about surgery recovery time and what to expect");
      tips.push("Understand surgical options (lumpectomy vs. mastectomy)");
    }

    if (appointmentType === "imaging") {
      tips.push("Wear comfortable clothing without metal");
      tips.push("Ask when results will be available");
    }

    return tips;
  }

  private generateQuestions(
    appointmentType: string | null,
    providerRole: string | null,
    context: Record<string, unknown>
  ): string[] {
    const questions: string[] = [];

    // Universal questions
    questions.push("What are my treatment options?");
    questions.push("What are the side effects I should watch for?");
    questions.push("When will I know the results?");

    // Role-specific questions
    if (providerRole === "oncologist") {
      questions.push("What stage is my cancer?");
      questions.push("What's the treatment timeline?");
      questions.push("Will I need chemotherapy, radiation, or both?");
      questions.push("What's my prognosis?");
    }

    if (providerRole === "surgeon") {
      questions.push("What type of surgery do you recommend and why?");
      questions.push("How long is the recovery period?");
      questions.push("Will I need reconstruction?");
      questions.push("What are the risks of surgery?");
    }

    if (appointmentType === "follow-up") {
      questions.push("How am I doing compared to expectations?");
      questions.push("Do we need to adjust my treatment plan?");
      questions.push("What should I do if symptoms get worse?");
    }

    return questions.slice(0, 8); // Limit to 8 most relevant
  }
}
```

### Input Example
```json
{
  "user_message": "I have an appointment with Dr. Sarah Chen, my oncologist, this Friday at 2pm at City Hospital",
  "context": {
    "journey_phase": "chaos",
    "days_since_diagnosis": 3
  },
  "request_id": "uuid"
}
```

### Output Example
```json
{
  "success": true,
  "data": {
    "extraction": {
      "appointment_datetime": "2025-12-26T14:00:00Z",
      "provider_name": "Dr. Sarah Chen",
      "provider_role": "oncologist",
      "appointment_type": "consultation",
      "location": "City Hospital",
      "confidence_score": 9
    },
    "role_explanation": "Your oncologist is a cancer specialist who coordinates your overall cancer treatment. They will help you understand your diagnosis, explain treatment options, and create your treatment plan.",
    "preparation_tips": [
      "Bring a list of all current medications (including supplements)",
      "Bring insurance card and ID",
      "Consider bringing a friend or family member for support and note-taking",
      "Write down your questions beforehand",
      "Bring any previous test results or pathology reports",
      "Ask about treatment options and timeline"
    ],
    "questions_to_ask": [
      "What stage is my cancer?",
      "What are my treatment options?",
      "What's the treatment timeline?",
      "Will I need chemotherapy, radiation, or both?",
      "What are the side effects I should watch for?",
      "What's my prognosis?",
      "When will I know the results?"
    ]
  }
}
```

### Database Storage
After parsing, automatically create records in:
- `appointments` table (store appointment details)
- `care_team` table (add provider if new)

---

## SERVICE 3: TIMELINE INFERENCE

### Purpose
Predict treatment journey phases based on diagnosis. Help user mentally prepare.

### Implementation

```typescript
// supabase/functions/infer-timeline/service.ts

export interface TimelinePhase {
  phase_name: string;
  phase_order: number;
  typical_duration_weeks: number;
  description: string;
  key_milestones: string[];
  typical_challenges: string[];
}

export interface TimelineInference {
  phases: TimelinePhase[];
  total_estimated_weeks: number;
  current_phase: string;
  next_milestone: string;
  personalized_note: string;
}

export class TimelineInferencer {
  async infer(
    diagnosisInfo: Record<string, unknown>,
    userId: string
  ): Promise<TimelineInference> {
    // In production, this would use:
    // 1. Diagnosis stage/type to determine standard treatment protocols
    // 2. Medical literature on typical timelines
    // 3. User's specific risk factors

    const stage = (diagnosisInfo.stage || "unknown") as string;
    const cancerType = (diagnosisInfo.type || "unknown") as string;

    // Simplified example for breast cancer Stage IIA
    if (cancerType.includes("breast") && stage.includes("IIA")) {
      return {
        phases: [
          {
            phase_name: "Diagnosis & Testing",
            phase_order: 1,
            typical_duration_weeks: 2,
            description: "Additional tests to understand your cancer fully. May include imaging scans, biopsies, and blood work.",
            key_milestones: [
              "Complete imaging (MRI, CT, or PET scan)",
              "Genetic testing consultation",
              "Meet with surgical oncologist",
              "Meet with medical oncologist",
            ],
            typical_challenges: [
              "Waiting for test results can be anxiety-inducing",
              "Information overload from multiple appointments",
              "Difficulty sleeping or concentrating",
            ],
          },
          {
            phase_name: "Surgery",
            phase_order: 2,
            typical_duration_weeks: 4,
            description: "Surgical removal of the tumor. May be lumpectomy (breast-conserving) or mastectomy (full breast removal).",
            key_milestones: [
              "Pre-surgery consultation and planning",
              "Surgery day",
              "Post-surgery pathology results",
              "Surgical recovery (1-2 weeks)",
            ],
            typical_challenges: [
              "Surgical recovery pain and limitations",
              "Waiting for final pathology",
              "Adjusting to body changes",
              "Managing drains (if applicable)",
            ],
          },
          {
            phase_name: "Chemotherapy",
            phase_order: 3,
            typical_duration_weeks: 16,
            description: "Systemic treatment to kill cancer cells throughout your body. Typically given in cycles every 2-3 weeks.",
            key_milestones: [
              "Port placement (if needed)",
              "First infusion",
              "Mid-treatment scans",
              "Final infusion",
            ],
            typical_challenges: [
              "Fatigue and low energy",
              "Nausea (usually manageable with meds)",
              "Hair loss",
              "Increased infection risk",
              "Emotional ups and downs",
            ],
          },
          {
            phase_name: "Radiation Therapy",
            phase_order: 4,
            typical_duration_weeks: 6,
            description: "Targeted radiation to kill any remaining cancer cells in the breast area. Usually 5 days/week.",
            key_milestones: [
              "Radiation planning session (mapping)",
              "First treatment",
              "Mid-treatment check-in",
              "Final treatment",
            ],
            typical_challenges: [
              "Skin irritation in treatment area",
              "Fatigue (cumulative)",
              "Daily treatment schedule",
            ],
          },
          {
            phase_name: "Hormone Therapy",
            phase_order: 5,
            typical_duration_weeks: 260,
            description: "Daily medication for 5-10 years to block hormones that fuel cancer growth (since you're ER+/PR+).",
            key_milestones: [
              "Start daily medication (tamoxifen or aromatase inhibitor)",
              "3-month follow-up",
              "6-month follow-up",
              "Annual check-ins",
            ],
            typical_challenges: [
              "Medication side effects (hot flashes, joint pain)",
              "Remembering daily medication",
              "Long-term commitment",
            ],
          },
          {
            phase_name: "Survivorship & Monitoring",
            phase_order: 6,
            typical_duration_weeks: 520,
            description: "Regular monitoring for recurrence. Focus shifts to long-term health and wellness.",
            key_milestones: [
              "3-month check-ups (first 2 years)",
              "6-month check-ups (years 3-5)",
              "Annual mammograms",
              "Return to 'normal' life",
            ],
            typical_challenges: [
              "Scanxiety (anxiety before scans)",
              "Finding new normal",
              "Late side effects from treatment",
            ],
          },
        ],
        total_estimated_weeks: 806,
        current_phase: "Diagnosis & Testing",
        next_milestone: "Complete imaging (MRI, CT, or PET scan)",
        personalized_note: "This timeline is typical for Stage IIA ER+/PR+ breast cancer, but your specific timeline may vary based on your body's response to treatment and your oncologist's recommendations. The good news: you're in an early stage with excellent treatment options.",
      };
    }

    // Fallback for other cancer types
    return {
      phases: [],
      total_estimated_weeks: 0,
      current_phase: "Diagnosis",
      next_milestone: "Meet with oncologist to discuss treatment plan",
      personalized_note: "Treatment timelines vary significantly based on cancer type and stage. Your oncologist will create a personalized treatment plan for you.",
    };
  }
}
```

### Input Example
```json
{
  "diagnosis_info": {
    "type": "Invasive ductal carcinoma",
    "stage": "Stage IIA",
    "hormone_receptors": "ER+/PR+/HER2-"
  },
  "user_id": "uuid",
  "request_id": "uuid"
}
```

### Output Example
```json
{
  "success": true,
  "data": {
    "phases": [ /* 6 phases as shown above */ ],
    "total_estimated_weeks": 806,
    "current_phase": "Diagnosis & Testing",
    "next_milestone": "Complete imaging (MRI, CT, or PET scan)",
    "personalized_note": "This timeline is typical for Stage IIA ER+/PR+ breast cancer..."
  }
}
```

---

## SERVICE 4: SAFETY GUARDRAILS

### Purpose
Detect emotional distress and intervene appropriately.

### Implementation

```typescript
// supabase/functions/safety-guardrails/service.ts

export interface SafetyCheck {
  is_safe: boolean;
  severity_score: number; // 1-10, 10 = crisis
  detected_patterns: string[];
  intervention_recommended: string | null;
  escalation_required: boolean;
}

export class SafetyGuardrails {
  private dangerPatterns: RegExp[];
  private catastrophizingPatterns: RegExp[];
  private overwhelmPatterns: RegExp[];

  constructor() {
    this.dangerPatterns = [
      /\b(want to die|kill myself|end it all|not worth living|better off dead)\b/i,
      /\b(suicide|suicidal)\b/i,
    ];

    this.catastrophizingPatterns = [
      /\b(going to die|definitely fatal|no hope|nothing will work|everyone dies from)\b/i,
      /\b(worst case|terminal|end stage) and \b(definitely|certainly|for sure)\b/i,
    ];

    this.overwhelmPatterns = [
      /\b(can't handle|too much|overwhelming|drowning|falling apart)\b/i,
      /\b(panic|terrified|scared to death)\b/i,
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

    // Check for danger patterns (suicidal ideation)
    for (const pattern of this.dangerPatterns) {
      if (pattern.test(userMessage)) {
        severityScore = 10;
        detectedPatterns.push("suicidal_ideation");
        escalationRequired = true;
        interventionRecommended = "crisis_resources";
        break;
      }
    }

    // Check for catastrophizing
    if (severityScore < 10) {
      for (const pattern of this.catastrophizingPatterns) {
        if (pattern.test(userMessage)) {
          severityScore = Math.max(severityScore, 7);
          detectedPatterns.push("catastrophizing");
          interventionRecommended = "grounding_exercise";
        }
      }
    }

    // Check for overwhelm
    if (severityScore < 7) {
      for (const pattern of this.overwhelmPatterns) {
        if (pattern.test(userMessage)) {
          severityScore = Math.max(severityScore, 5);
          detectedPatterns.push("overwhelm");
          interventionRecommended = "calming_protocol";
        }
      }
    }

    // Log safety check
    await this.logSafetyCheck(userId, userMessage, severityScore, detectedPatterns);

    return {
      is_safe: severityScore < 10,
      severity_score: severityScore,
      detected_patterns: detectedPatterns,
      intervention_recommended: interventionRecommended,
      escalation_required,
    };
  }

  private async logSafetyCheck(
    userId: string,
    message: string,
    severity: number,
    patterns: string[]
  ): Promise<void> {
    // Store in safety_interventions table
    // In production, this would actually write to database
    console.log("Safety check logged:", { userId, severity, patterns });
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
```

---

## INTEGRATION: HOW IT ALL WORKS TOGETHER

### Modified `orchestrate/index.ts` - Add Intent Classification

```typescript
// After existing policy checks, add intent classification

const intent = await classifyIntent(body.user_message, auth_user_id);

// Route to appropriate service based on intent
switch (intent.primary_intent) {
  case "medical_translation":
    // Call translate-medical service
    const translationResult = await callService("translate-medical", {
      technical_text: body.user_message,
      context: body.journey_state,
    });
    // Include in response
    break;

  case "appointment_mention":
    // Call understand-appointment service
    const appointmentResult = await callService("understand-appointment", {
      user_message: body.user_message,
      context: body.journey_state,
    });
    // Store in database + include in response
    break;

  case "timeline_question":
    // Call infer-timeline service
    const timelineResult = await callService("infer-timeline", {
      diagnosis_info: await getUserDiagnosis(auth_user_id),
    });
    // Include in response
    break;

  default:
    // Standard Gemma conversational response
    break;
}

// Always run safety guardrails
const safetyCheck = await callService("safety-guardrails", {
  user_message: body.user_message,
  conversation_history: await getRecentConversations(auth_user_id, 5),
});

if (!safetyCheck.is_safe) {
  // Override response with crisis intervention
  return crisisResponse(safetyCheck);
}
```

---

## TESTING THE VERTICAL SLICE

### Test Scenario 1: Day 1 Diagnosis
**User Input:** "I just got diagnosed with invasive ductal carcinoma Stage IIA ER+/PR+/HER2-. I don't understand what any of this means. I'm terrified."

**Expected System Response:**
1. Safety check detects "terrified" → severity 5, triggers calming protocol
2. Medical translation parses diagnosis
3. Gemma responds with:
   - Calming breathing exercise
   - Plain English explanation of diagnosis
   - Reassurance about treatment options
   - Offer to break down specific terms

**Data Stored:**
- `diagnoses` table: New diagnosis record with plain English summary
- `emotional_checkins` table: High anxiety detected
- `safety_interventions` table: Calming protocol offered

### Test Scenario 2: Day 3 Appointment
**User Input:** "I have an appointment with Dr. Chen, my oncologist, on Friday at 2pm"

**Expected System Response:**
1. Appointment parser extracts structured data
2. Gemma responds with:
   - Confirmation of appointment details
   - Explanation of oncologist role
   - Preparation tips
   - Suggested questions to ask

**Data Stored:**
- `appointments` table: New appointment record
- `care_team` table: Dr. Chen added as oncologist

### Test Scenario 3: Day 5 Timeline Question
**User Input:** "How long is this going to take? What happens next?"

**Expected System Response:**
1. Timeline inferencer generates phased timeline
2. Gemma responds with:
   - Overview of 6 treatment phases
   - Current phase (Diagnosis & Testing)
   - Next immediate milestone
   - Realistic but hopeful framing

**Data Stored:**
- `treatment_timeline` table: 6 timeline phases created

### Test Scenario 4: Day 7 Catastrophizing
**User Input:** "I read that chemotherapy is going to make me so sick I won't be able to function. I'm going to lose my job and my hair and everything."

**Expected System Response:**
1. Safety check detects catastrophizing → severity 7
2. Gemma responds with:
   - Grounding exercise (5-4-3-2-1)
   - Reality check: side effects are manageable, not everyone experiences all of them
   - Practical information about work accommodations (FMLA)
   - Offer to connect with side effect management resources

**Data Stored:**
- `safety_interventions` table: Catastrophizing detected, grounding offered

---

## DEPLOYMENT PLAN

### Phase 1: Build Services (Week 1)
- [ ] Implement translate-medical service
- [ ] Implement understand-appointment service
- [ ] Implement infer-timeline service
- [ ] Enhance safety-guardrails service

### Phase 2: Database Schema (Week 1)
- [ ] Create migrations for 4 new tables
- [ ] Add RLS policies
- [ ] Seed provider roles data

### Phase 3: Integration (Week 2)
- [ ] Add intent classification to orchestrate
- [ ] Add service routing logic
- [ ] Add safety check gating

### Phase 4: Testing (Week 2)
- [ ] Unit tests for each service
- [ ] Integration tests for full flow
- [ ] Safety testing (adversarial inputs)

### Phase 5: Frontend Integration (Week 3)
- [ ] Display translated medical terms
- [ ] Show upcoming appointments
- [ ] Visualize treatment timeline
- [ ] Handle safety interventions in UI

---

## SUCCESS METRICS

**Technical:**
- All 4 services deploy successfully
- Response time < 2 seconds for simple queries
- Response time < 5 seconds for complex (multi-service) queries
- 100% of crisis scenarios detected and escalated

**User Experience:**
- Users report feeling "understood" after translation
- Users ask >80% of suggested appointment questions
- Timeline visualization reduces anxiety (measured via check-ins)
- Safety interventions accepted >60% of the time

---

## READY TO BUILD?

This vertical slice proves:
- ✅ Service pattern works end-to-end
- ✅ Data flows correctly
- ✅ Safety is built-in
- ✅ User gets value from Day 1

Next step: Start implementing these 4 services for real.

Should I begin with Service 1 (Medical Translation)?
