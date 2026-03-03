export interface IntentClassification {
  primary_intent: string;
  confidence: number;
  requires_medical_translation: boolean;
  requires_appointment_understanding: boolean;
  requires_timeline_inference: boolean;
  requires_safety_check: boolean;
  requires_journaling: boolean;
  requires_content_selection: boolean;
  requires_education: boolean;
  requires_question_save: boolean;
  pathway_type?: 'medical' | 'nutrition' | 'meditation' | 'mindfulness' | 'movement';
}

export async function classifyIntent(
  userMessage: string,
  conversationContext?: Record<string, unknown>
): Promise<IntentClassification> {
  const lowerMessage = userMessage.toLowerCase();

  const intent: IntentClassification = {
    primary_intent: "general_conversation",
    confidence: 0.5,
    requires_medical_translation: false,
    requires_appointment_understanding: false,
    requires_timeline_inference: false,
    requires_safety_check: true,
    requires_journaling: false,
    requires_content_selection: false,
    requires_education: false,
    requires_question_save: false,
  };

  const medicalJargonPatterns = [
    /\b(invasive|ductal|carcinoma|stage [0-4]|metasta|grade [1-3])\b/i,
    /\b(er\+|pr\+|her2|ki-67|lymph node|pathology)\b/i,
    /\b(chemotherapy|radiation|mastectomy|lumpectomy)\b/i,
    /\b(diagnosed with|diagnosis|biopsy result|test result)\b/i,
  ];

  for (const pattern of medicalJargonPatterns) {
    if (pattern.test(userMessage)) {
      intent.primary_intent = "medical_translation";
      intent.requires_medical_translation = true;
      intent.confidence = 0.9;
      break;
    }
  }

  const appointmentPatterns = [
    /\b(appointment|meeting) (with|on)\b/i,
    /\b(doctor|oncologist|surgeon|specialist) (on|this|next|tomorrow)\b/i,
    /\b(see|seeing|visit) (dr\.|doctor|my oncologist|my surgeon)\b/i,
    /\b(scheduled|booked) (appointment|visit)\b/i,
  ];

  for (const pattern of appointmentPatterns) {
    if (pattern.test(userMessage)) {
      if (intent.primary_intent === "general_conversation") {
        intent.primary_intent = "appointment_mention";
      }
      intent.requires_appointment_understanding = true;
      intent.confidence = Math.max(intent.confidence, 0.85);
    }
  }

  const timelinePatterns = [
    /\b(how long|when will|timeline|what happens next|what's next)\b/i,
    /\b(treatment (plan|timeline|schedule)|recovery time)\b/i,
    /\b(what to expect|what comes after)\b/i,
  ];

  for (const pattern of timelinePatterns) {
    if (pattern.test(userMessage)) {
      if (intent.primary_intent === "general_conversation") {
        intent.primary_intent = "timeline_question";
      }
      intent.requires_timeline_inference = true;
      intent.confidence = Math.max(intent.confidence, 0.8);
    }
  }

  const journalingPatterns = [
    /\b(journal|write down|record|feeling|today i|i feel|i'm feeling)\b/i,
    /\b(reflect|reflection|thinking about|noticed that)\b/i,
    /\b(how i'm doing|check in|emotional|mood)\b/i,
  ];

  for (const pattern of journalingPatterns) {
    if (pattern.test(userMessage)) {
      if (intent.primary_intent === "general_conversation") {
        intent.primary_intent = "journaling";
      }
      intent.requires_journaling = true;
      intent.confidence = Math.max(intent.confidence, 0.75);
    }
  }

  const nutritionPatterns = [
    /\b(eat|eating|food|nutrition|diet|meal|appetite|nausea)\b/i,
    /\b(smoothie|protein|vitamin|supplement|immune|calories)\b/i,
    /\b(can't eat|hard to eat|what should i eat|lose weight)\b/i,
    /\b(taste change|food aversion|hunger|fullness)\b/i,
  ];

  for (const pattern of nutritionPatterns) {
    if (pattern.test(userMessage)) {
      if (intent.primary_intent === "general_conversation") {
        intent.primary_intent = "nutrition_question";
      }
      intent.pathway_type = 'nutrition';
      intent.requires_education = true;
      intent.confidence = Math.max(intent.confidence, 0.8);
    }
  }

  const contentRequestPatterns = [
    /\b(exercise|practice|meditation|activity|guide|help me)\b/i,
    /\b(what can i do|what should i do|need something|show me)\b/i,
    /\b(breathing|mindfulness|movement|walk)\b/i,
  ];

  for (const pattern of contentRequestPatterns) {
    if (pattern.test(userMessage)) {
      if (intent.primary_intent === "general_conversation") {
        intent.primary_intent = "content_request";
      }
      intent.requires_content_selection = true;
      intent.confidence = Math.max(intent.confidence, 0.75);
    }
  }

  const educationPatterns = [
    /\b(what is|explain|tell me about|learn about|understand)\b/i,
    /\b(why|how does|what does|what are)\b/i,
    /\b(nutrition|diet|food|eating|vitamin|supplement)\b/i,
  ];

  for (const pattern of educationPatterns) {
    if (pattern.test(userMessage)) {
      if (intent.primary_intent === "general_conversation") {
        intent.primary_intent = "education_request";
      }
      intent.requires_education = true;
      intent.confidence = Math.max(intent.confidence, 0.7);
    }
  }

  const saveQuestionPatterns = [
    /\b(save (that|this) question|yes,? save|save it|add (to|that to) my questions)\b/i,
    /\b(save for (later|consultation|appointment)|remember (that|this) question)\b/i,
  ];

  for (const pattern of saveQuestionPatterns) {
    if (pattern.test(userMessage)) {
      intent.primary_intent = "save_consultation_question";
      intent.requires_question_save = true;
      intent.confidence = 0.95;
      break;
    }
  }

  // Detect pathway type from context or message
  if (conversationContext?.pathway_type) {
    intent.pathway_type = conversationContext.pathway_type as any;
  } else {
    // Infer from message content
    if (/\b(meditation|mindful|breath|stillness)\b/i.test(userMessage)) {
      intent.pathway_type = 'meditation';
    } else if (/\b(nutrition|food|eat|diet|supplement)\b/i.test(userMessage)) {
      intent.pathway_type = 'nutrition';
    } else if (/\b(movement|exercise|walk|physical|body)\b/i.test(userMessage)) {
      intent.pathway_type = 'movement';
    } else if (/\b(emotion|feel|boundary|mindful)\b/i.test(userMessage)) {
      intent.pathway_type = 'mindfulness';
    } else {
      intent.pathway_type = 'medical';
    }
  }

  return intent;
}
