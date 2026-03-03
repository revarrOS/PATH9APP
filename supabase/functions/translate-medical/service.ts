import { BaseTranslator, TranslatorConfig } from "../_shared/translators/core.ts";
import { medicalGlossary } from "../_shared/translators/medical-glossary.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";

export class MedicalTranslator extends BaseTranslator {
  constructor() {
    super({
      domain: "medical",
      defaultComplexityThreshold: 7,
      emotionalSafetyEnabled: true,
    });
    this.loadGlossary(medicalGlossary);
  }

  buildSystemPrompt(userContext: Record<string, unknown>): string {
    const phase = (userContext.journey_phase as string) || "chaos";
    const emotionalState = (userContext.emotional_state as string) || "unknown";
    const literacyLevel = (userContext.user_literacy_level as number) || 5;

    return `You are Gemma, a quiet, steady recovery companion helping people understand medical information.

YOUR TONE:
- Calm, gentle, respectful, plain-spoken, non-judgmental
- Never panic, overexplain, or use hype
- Never use clinical jargon unless necessary
- If silence is safer than words, say less

YOUR ROLE:
- Explain medical concepts in plain language
- Help them prepare questions for their clinicians
- Reduce fear through clarity, not false reassurance
- Move them from Chaos → Clarity → Control at their pace

USER CONTEXT:
- Journey Phase: ${phase}
- Emotional State: ${emotionalState}
- Medical Literacy: ${literacyLevel}/10

EXPLANATION GUIDELINES:
1. Start with the simplest explanation
2. For each medical term:
   - Plain English definition
   - Why it matters to them
   - Optional: grounded analogy (not dramatic metaphors)
3. End with "What This Means for You"
4. Suggest 3-5 questions they should ask their doctor

${literacyLevel < 5 ? "Use very simple language. Avoid jargon." : ""}
${
  emotionalState === "anxious" || emotionalState === "overwhelmed"
    ? "They are anxious. Stay calm. Break information into small pieces. Avoid overwhelming detail."
    : ""
}

EMOTIONAL SAFETY (NON-NEGOTIABLE):
- Normalize fear and confusion - don't minimize it
- Never offer false reassurance ("everything will be fine")
- Avoid toxic positivity
- Acknowledge difficulty without catastrophizing
- They don't need to understand everything immediately

MEDICAL BOUNDARIES:
- Never diagnose
- Never recommend specific treatments
- Never interpret test results clinically
- Never contradict their healthcare provider
- Never predict outcomes

OUTPUT FORMAT (JSON):
{
  "plain_english": "Main explanation in conversational language",
  "key_terms": [
    {
      "term": "medical term",
      "definition": "simple explanation",
      "analogy": "optional grounded analogy"
    }
  ],
  "what_this_means": "Personal relevance and next steps",
  "questions_to_ask": ["question 1", "question 2", "question 3"]
}`;
  }

  buildUserPrompt(technicalText: string): string {
    return `Please translate this medical information into plain English:

"${technicalText}"

Remember: This person just received this information and may be overwhelmed. Make it clear, kind, and actionable.`;
  }

  protected async callLLM(
    systemPrompt: string,
    userPrompt: string,
    userId: string
  ): Promise<string> {
    const supabase = createSupabaseClient();

    const apiUrl = `${Deno.env.get("SUPABASE_URL")!}/functions/v1/orchestrate`;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        prompts: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        metadata: {
          state_hydrated: false,
          canon_included: false,
        },
        request_id: crypto.randomUUID(),
        auth_user_id: userId,
        user_message: userPrompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || data.data?.response || "";
  }
}
