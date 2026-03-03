import { createClient } from "jsr:@supabase/supabase-js@2";
import type { DomainContext } from "./types.ts";

export async function buildDomainContext(
  domain: 'bloodwork' | 'condition' | 'nutrition' | 'general',
  userId: string,
  authToken: string
): Promise<string | undefined> {
  if (domain === 'general') {
    return undefined;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authToken },
    },
  });

  if (domain === 'bloodwork') {
    return buildBloodworkContext(supabaseClient, userId);
  }

  if (domain === 'condition') {
    return buildConditionContext(supabaseClient, userId);
  }

  if (domain === 'nutrition') {
    return buildNutritionContext(supabaseClient, userId);
  }

  return undefined;
}

async function buildBloodworkContext(supabaseClient: any, userId: string): Promise<string> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: entries, error } = await supabaseClient
    .from("blood_tests")
    .select(`
      id,
      test_date,
      location,
      blood_markers (
        marker_name,
        value,
        unit
      )
    `)
    .eq("user_id", userId)
    .gte("test_date", twelveMonthsAgo.toISOString().split('T')[0])
    .order("test_date", { ascending: false })
    .limit(20);

  if (error || !entries || entries.length === 0) {
    return buildBloodworkContextPrompt({ entries: [], referenceRanges: {}, dateRange: { start: "", end: "" } });
  }

  const formattedEntries = entries.map((entry: any) => ({
    test_date: entry.test_date,
    location: entry.location,
    markers: (entry.blood_markers || []).map((m: any) => ({
      marker_name: m.marker_name,
      value: m.value,
      unit: m.unit,
    })),
  }));

  const referenceRanges: Record<string, { min: number; max: number; unit: string }> = {
    WBC: { min: 4.0, max: 11.0, unit: "×10⁹/L" },
    RBC: { min: 4.5, max: 5.5, unit: "×10¹²/L" },
    HGB: { min: 13.0, max: 17.0, unit: "g/dL" },
    HCT: { min: 38.0, max: 50.0, unit: "%" },
    PLT: { min: 150, max: 400, unit: "×10⁹/L" },
    NEUT: { min: 2.0, max: 7.5, unit: "×10⁹/L" },
    LYMPH: { min: 1.0, max: 4.0, unit: "×10⁹/L" },
    MONO: { min: 0.2, max: 1.0, unit: "×10⁹/L" },
  };

  const dateRange = {
    start: formattedEntries[formattedEntries.length - 1]?.test_date || "",
    end: formattedEntries[0]?.test_date || "",
  };

  return buildBloodworkContextPrompt({ entries: formattedEntries, referenceRanges, dateRange });
}

