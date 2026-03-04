import { BLOODWORK_BOUNDARIES } from './bloodwork-boundaries';

export interface UnsafeIntent {
  detected: boolean;
  intentType?: string;
  deflection?: string;
}

export function detectUnsafeIntent(message: string): UnsafeIntent {
  const lowerMessage = message.toLowerCase();

  const diagnosisPatterns = [
    /what (disease|condition|illness|problem)/i,
    /do i have/i,
    /am i (sick|ill)/i,
    /is (this|it) (cancer|disease|leukemia|anemia)/i,
    /what('s| is) wrong with me/i,
    /diagnose/i,
  ];

  const treatmentPatterns = [
    /should i (take|start|stop)/i,
    /what (supplement|medication|drug|medicine)/i,
    /can i (take|use)/i,
    /(recommend|suggest) (supplement|medication|treatment)/i,
    /will.*help (if|my)/i,
    /what if i (took|take|started)/i,
  ];

  const outcomePatterns = [
    /will i (get|die|recover|improve)/i,
    /am i going to/i,
    /what (will|might) happen/i,
    /is (this|it) (serious|fatal|deadly|terminal)/i,
    /how (long|much time)/i,
    /prognosis/i,
  ];

  // REMOVED: comparisonPatterns ("is this normal?")
  // REMOVED: alertPatterns ("is this dangerous?", "should I worry?")
  //
  // WHY: These are REASSURANCE questions, not unsafe requests.
  // They must reach the LLM so Gemma can handle them in her voice
  // using the Educate → Reassure → Handoff pattern.
  //
  // Only truly unsafe requests (diagnosis, treatment, outcome prediction)
  // are blocked pre-LLM.

  if (diagnosisPatterns.some(p => p.test(lowerMessage))) {
    return {
      detected: true,
      intentType: 'diagnosis_request',
      deflection: BLOODWORK_BOUNDARIES.deflectionTemplates.find(t => t.trigger === 'diagnosis_request')?.response,
    };
  }

  if (treatmentPatterns.some(p => p.test(lowerMessage))) {
    return {
      detected: true,
      intentType: 'treatment_request',
      deflection: BLOODWORK_BOUNDARIES.deflectionTemplates.find(t => t.trigger === 'treatment_request')?.response,
    };
  }

  if (outcomePatterns.some(p => p.test(lowerMessage))) {
    return {
      detected: true,
      intentType: 'outcome_prediction',
      deflection: BLOODWORK_BOUNDARIES.deflectionTemplates.find(t => t.trigger === 'outcome_prediction')?.response,
    };
  }

  return { detected: false };
}

export interface UnsafeContent {
  detected: boolean;
  violations: string[];
}

export function validateResponse(response: string): UnsafeContent {
  const violations: string[] = [];

  // REMOVED: Context-blind phrase blocking ("dangerous", "concerning", "normal range", etc.)
  //
  // WHY: Gemma needs to use these words in EDUCATIONAL CONTEXT to reassure users.
  // Examples that were incorrectly blocked:
  // - "On its own, a higher platelet number isn't automatically dangerous."
  // - "Clinicians usually don't treat one result as concerning."
  // - "The reference range shown on your chart is..."
  //
  // These are NOT medical claims. They're educational reassurance.
  //
  // We now ONLY block actual diagnosis claims and treatment recommendations
  // that sound like medical advice, not educational context.

  // Block only explicit diagnosis claims
  const diagnosisPatterns = [
    /you (have|may have|might have|could have) (a |an |)(disease|condition|illness|cancer|leukemia|anemia)/i,
    /this (means|indicates|suggests) you (have|may have) (a |an |)(disease|condition|illness)/i,
    /(diagnosed|diagnosis) (with|as)/i,
  ];

  diagnosisPatterns.forEach(pattern => {
    if (pattern.test(response)) {
      violations.push(`diagnosis claim: ${pattern.source}`);
    }
  });

  // Block only explicit treatment recommendations
  const treatmentPatterns = [
    /you should (take|start|try|stop) (a |an |)(supplement|medication|drug|medicine)/i,
    /i (recommend|suggest|advise) (you |)(take|taking|start|starting|try|trying)/i,
    /(take|start|consider) (taking |starting |)(a |an |)(supplement|medication) (to|for)/i,
  ];

  treatmentPatterns.forEach(pattern => {
    if (pattern.test(response)) {
      violations.push(`treatment recommendation: ${pattern.source}`);
    }
  });

  return {
    detected: violations.length > 0,
    violations,
  };
}

export function getSafeFallbackResponse(): string {
  // GEMMA'S VOICE: Warm, humble, supportive — NOT policy language
  return "I'm not a doctor, so I can't tell you what this means medically — " +
         "but I can help you understand what the numbers are showing and " +
         "help you think about what to ask your clinician next.";
}
