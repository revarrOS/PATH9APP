import type { IntentClassification } from "./intent-classifier.ts";

export interface ServiceResponse {
  service_name: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface EnrichedContext {
  medical_translation?: unknown;
  appointment_info?: unknown;
  timeline_info?: unknown;
  safety_check?: unknown;
  journal_entry?: unknown;
  selected_content?: unknown;
  education?: unknown;
}

export async function routeToServices(
  intent: IntentClassification,
  userMessage: string,
  userId: string,
  context: Record<string, unknown>
): Promise<EnrichedContext> {
  const enrichedContext: EnrichedContext = {};
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const servicePromises: Promise<void>[] = [];

  if (intent.requires_safety_check) {
    servicePromises.push(
      (async () => {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/safety-guardrails`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              user_message: userMessage,
              save_to_database: true,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            enrichedContext.safety_check = data.data;
          }
        } catch (error) {
          console.error("Safety check service error:", error);
        }
      })()
    );
  }

  if (intent.requires_medical_translation) {
    servicePromises.push(
      (async () => {
        try {
          // Parse diagnosis information from user message
          const diagnosisPatterns = {
            name: /diagnosed with\s+([^.,\n]+)/i,
            cll: /\b(CLL|chronic lymphocytic leukemia)\b/i,
            aml: /\b(AML|acute myeloid leukemia)\b/i,
            stage: /stage\s+([0-4IViv]+)/i,
            date: /on\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
          };

          let diagnosisName = "Unknown";
          const diagnosisDate = new Date().toISOString().split("T")[0];

          const nameMatch = userMessage.match(diagnosisPatterns.name);
          if (nameMatch) {
            diagnosisName = nameMatch[1].trim();
          } else if (diagnosisPatterns.cll.test(userMessage)) {
            diagnosisName = "Chronic Lymphocytic Leukemia (CLL)";
          } else if (diagnosisPatterns.aml.test(userMessage)) {
            diagnosisName = "Acute Myeloid Leukemia (AML)";
          }

          const stageMatch = userMessage.match(diagnosisPatterns.stage);
          const stage = stageMatch ? stageMatch[1] : undefined;

          const response = await fetch(`${supabaseUrl}/functions/v1/translate-medical`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              user_id: userId,
              technical_text: userMessage,
              context: {
                journey_phase: context.journey_phase,
                emotional_state: context.emotional_state,
                user_literacy_level: context.user_literacy_level,
              },
              save_to_diagnosis: true,
              diagnosis_metadata: {
                diagnosis_name: diagnosisName,
                diagnosis_date: diagnosisDate,
                stage_or_severity: stage,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            enrichedContext.medical_translation = data.data;
          }
        } catch (error) {
          console.error("Medical translation service error:", error);
        }
      })()
    );
  }

  if (intent.requires_appointment_understanding) {
    servicePromises.push(
      (async () => {
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/understand-appointment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                user_id: userId,
                user_message: userMessage,
                context: {
                  journey_phase: context.journey_phase,
                },
                save_to_database: true,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            enrichedContext.appointment_info = data.data;
          }
        } catch (error) {
          console.error("Appointment understanding service error:", error);
        }
      })()
    );
  }

  if (intent.requires_timeline_inference) {
    servicePromises.push(
      (async () => {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/infer-timeline`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              save_to_database: true,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            enrichedContext.timeline_info = data.data;
          }
        } catch (error) {
          console.error("Timeline inference service error:", error);
        }
      })()
    );
  }

  if (intent.requires_journaling) {
    servicePromises.push(
      (async () => {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/journal-entry`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              pathwayType: intent.pathway_type || 'medical',
              entryText: userMessage,
              emotionalTags: [],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            enrichedContext.journal_entry = data.entry;
          }
        } catch (error) {
          console.error("Journaling service error:", error);
        }
      })()
    );
  }

  if (intent.requires_content_selection) {
    servicePromises.push(
      (async () => {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/select-content`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              pathwayType: intent.pathway_type || 'medical',
              userState: {
                emotionalState: context.emotional_state || 'neutral',
                energyLevel: context.energy_level || 'medium',
                context: {},
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            enrichedContext.selected_content = data.content;
          }
        } catch (error) {
          console.error("Content selection service error:", error);
        }
      })()
    );
  }

  if (intent.requires_education) {
    servicePromises.push(
      (async () => {
        try {
          const topicKey = `${intent.pathway_type}_${Date.now()}`;
          const response = await fetch(`${supabaseUrl}/functions/v1/generate-education`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              pathwayType: intent.pathway_type || 'medical',
              topicKey,
              sourceText: userMessage,
              context: {
                journey_phase: context.journey_phase,
                user_literacy_level: context.user_literacy_level,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            enrichedContext.education = data.education;
          }
        } catch (error) {
          console.error("Education generation service error:", error);
        }
      })()
    );
  }

  if (intent.pathway_type === 'nutrition' && intent.primary_intent === 'nutrition_question') {
    servicePromises.push(
      (async () => {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/nutrition-reality`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              user_concern: userMessage,
              current_symptoms: context.symptoms || [],
              treatment_phase: context.journey_phase || 'chaos',
              emotional_state: context.emotional_state || 'uncertain',
            }),
          });

          if (response.ok) {
            const data = await response.json();
            enrichedContext.nutrition_guidance = data.data;
          }
        } catch (error) {
          console.error("Nutrition guidance service error:", error);
        }
      })()
    );
  }

  await Promise.all(servicePromises);

  return enrichedContext;
}