function buildBloodworkContextPrompt(bloodworkData: {
  entries: Array<{ test_date: string; location?: string; markers: Array<{ marker_name: string; value: string; unit: string }> }>;
  referenceRanges: Record<string, { min: number; max: number; unit: string }>;
  dateRange: { start: string; end: string };
}): string {
  const { entries, referenceRanges, dateRange } = bloodworkData;

  let contextPrompt = `\n\n===== BLOODWORK DOMAIN CONTEXT =====\n\n`;
  contextPrompt += `DOMAIN: Bloodwork Analysis & Trends\n\n`;

  if (entries.length === 0) {
    contextPrompt += `No bloodwork data available in the past 12 months.\n`;
    contextPrompt += `If the user asks about their blood tests, let them know warmly that you don't see any test results yet and they can add them through the app.\n`;
    return contextPrompt;
  }

  contextPrompt += `===== DATA EXISTS: MANDATORY GROUNDING REQUIRED =====\n\n`;
  contextPrompt += `THE USER HAS BLOODWORK DATA IN THE SYSTEM.\n\n`;
  contextPrompt += `CRITICAL INSTRUCTION: Your response must acknowledge this data exists within your first few sentences.\n`;
  contextPrompt += `You MUST reference the most recent test date: ${dateRange.end}\n`;
  contextPrompt += `You MUST NOT say "I don't see data" or ask them to add results.\n\n`;

  contextPrompt += `Date range: ${dateRange.start} to ${dateRange.end}\n`;
  contextPrompt += `Total tests: ${entries.length}\n\n`;

  contextPrompt += `Recent bloodwork data:\n\n`;
  entries.slice(0, 5).forEach((entry, index) => {
    contextPrompt += `Test ${index + 1} (${entry.test_date})${entry.location ? ` at ${entry.location}` : ''}:\n`;
    entry.markers.forEach(marker => {
      const range = referenceRanges[marker.marker_name];
      if (range) {
        contextPrompt += `  - ${marker.marker_name}: ${marker.value} ${marker.unit} (Reference: ${range.min}-${range.max} ${range.unit})\n`;
      } else {
        contextPrompt += `  - ${marker.marker_name}: ${marker.value} ${marker.unit}\n`;
      }
    });
    contextPrompt += `\n`;
  });

  contextPrompt += `BLOODWORK-SPECIFIC CONVERSATION APPROACH:\n\n`;
  contextPrompt += `This is about NUMERIC TRENDS over time, not clinical documents.\n\n`;
  contextPrompt += `When discussing bloodwork:\n`;
  contextPrompt += `- Always reference specific test dates and values\n`;
  contextPrompt += `- Describe trend direction factually (rising, falling, stable)\n`;
  contextPrompt += `- Explain what markers measure encyclopedically\n`;
  contextPrompt += `- NEVER interpret clinical significance ("this is good/bad/concerning")\n`;
  contextPrompt += `- Use EDUCATE → REASSURE → HANDOFF pattern for fear questions\n`;
  contextPrompt += `- Use CLINICAL CURIOSITY 5-step pattern for "Am I thinking about this right?" questions\n`;
  contextPrompt += `- Proactively offer consultation prep when user shows clinical reasoning\n\n`;

  contextPrompt += `CRITICAL UX RULE - DATA CAPTURE ACKNOWLEDGMENTS:\n\n`;
  contextPrompt += `When a user has just added or uploaded bloodwork data:\n`;
  contextPrompt += `- Provide a brief, warm acknowledgment (e.g., "Entry captured and understood")\n`;
  contextPrompt += `- DO NOT list out all markers, values, or detailed data\n`;
  contextPrompt += `- DO NOT display structured output, JSON, or raw extraction details\n`;
  contextPrompt += `- Keep acknowledgment to 1-2 sentences maximum\n`;
  contextPrompt += `- The data is safely stored; there's no need to prove it by reciting everything back\n\n`;

  contextPrompt += `CRITICAL RULE - CONSULTATION QUESTION SAVING:\n\n`;
  contextPrompt += `GEMMA DOES NOT SAVE QUESTIONS. ONLY THE UI SAVES QUESTIONS.\n\n`;
  contextPrompt += `When you detect a save-worthy question moment (user showing clinical reasoning):\n`;
  contextPrompt += `1. Formulate ONE specific question in quotation marks\n`;
  contextPrompt += `2. Say EXACTLY: "Want me to save that? I can add a save box so you can review and capture: [quoted question]"\n`;
  contextPrompt += `3. NEVER say "Saved", "Added", "Captured", or "Your questions are now..."\n`;
  contextPrompt += `4. You are OFFERING to show a save UI, not saving anything yourself\n`;
  contextPrompt += `5. The user must click "Save" in the UI for persistence to occur\n\n`;
  contextPrompt += `NEVER claim persistence unless the user explicitly confirms they clicked Save in the UI.\n\n`;

  return contextPrompt;
}

async function buildConditionContext(supabaseClient: any, userId: string): Promise<string> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: entries, error } = await supabaseClient
    .from("condition_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("document_date", twelveMonthsAgo.toISOString().split('T')[0])
    .order("document_date", { ascending: false })
    .limit(10);

  if (error || !entries || entries.length === 0) {
    return buildConditionContextPrompt({ entries: [], dateRange: { start: "", end: "" } });
  }

  const formattedEntries = entries.map((entry: any) => ({
    document_date: entry.document_date,
    document_type: entry.document_type,
    clinician_name: entry.clinician_name,
    institution: entry.institution,
    document_body: entry.document_body?.substring(0, 1000) || "",
    summary: entry.summary,
  }));

  const dateRange = {
    start: formattedEntries[formattedEntries.length - 1]?.document_date || "",
    end: formattedEntries[0]?.document_date || "",
  };

  return buildConditionContextPrompt({ entries: formattedEntries, dateRange });
}

