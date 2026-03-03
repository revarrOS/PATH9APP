import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  validateEnvelope,
  validateAuth,
  checkRateLimit,
  validateUserIdMatch,
  logAuditEvent,
  PolicyViolation,
} from "./policy.ts";
import { loadPromptRegistry, getPromptVersions } from "./prompt-registry.ts";
import { enforcePrompts } from "./enforcement.ts";
import { EnforcementViolation } from "./types.ts";
import { retrieveCanonChunks, formatCanonContext } from "./canon-retrieval.ts";
import { callLLM, getLLMConfig } from "./llm-adapter.ts";
import { classifyIntent } from "./intent-classifier.ts";
import { routeToServices, type EnrichedContext } from "./service-router.ts";
import {
  getConversationHistory,
  saveConversationHistory,
  formatConversationForLLM
} from "./conversation-manager.ts";
import { buildDomainContext } from "./domain-context-builder.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface StandardError {
  error: string;
  code: string;
  request_id?: string;
  violations?: (PolicyViolation | EnforcementViolation)[];
}

let promptRegistry: ReturnType<typeof loadPromptRegistry> | null = null;

function initializePromptRegistry() {
  if (!promptRegistry) {
    try {
      promptRegistry = loadPromptRegistry();
      console.log("Prompt registry loaded successfully");
    } catch (error) {
      console.error("CRITICAL: Failed to load prompt registry:", error);
      throw error;
    }
  }
  return promptRegistry;
}

