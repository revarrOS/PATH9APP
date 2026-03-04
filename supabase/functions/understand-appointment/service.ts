import { getProviderRole } from "./provider-roles.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";

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
  async parse(
    userMessage: string,
    userId: string,
    context: Record<string, unknown>
  ): Promise<AppointmentUnderstanding> {
    const extraction = await this.extractAppointmentData(userMessage, userId);
    const roleExplanation = this.explainRole(extraction.provider_role);
    const prepTips = this.generatePrepTips(
      extraction.appointment_type,
      extraction.provider_role
    );
    const questions = this.generateQuestions(
      extraction.appointment_type,
      extraction.provider_role,
      context
    );

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
- appointment_datetime: ISO 8601 format (e.g., "2025-12-26T14:00:00Z"), or null if not mentioned
- provider_name: Doctor's name, or null if not mentioned
- provider_role: Medical specialty (oncologist, surgeon, etc.), or null if not mentioned
- appointment_type: consultation, treatment, follow-up, imaging, surgery, or null
- location: Hospital/clinic name or address, or null if not mentioned
- confidence_score: 1-10, how confident are you in the extraction

If information is missing, set to null. Don't guess. If you're inferring from context, lower the confidence score.`;

    const userPrompt = `Extract appointment information from this message:\n\n"${userMessage}"`;

    try {
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
      const llmResponse = data.response || data.data?.response || "";

      const cleanResponse = llmResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error("Appointment extraction error:", error);
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
    if (!role) {
      return "I couldn't identify the type of appointment from your message. Could you tell me more about who you're seeing?";
    }

    const roleInfo = getProviderRole(role);
    if (roleInfo) {
      return `Your ${roleInfo.role} is a ${roleInfo.description}.`;
    }

    return `This is an appointment with a ${role}.`;
  }

  private generatePrepTips(
    appointmentType: string | null,
    providerRole: string | null
  ): string[] {
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

    if (providerRole === "surgeon" || providerRole === "surgical oncologist") {
      tips.push("Ask about surgery recovery time and what to expect");
      tips.push("Understand surgical options (if applicable)");
      tips.push("Ask about risks and benefits of the procedure");
    }

    if (appointmentType === "imaging") {
      tips.push("Wear comfortable clothing without metal");
      tips.push("Ask when results will be available");
      tips.push("Follow any fasting or preparation instructions provided");
    }

    if (appointmentType === "treatment") {
      tips.push("Bring something to do during treatment (book, music, etc.)");
      tips.push("Arrange for someone to drive you home if needed");
      tips.push("Wear comfortable, loose-fitting clothing");
    }

    return tips;
  }

  private generateQuestions(
    appointmentType: string | null,
    providerRole: string | null,
    context: Record<string, unknown>
  ): string[] {
    const questions: string[] = [];

    questions.push("What are my treatment options?");
    questions.push("What are the side effects I should watch for?");
    questions.push("When will I know the results?");

    if (providerRole === "oncologist" || providerRole === "medical oncologist") {
      questions.push("What stage is my cancer?");
      questions.push("What's the treatment timeline?");
      questions.push("Will I need chemotherapy, radiation, or both?");
      questions.push("What's my prognosis?");
      questions.push("Are there clinical trials I should consider?");
    }

    if (providerRole === "surgeon" || providerRole === "surgical oncologist") {
      questions.push("What type of surgery do you recommend and why?");
      questions.push("How long is the recovery period?");
      questions.push("Will I need reconstruction?");
      questions.push("What are the risks of surgery?");
      questions.push("Will I need additional treatment after surgery?");
    }

    if (providerRole === "radiation oncologist") {
      questions.push("How many radiation sessions will I need?");
      questions.push("What side effects should I expect?");
      questions.push("How will you protect healthy tissue?");
      questions.push("What should I do to care for my skin during treatment?");
    }

    if (appointmentType === "follow-up") {
      questions.push("How am I doing compared to expectations?");
      questions.push("Do we need to adjust my treatment plan?");
      questions.push("What should I do if symptoms get worse?");
      questions.push("When is my next appointment?");
    }

    return questions.slice(0, 8);
  }
}