function buildConditionContextPrompt(conditionData: {
  entries: Array<{
    document_date: string;
    document_type: string;
    clinician_name: string;
    institution: string;
    document_body: string;
    summary?: string;
  }>;
  dateRange: { start: string; end: string };
}): string {
  const { entries, dateRange } = conditionData;

  let contextPrompt = `\n\n===== CONDITION DOMAIN CONTEXT =====\n\n`;
  contextPrompt += `DOMAIN: Condition Management & Clinical Documents\n\n`;

  if (entries.length === 0) {
    contextPrompt += `No condition documents available in the past 12 months.\n`;
    contextPrompt += `If the user asks about their medical records, let them know warmly that you don't see any documents yet and they can add them through the app.\n`;
    return contextPrompt;
  }

  contextPrompt += `===== DATA EXISTS: MANDATORY GROUNDING REQUIRED =====\n\n`;
  contextPrompt += `THE USER HAS CLINICAL DOCUMENTS IN THE SYSTEM.\n\n`;
  contextPrompt += `CRITICAL INSTRUCTION: Your response must acknowledge these documents exist within your first few sentences.\n`;
  contextPrompt += `You MUST reference the most recent document date: ${dateRange.end}\n`;
  contextPrompt += `You MUST NOT say "I don't see documents" or ask them to add records.\n\n`;

  contextPrompt += `Date range: ${dateRange.start} to ${dateRange.end}\n`;
  contextPrompt += `Total documents: ${entries.length}\n\n`;

  contextPrompt += `Recent clinical documents (truncated for context):\n\n`;
  entries.forEach((entry, index) => {
    contextPrompt += `Document ${index + 1} (${entry.document_date}):\n`;
    contextPrompt += `Type: ${entry.document_type}\n`;
    contextPrompt += `Clinician: ${entry.clinician_name}\n`;
    contextPrompt += `Institution: ${entry.institution}\n`;
    if (entry.summary) {
      contextPrompt += `Summary: ${entry.summary}\n`;
    }
    contextPrompt += `Excerpt: ${entry.document_body}\n\n`;
  });

  contextPrompt += `CONDITION-SPECIFIC CONVERSATION APPROACH:\n\n`;
  contextPrompt += `This is about CLINICAL NARRATIVE LANGUAGE, not numeric trends.\n\n`;
  contextPrompt += `When discussing clinical documents:\n`;
  contextPrompt += `- Always reference specific document dates and types\n`;
  contextPrompt += `- Compare language changes between documents factually\n`;
  contextPrompt += `- Identify new findings vs unchanged observations\n`;
  contextPrompt += `- Explain medical terminology encyclopedically\n`;
  contextPrompt += `- NEVER interpret clinical significance ("this means your condition is worsening")\n`;
  contextPrompt += `- Use EDUCATE → REASSURE → HANDOFF pattern for fear questions\n`;
  contextPrompt += `- Use CLINICAL CURIOSITY 5-step pattern for "Am I thinking about this right?" questions\n`;
  contextPrompt += `- Proactively offer consultation prep when user shows clinical reasoning\n\n`;

  contextPrompt += `CRITICAL UX RULE - DATA CAPTURE ACKNOWLEDGMENTS:\n\n`;
  contextPrompt += `When a user has just uploaded or added a clinical document:\n`;
  contextPrompt += `- Provide a brief, warm acknowledgment (e.g., "Document captured and understood")\n`;
  contextPrompt += `- DO NOT list out timeline events, diagnoses, providers, or detailed extraction data\n`;
  contextPrompt += `- DO NOT display structured output, JSON, or raw analysis details\n`;
  contextPrompt += `- Keep acknowledgment to 1-2 sentences maximum\n`;
  contextPrompt += `- The data is safely stored; there's no need to prove it by reciting everything back\n\n`;

  contextPrompt += `CRITICAL RULE - CONSULTATION QUESTION SAVING:\n\n`;
  contextPrompt += `GEMMA DOES NOT SAVE QUESTIONS. ONLY THE UI SAVES QUESTIONS.\n\n`;
  contextPrompt += `When you detect a save-worthy question moment (user showing clinical reasoning):\n`;
  contextPrompt += `1. Formulate ONE specific question in quotation marks\n`;
  contextPrompt += `2. Say EXACTLY: "Want me to save that? I can add a save box so you can review and capture: [quoted question]"\n`;
  contextPrompt += `3. NEVER say "Saved", "Added", "Captured", or "Your questions are now..."\n`;
  contextPrompt += `4. You are OFFERING to show a save UI, not saving anything yourself\n`;
  contextPrompt += `5. The user must click "Save" in the UI for persistence to occur\n\n`;
  contextPrompt += `NEVER claim persistence unless the user explicitly confirms they clicked Save in the UI.\n\n`;

  return contextPrompt;
}