function createErrorResponse(
  error: string,
  code: string,
  status: number,
  request_id?: string,
  violations?: (PolicyViolation | EnforcementViolation)[]
): Response {
  const errorBody: StandardError = {
    error,
    code,
    request_id,
    violations,
  };

  return new Response(JSON.stringify(errorBody), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return createErrorResponse(
      "Method not allowed",
      "METHOD_NOT_ALLOWED",
      405
    );
  }

  try {
    const authResult = await validateAuth(req);
    if (!authResult.valid) {
      return createErrorResponse(
        authResult.error || "Authentication required",
        "UNAUTHORIZED",
        401
      );
    }

    const auth_user_id = authResult.user_id!;

    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse(
        "Invalid JSON in request body",
        "INVALID_JSON",
        400
      );
    }

    const envelopeResult = await validateEnvelope(body);
    if (!envelopeResult.valid) {
      await logAuditEvent(
        auth_user_id,
        "policy_block",
        body?.request_id || "unknown",
        {
          reason: "invalid_envelope",
          violations: envelopeResult.violations,
        }
      );

      return createErrorResponse(
        "Request envelope validation failed",
        "INVALID_ENVELOPE",
        400,
        body?.request_id,
        envelopeResult.violations
      );
    }

    const envelope_user_id = envelopeResult.user_id!;
    const request_id = body.request_id;

    const userMatchResult = await validateUserIdMatch(
      envelope_user_id,
      auth_user_id
    );
    if (!userMatchResult.valid) {
      await logAuditEvent(auth_user_id, "policy_block", request_id, {
        reason: "user_id_mismatch",
        violations: userMatchResult.violations,
      });

      return createErrorResponse(
        "User ID validation failed",
        "USER_ID_MISMATCH",
        403,
        request_id,
        userMatchResult.violations
      );
    }

    const rateLimitResult = checkRateLimit(auth_user_id);
    if (!rateLimitResult.allowed) {
      await logAuditEvent(auth_user_id, "policy_block", request_id, {
        reason: "rate_limit_exceeded",
      });

      return createErrorResponse(
        "Rate limit exceeded",
        "RATE_LIMIT_EXCEEDED",
        429,
        request_id
      );
    }

    await logAuditEvent(auth_user_id, "policy_pass", request_id, {
      rate_limit_remaining: rateLimitResult.remaining,
    });

    const registry = initializePromptRegistry();

    const state = body.journey_state || {};

    const retrievalContext = {
      journey_phase: state.journey_phase,
      topic_hint: state.topic_hint,
      pillar: state.pillar,
    };

    await logAuditEvent(auth_user_id, "retrieval_attempt", request_id, {
      journey_phase: retrievalContext.journey_phase,
    });

    const retrievalResult = await retrieveCanonChunks(retrievalContext);

    if (retrievalResult.count > 0) {
      await logAuditEvent(auth_user_id, "retrieval_success", request_id, {
        chunk_count: retrievalResult.count,
        canon_version_ids: retrievalResult.canon_version_ids,
      });
    } else {
      await logAuditEvent(auth_user_id, "retrieval_none", request_id, {
        reason: "no_matching_chunks",
      });
    }

    const canonContext = retrievalResult.count > 0
      ? formatCanonContext(retrievalResult.chunks)
      : undefined;

    const domain = (state.domain || state.pillar || 'general') as 'bloodwork' | 'condition' | 'general';
    const authHeader = req.headers.get("Authorization") || "";

    let domainContext: string | undefined;
    if (domain !== 'general') {
      try {
        domainContext = await buildDomainContext(domain, auth_user_id, authHeader);
        await logAuditEvent(auth_user_id, "domain_context_built", request_id, {
          domain,
          context_generated: !!domainContext,
        });
      } catch (error) {
        console.error("Error building domain context:", error);
        await logAuditEvent(auth_user_id, "domain_context_error", request_id, {
          domain,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const userMessage = (body as { user_message?: string }).user_message;

    let enrichedContext: EnrichedContext | undefined;
    let safetyCheckBlocked = false;

    if (userMessage) {
      await logAuditEvent(auth_user_id, "intent_classification_attempt", request_id, {});

      const intent = await classifyIntent(userMessage, state);

      await logAuditEvent(auth_user_id, "intent_classification_complete", request_id, {
        primary_intent: intent.primary_intent,
        confidence: intent.confidence,
        requires_medical_translation: intent.requires_medical_translation,
        requires_appointment_understanding: intent.requires_appointment_understanding,
        requires_timeline_inference: intent.requires_timeline_inference,
      });

      if (
        intent.requires_medical_translation ||
        intent.requires_appointment_understanding ||
        intent.requires_timeline_inference ||
        intent.requires_safety_check
      ) {
        await logAuditEvent(auth_user_id, "service_routing_attempt", request_id, {
          intent: intent.primary_intent,
        });

        enrichedContext = await routeToServices(intent, userMessage, auth_user_id, state);

        await logAuditEvent(auth_user_id, "service_routing_complete", request_id, {
          services_called: Object.keys(enrichedContext),
        });

        if (enrichedContext.safety_check) {
          const safetyCheck = enrichedContext.safety_check as {
            is_safe: boolean;
            severity_score: number;
            intervention_content?: string;
            escalation_required: boolean;
          };

          if (!safetyCheck.is_safe || safetyCheck.escalation_required) {
            safetyCheckBlocked = true;

            await logAuditEvent(auth_user_id, "safety_intervention", request_id, {
              severity_score: safetyCheck.severity_score,
              escalation_required: safetyCheck.escalation_required,
            });

            const crisisResponse = {
              success: true,
              data: {
                response: safetyCheck.intervention_content || "Your safety is our priority. Please reach out to a crisis resource.",
                journey_state: body.journey_state,
                processed_at: new Date().toISOString(),
                safety_intervention: true,
                escalation_required: safetyCheck.escalation_required,
              },
              request_id,
            };

            return new Response(JSON.stringify(crisisResponse), {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            });
          }
        }
      }
    }

    const enforcementResult = enforcePrompts(registry, state, canonContext, domainContext);

    if (!enforcementResult.valid) {
      await logAuditEvent(auth_user_id, "enforcement_block", request_id, {
        reason: "prompt_enforcement_failed",
        violations: enforcementResult.violations,
      });

      return createErrorResponse(
        "Prompt enforcement failed",
        "ENFORCEMENT_FAILED",
        400,
        request_id,
        enforcementResult.violations
      );
    }

    const promptVersions = getPromptVersions(registry);

    await logAuditEvent(auth_user_id, "enforcement_pass", request_id, {
      prompt_version_ids: promptVersions,
      state_hydrated: enforcementResult.assembled_prompts?.metadata.state_hydrated,
      canon_included: enforcementResult.assembled_prompts?.metadata.canon_included,
    });

    const llmConfig = getLLMConfig();

    const conversationHistory = await getConversationHistory(auth_user_id);

    await logAuditEvent(auth_user_id, "llm_call_attempt", request_id, {
      provider: llmConfig.provider,
      model: llmConfig.model,
      temperature: llmConfig.temperature,
      max_tokens: llmConfig.max_tokens,
      prompt_count: enforcementResult.assembled_prompts!.prompts.length,
      conversation_messages: conversationHistory.messages.length,
    });

    const formattedHistory = conversationHistory.messages.length > 0
      ? conversationHistory.messages.map(msg => ({ role: msg.role, content: msg.content }))
      : undefined;

    const llmResponse = await callLLM(
      enforcementResult.assembled_prompts!,
      request_id,
      auth_user_id,
      userMessage,
      formattedHistory
    );

    if (!llmResponse.success) {
      await logAuditEvent(auth_user_id, "llm_call_failure", request_id, {
        provider: llmResponse.metadata.provider,
        model: llmResponse.metadata.model,
        error: llmResponse.error,
      });

      console.error("LLM call failed:", {
        provider: llmResponse.metadata.provider,
        model: llmResponse.metadata.model,
        error: llmResponse.error,
      });

      return createErrorResponse(
        `LLM call failed: ${llmResponse.error || 'Unknown error'}`,
        "LLM_CALL_FAILED",
        500,
        request_id
      );
    }

    await logAuditEvent(auth_user_id, "llm_call_success", request_id, {
      provider: llmResponse.metadata.provider,
      model: llmResponse.metadata.model,
      prompt_tokens: llmResponse.metadata.prompt_tokens,
      completion_tokens: llmResponse.metadata.completion_tokens,
      total_tokens: llmResponse.metadata.total_tokens,
    });

    console.log("ANTHROPIC_RESPONSE_RECEIVED");
    console.log("First 200 chars:", llmResponse.response?.substring(0, 200) || "NO_RESPONSE");

    if (userMessage && llmResponse.response) {
      await saveConversationHistory(
        auth_user_id,
        userMessage,
        llmResponse.response,
        {
          domain: state.pillar || 'general',
          journey_phase: state.journey_phase,
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    await logAuditEvent(auth_user_id, "output_validation_attempt", request_id, {});

    const outputValidationUrl = `${supabaseUrl}/functions/v1/safety-guardrails`;
    const outputValidationResponse = await fetch(outputValidationUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "output",
        llm_response: llmResponse.response,
      }),
    });

    let finalResponse = llmResponse.response;

    if (outputValidationResponse.ok) {
      const outputValidation = await outputValidationResponse.json();

      await logAuditEvent(auth_user_id, "output_validation_complete", request_id, {
        is_safe: outputValidation.is_safe,
        violations: outputValidation.violations,
      });

      if (!outputValidation.is_safe && outputValidation.suggested_replacement) {
        finalResponse = outputValidation.suggested_replacement;

        await logAuditEvent(auth_user_id, "output_replaced", request_id, {
          original_had_violations: outputValidation.violations,
        });
      }
    } else {
      await logAuditEvent(auth_user_id, "output_validation_failed", request_id, {
        error: "Could not validate output",
      });
    }

    const orchestrationResponse = {
      success: true,
      data: {
        response: finalResponse,
        journey_state: body.journey_state,
        processed_at: new Date().toISOString(),
        llm_metadata: llmResponse.metadata,
        enriched_context: enrichedContext,
      },
      request_id,
    };

    await logAuditEvent(auth_user_id, "orchestration_complete", request_id, {
      prompt_versions: promptVersions,
      canon_chunk_count: retrievalResult.count,
      canon_version_ids: retrievalResult.canon_version_ids,
      llm_provider: llmResponse.metadata.provider,
      llm_model: llmResponse.metadata.model,
    });

    console.log("ORCHESTRATE_RETURNING_RESPONSE");
    console.log("Response preview:", JSON.stringify(orchestrationResponse).substring(0, 200));

    return new Response(JSON.stringify(orchestrationResponse), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Rate-Limit-Remaining": rateLimitResult.remaining.toString(),
      },
    });
  } catch (error) {
    console.error("Orchestration error:", error);

    return createErrorResponse(
      "Internal server error",
      "INTERNAL_ERROR",
      500
    );
  }
});