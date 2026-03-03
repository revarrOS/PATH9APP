/**
 * ⚠️ LEGACY / UNUSED ENDPOINT — DO NOT DEPLOY
 *
 * This edge function is intentionally NOT deployed.
 *
 * REASON:
 * - The client exclusively uses `orchestrate` for all non-bloodwork Gemma interactions
 * - This endpoint has broken imports (edge functions bundle independently)
 * - Fixing would require significant code duplication with no user benefit
 * - Maintaining two parallel Gemma endpoints introduces unnecessary complexity
 *
 * CURRENT ARCHITECTURE:
 * - Primary Gemma: `orchestrate` (v4.0.0 prompts)
 * - Bloodwork Gemma: `bloodwork-ai-respond` (domain-specific)
 * - This endpoint: Legacy, not deployed, not used
 *
 * SAFE TO REMOVE: Yes, once confirmed no downstream dependencies exist.
 *
 * Last Updated: 2026-02-02
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  validateEnvelope,
  validateAuth,
  checkRateLimit,
  validateUserIdMatch,
  logAuditEvent,
  PolicyViolation,
} from "../_shared/policy.ts";
import { validateUserMessage } from "./message-validation.ts";
import { loadPromptRegistry, getPromptVersions } from "../orchestrate/prompt-registry.ts";
import { enforcePrompts } from "../orchestrate/enforcement.ts";
import { retrieveCanonChunks, formatCanonContext } from "../orchestrate/canon-retrieval.ts";
import { callLLM, getLLMConfig } from "../orchestrate/llm-adapter.ts";
import { EnforcementViolation } from "../orchestrate/types.ts";

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

interface GemmaResponseData {
  response_text: string;
  llm_metadata: {
    model: string;
    provider: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    timestamp: string;
  };
  prompt_versions: string[];
  canon_included: boolean;
  canon_chunk_count: number;
  processed_at: string;
}

let promptRegistry: ReturnType<typeof loadPromptRegistry> | null = null;

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

  let body: {
    user_id: string;
    journey_state: Record<string, unknown>;
    consent_flags: {
      data_processing: boolean;
      analytics: boolean;
      third_party_sharing: boolean;
    };
    request_id: string;
    user_message: string;
  };

  try {
    body = await req.json();
  } catch {
    return createErrorResponse(
      "Invalid JSON body",
      "INVALID_JSON",
      400
    );
  }

  const envelopeValidation = validateEnvelope(body);
  if (!envelopeValidation.valid) {
    return createErrorResponse(
      "Invalid request envelope",
      "INVALID_ENVELOPE",
      400,
      body.request_id,
      envelopeValidation.violations
    );
  }

  const messageValidation = validateUserMessage(body.user_message);
  if (!messageValidation.valid) {
    return createErrorResponse(
      messageValidation.error || "Invalid user message",
      messageValidation.code || "INVALID_USER_MESSAGE",
      400,
      body.request_id
    );
  }

  const normalizedMessage = messageValidation.normalized!;
  const request_id = body.request_id;

  const authResult = await validateAuth(req);
  if (!authResult.valid || !authResult.user_id) {
    return createErrorResponse(
      "Authentication required",
      "AUTH_REQUIRED",
      401,
      request_id
    );
  }

  const auth_user_id = authResult.user_id;

  const userIdMatch = validateUserIdMatch(body.user_id, auth_user_id);
  if (!userIdMatch.valid) {
    await logAuditEvent(auth_user_id, "policy_block", request_id, {
      reason: "user_id_mismatch",
    });

    return createErrorResponse(
      "User ID mismatch",
      "USER_ID_MISMATCH",
      403,
      request_id
    );
  }

  const rateLimitCheck = await checkRateLimit(auth_user_id);
  if (!rateLimitCheck.allowed) {
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
    rate_limit_remaining: rateLimitCheck.remaining,
  });

  await logAuditEvent(auth_user_id, "gemma_message_received", request_id, {
    message_length: normalizedMessage.length,
  });

  if (!promptRegistry) {
    try {
      promptRegistry = await loadPromptRegistry();
    } catch (error) {
      await logAuditEvent(auth_user_id, "gemma_response_blocked", request_id, {
        reason: "prompt_registry_load_failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return createErrorResponse(
        "Failed to load prompt registry",
        "REGISTRY_LOAD_FAILED",
        500,
        request_id
      );
    }
  }

  const registry = promptRegistry;

  const retrievalResult = await retrieveCanonChunks(
    body.journey_state,
    auth_user_id
  );

  const canonContext =
    retrievalResult.count > 0
      ? formatCanonContext(retrievalResult.chunks)
      : null;

  const enforcementResult = enforcePrompts(
    registry,
    body.journey_state,
    canonContext
  );

  if (!enforcementResult.valid) {
    await logAuditEvent(auth_user_id, "enforcement_block", request_id, {
      violations: enforcementResult.violations,
    });

    await logAuditEvent(auth_user_id, "gemma_response_blocked", request_id, {
      reason: "enforcement_failed",
      violation_count: enforcementResult.violations.length,
    });

    return createErrorResponse(
      "Prompt enforcement failed",
      "ENFORCEMENT_FAILED",
      400,
      request_id,
      enforcementResult.violations
    );
  }

  if (!enforcementResult.assembled_prompts) {
    await logAuditEvent(auth_user_id, "gemma_response_blocked", request_id, {
      reason: "no_assembled_prompts",
    });

    return createErrorResponse(
      "Failed to assemble prompts",
      "ASSEMBLY_FAILED",
      500,
      request_id
    );
  }

  const promptVersions = getPromptVersions(registry);

  await logAuditEvent(auth_user_id, "enforcement_pass", request_id, {
    prompt_version_ids: promptVersions,
    state_hydrated: enforcementResult.assembled_prompts.metadata.state_hydrated,
    canon_included: enforcementResult.assembled_prompts.metadata.canon_included,
  });

  const llmConfig = getLLMConfig();

  await logAuditEvent(auth_user_id, "llm_call_attempt", request_id, {
    provider: llmConfig.provider,
    model: llmConfig.model,
    temperature: llmConfig.temperature,
    max_tokens: llmConfig.max_tokens,
    prompt_count: enforcementResult.assembled_prompts.prompts.length,
    user_message_length: normalizedMessage.length,
  });

  const llmResponse = await callLLM(
    enforcementResult.assembled_prompts,
    request_id,
    auth_user_id,
    normalizedMessage
  );

  if (!llmResponse.success) {
    await logAuditEvent(auth_user_id, "llm_call_failure", request_id, {
      provider: llmResponse.metadata.provider,
      model: llmResponse.metadata.model,
      error: llmResponse.error,
    });

    await logAuditEvent(auth_user_id, "gemma_response_blocked", request_id, {
      reason: "llm_call_failed",
      error: llmResponse.error,
    });

    return createErrorResponse(
      "LLM call failed",
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

  await logAuditEvent(auth_user_id, "gemma_response_sent", request_id, {
    provider: llmResponse.metadata.provider,
    model: llmResponse.metadata.model,
    prompt_tokens: llmResponse.metadata.prompt_tokens,
    completion_tokens: llmResponse.metadata.completion_tokens,
    total_tokens: llmResponse.metadata.total_tokens,
    response_length: llmResponse.response.length,
  });

  const responseData: GemmaResponseData = {
    response_text: llmResponse.response,
    llm_metadata: llmResponse.metadata,
    prompt_versions: promptVersions,
    canon_included: enforcementResult.assembled_prompts.metadata.canon_included,
    canon_chunk_count: retrievalResult.count,
    processed_at: new Date().toISOString(),
  };

  return new Response(
    JSON.stringify({
      success: true,
      data: responseData,
      request_id,
    }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
});