async function buildNutritionContext(supabaseClient: any, userId: string): Promise<string> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: entries, error } = await supabaseClient
    .from("nutrition_entries")
    .select("*")
    .eq("user_id", userId)
    .gte("entry_date", thirtyDaysAgo.toISOString())
    .order("entry_date", { ascending: false })
    .limit(30);

  const { data: preferences } = await supabaseClient
    .from("nutrition_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !entries || entries.length === 0) {
    return buildNutritionContextPrompt({
      entries: [],
      dateRange: { start: "", end: "" },
      conditionVerified: preferences?.condition_verified || false,
      verifiedDiagnosis: preferences?.verified_diagnosis || null,
    });
  }

  const formattedEntries = entries.map((entry: any) => ({
    entry_date: entry.entry_date,
    entry_type: entry.entry_type,
    ai_interpretation: entry.ai_interpretation,
    user_notes: entry.user_notes,
  }));

  const dateRange = {
    start: formattedEntries[formattedEntries.length - 1]?.entry_date || "",
    end: formattedEntries[0]?.entry_date || "",
  };

  return buildNutritionContextPrompt({
    entries: formattedEntries,
    dateRange,
    conditionVerified: preferences?.condition_verified || false,
    verifiedDiagnosis: preferences?.verified_diagnosis || null,
  });
}

function buildNutritionContextPrompt(nutritionData: {
  entries: Array<{
    entry_date: string;
    entry_type: string;
    ai_interpretation: any;
    user_notes?: string;
  }>;
  dateRange: { start: string; end: string };
  conditionVerified: boolean;
  verifiedDiagnosis: string | null;
}): string {
  const { entries, dateRange, conditionVerified, verifiedDiagnosis } = nutritionData;

  let contextPrompt = `\n\n===== NUTRITION DOMAIN CONTEXT =====\n\n`;
  contextPrompt += `DOMAIN: Nutrition Reflection & Pattern Observation\n\n`;

  contextPrompt += `===== CRITICAL NUTRITION SAFETY RULES =====\n\n`;
  contextPrompt += `YOU ARE IN NUTRITION REFLECTION MODE. MANDATORY CONSTRAINTS:\n\n`;
  contextPrompt += `1. PATTERN-ONLY LANGUAGE:\n`;
  contextPrompt += `   - ALWAYS frame responses as observations: "I've noticed...", "Looking at your entries..."\n`;
  contextPrompt += `   - NEVER use prescriptive language: "you should", "you need to", "you must"\n`;
  contextPrompt += `   - NEVER diagnose deficiencies or claim sufficiency\n\n`;

  contextPrompt += `2. NO QUANTITIES EVER:\n`;
  contextPrompt += `   - NEVER state grams, milligrams, calories, percentages, RDAs\n`;
  contextPrompt += `   - NEVER give numeric nutrient amounts\n`;
  contextPrompt += `   - Use ONLY frequency language: "appeared in X of Y meals", "X days this week"\n\n`;

  contextPrompt += `3. NO MEDICAL CLAIMS:\n`;
  contextPrompt += `   - NEVER say foods will cure, treat, prevent, or heal\n`;
  contextPrompt += `   - NEVER claim foods will increase/decrease blood counts\n`;
  contextPrompt += `   - Use indicative language: "may support", "is associated with"\n\n`;

  contextPrompt += `4. NO JUDGEMENT:\n`;
  contextPrompt += `   - NEVER judge food choices as good/bad/poor/unhealthy\n`;
  contextPrompt += `   - NEVER praise or criticize\n`;
  contextPrompt += `   - NEVER express disappointment or concern\n\n`;

  contextPrompt += `5. AUTOMATIC DEFLECTION:\n`;
  contextPrompt += `   - If user asks about food safety → deflect to care team immediately\n`;
  contextPrompt += `   - If user mentions blood counts, symptoms, medications → offer consultation prep\n`;
  contextPrompt += `   - If user asks "is this enough/sufficient" → reframe as pattern observation\n\n`;

  if (conditionVerified && verifiedDiagnosis) {
    contextPrompt += `VERIFIED CONDITION: ${verifiedDiagnosis}\n`;
    contextPrompt += `The user has confirmed their diagnosis. You may reference condition-appropriate support areas.\n`;
    contextPrompt += `Use indicative language only: "Foods rich in X may support Y"\n\n`;
  } else {
    contextPrompt += `CONDITION NOT VERIFIED: Generic wellness mode only.\n`;
    contextPrompt += `Do not make condition-specific suggestions.\n\n`;
  }

  if (entries.length === 0) {
    contextPrompt += `No nutrition entries available in the past 30 days.\n`;
    contextPrompt += `If the user asks about their nutrition patterns, let them know warmly that you don't see any entries yet and they can add meals through the app.\n`;
    return contextPrompt;
  }

  contextPrompt += `===== DATA EXISTS: PATTERN OBSERVATION READY =====\n\n`;
  contextPrompt += `THE USER HAS NUTRITION ENTRIES IN THE SYSTEM.\n\n`;
  contextPrompt += `Date range: ${dateRange.start} to ${dateRange.end}\n`;
  contextPrompt += `Total entries: ${entries.length}\n\n`;

  const supportAreaCounts: Record<string, number> = {};
  const foodCategoryCounts: Record<string, number> = {};

  entries.forEach(entry => {
    const interpretation = entry.ai_interpretation;
    if (interpretation?.supportAreas) {
      interpretation.supportAreas.forEach((area: string) => {
        supportAreaCounts[area] = (supportAreaCounts[area] || 0) + 1;
      });
    }
    if (interpretation?.foodCategories) {
      interpretation.foodCategories.forEach((category: string) => {
        foodCategoryCounts[category] = (foodCategoryCounts[category] || 0) + 1;
      });
    }
  });

  contextPrompt += `SUPPORT AREA FREQUENCIES (last 30 days):\n`;
  Object.entries(supportAreaCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([area, count]) => {
      contextPrompt += `  - ${area}: appeared in ${count} of ${entries.length} entries\n`;
    });
  contextPrompt += `\n`;

  contextPrompt += `SUPPORT LENS PATTERNS (VISUAL SIGNALS):\n\n`;
  contextPrompt += `The user's recent nutrition entries show these presence patterns across support lenses:\n\n`;
  contextPrompt += `CRITICAL: These are NOT scores, targets, or recommendations.\n`;
  contextPrompt += `These are observed food presence patterns that may support different body systems.\n\n`;

  contextPrompt += `When discussing lenses with the user:\n`;
  contextPrompt += `- Use "I've noticed..." or "Looking at your patterns..."\n`;
  contextPrompt += `- ALWAYS frame as observation, never prescription\n`;
  contextPrompt += `- Example: "I've noticed inflammation-supporting foods appearing consistently this week"\n`;
  contextPrompt += `- NEVER say "you're doing well" or "you need more"\n`;
  contextPrompt += `- If user asks about adequacy → reframe as pattern observation, defer medical to care team\n\n`;

  contextPrompt += `EXAMPLE RECENT ENTRIES:\n`;
  entries.slice(0, 5).forEach((entry, index) => {
    const date = new Date(entry.entry_date).toLocaleDateString();
    contextPrompt += `Entry ${index + 1} (${date}) - ${entry.entry_type}:\n`;
    if (entry.ai_interpretation?.foodCategories) {
      contextPrompt += `  Categories: ${entry.ai_interpretation.foodCategories.join(', ')}\n`;
    }
    if (entry.ai_interpretation?.supportAreas) {
      contextPrompt += `  Support areas: ${entry.ai_interpretation.supportAreas.join(', ')}\n`;
    }
    if (entry.user_notes) {
      contextPrompt += `  Notes: ${entry.user_notes}\n`;
    }
    contextPrompt += `\n`;
  });

  contextPrompt += `NUTRITION-SPECIFIC CONVERSATION APPROACH:\n\n`;
  contextPrompt += `BE OPEN, EDUCATIONAL, AND HELPFUL BY DEFAULT.\n\n`;
  contextPrompt += `This is about MEAL PATTERNS over time, not dietary prescriptions.\n\n`;
  contextPrompt += `CORE TONE - Confident, Educational, Positive:\n`;
  contextPrompt += `- Describe patterns warmly: "I've noticed protein-rich foods in 8 of your last 10 entries"\n`;
  contextPrompt += `- Explain connections: "Salmon contains omega-3 fatty acids that research suggests may help manage inflammation"\n`;
  contextPrompt += `- Educate actively: "Leafy greens like spinach contain iron and folate, nutrients that support blood cell production"\n`;
  contextPrompt += `- Reference support lenses naturally: "I've noticed inflammation-supporting foods appearing consistently"\n`;
  contextPrompt += `- Connect food → nutrients → body systems: "Protein provides amino acids for cellular repair processes"\n`;
  contextPrompt += `- Use confident, human language: "is often discussed", "research suggests", "may support"\n\n`;

  contextPrompt += `WHAT TO AVOID (Always):\n`;
  contextPrompt += `- NEVER prescribe: Don't say "you should eat X" or "you must add Y"\n`;
  contextPrompt += `- NEVER quantify: Don't say "you're getting X grams" or "Y% of daily needs"\n`;
  contextPrompt += `- NEVER claim outcomes: Don't say "this will improve your counts" or "eating X will treat Y"\n\n`;

  contextPrompt += `WHEN TO DEFLECT (Only These Specific Questions):\n`;
  contextPrompt += `1. BLOOD COUNT CHANGES: "Will this food increase/decrease my platelets/WBC/RBC?"\n`;
  contextPrompt += `   → Acknowledge value, explain connection generally, redirect: "That's a great question for your care team since they track your specific counts"\n\n`;

  contextPrompt += `2. TREATMENT EFFECTS: "Will this food help my condition/treatment?"\n`;
  contextPrompt += `   → Acknowledge value, educate generally, redirect: "While [food] contains [nutrient] that supports [system], your care team can best advise on your treatment context"\n\n`;

  contextPrompt += `3. MEDICAL DECISIONS: "Should I eat this instead of my medication?" or "Can I stop treatment if I eat better?"\n`;
  contextPrompt += `   → Immediate redirect: "That's a medical decision only your care team can guide you on"\n\n`;

  contextPrompt += `4. FOOD SAFETY: Raw/undercooked/expired foods, especially for immunocompromised patients\n`;
  contextPrompt += `   → Immediate redirect: "Food safety is critical - please check with your care team about what's safe for you"\n\n`;

  contextPrompt += `FOR ALL OTHER QUESTIONS - BE HELPFUL:\n`;
  contextPrompt += `- "What nutrients are in salmon?" → EXPLAIN confidently\n`;
  contextPrompt += `- "Why are people talking about berries?" → EDUCATE about antioxidants, polyphenols\n`;
  contextPrompt += `- "What does protein do?" → EXPLAIN amino acids, cellular repair, immune function\n`;
  contextPrompt += `- "How do omega-3s work?" → EDUCATE about inflammation pathways (generally)\n`;
  contextPrompt += `- "Is variety important?" → EXPLAIN micronutrient diversity, phytonutrient benefits\n\n`;

  contextPrompt += `DEFLECTION PATTERN (when needed):\n`;
  contextPrompt += `1. ACKNOWLEDGE: "That's a thoughtful question"\n`;
  contextPrompt += `2. EDUCATE: Explain the general connection (food → nutrient → system)\n`;
  contextPrompt += `3. BOUNDARY: "Your care team can best advise on your specific situation"\n`;
  contextPrompt += `4. OFFER: "Want me to save that as a question for your next appointment?"\n\n`;

  contextPrompt += `CRITICAL UX RULE - DATA CAPTURE ACKNOWLEDGMENTS:\n\n`;
  contextPrompt += `When a user has just added a nutrition entry:\n`;
  contextPrompt += `- Provide a brief, warm acknowledgment (e.g., "Entry captured")\n`;
  contextPrompt += `- DO NOT list out all food categories or support areas\n`;
  contextPrompt += `- DO NOT display structured output or analysis details\n`;
  contextPrompt += `- Keep acknowledgment to 1-2 sentences maximum\n\n`;

  contextPrompt += `CRITICAL RULE - CONSULTATION QUESTION SAVING:\n\n`;
  contextPrompt += `GEMMA DOES NOT SAVE QUESTIONS. ONLY THE UI SAVES QUESTIONS.\n\n`;
  contextPrompt += `When user asks medical/treatment questions about nutrition:\n`;
  contextPrompt += `1. Formulate ONE specific question in quotation marks\n`;
  contextPrompt += `2. Say EXACTLY: "This sounds like a question for your care team. Want me to save it? I can add: [quoted question]"\n`;
  contextPrompt += `3. NEVER say "Saved", "Added", or "Captured"\n`;
  contextPrompt += `4. You are OFFERING to show a save UI, not saving anything yourself\n`;
  contextPrompt += `5. The user must click "Save" in the UI for persistence to occur\n\n`;

  return contextPrompt;
}
