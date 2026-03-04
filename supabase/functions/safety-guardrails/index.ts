import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { validateAuth, logAuditEvent } from "../_shared/policy.ts";
import { SafetyGuardrails } from "./service.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SafetyCheckRequest {
  mode?: "input" | "output";
  user_message?: string;
  llm_response?: string;
  conversation_history?: string[];
  request_id?: string;
  save_to_database?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const authResult = await validateAuth(req);
    if (!authResult.valid || !authResult.user_id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authResult.user_id;

    let body: SafetyCheckRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON", code: "INVALID_JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestId = body.request_id || crypto.randomUUID();
    const mode = body.mode || "input";
    const guardrails = new SafetyGuardrails();

    if (mode === "output") {
      if (!body.llm_response || body.llm_response.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Missing llm_response", code: "INVALID_INPUT" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const outputValidation = await guardrails.validateOutput(body.llm_response);

      await logAuditEvent(userId, "output_validation_completed", requestId, {
        is_safe: outputValidation.is_safe,
        violations: outputValidation.violations,
      });

      return new Response(
        JSON.stringify({
          success: true,
          ...outputValidation,
          request_id: requestId,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!body.user_message || body.user_message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing user_message", code: "INVALID_INPUT" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await guardrails.check(
      body.user_message,
      userId,
      body.conversation_history
    );

    const supabase = createSupabaseClient();

    if (body.save_to_database !== false && result.severity_score >= 5) {
      const { error: interventionError } = await supabase
        .from("safety_interventions")
        .insert({
          user_id: userId,
          trigger_type: result.detected_patterns.join(", "),
          trigger_content: body.user_message,
          severity_score: result.severity_score,
          intervention_type: result.intervention_recommended,
          intervention_content: result.intervention_content,
          escalated_to_human: result.escalation_required,
        });

      if (interventionError) {
        console.error("Failed to save safety intervention:", interventionError);
      }

      if (result.severity_score >= 5) {
        const emotionalData: Record<string, unknown> = {
          user_id: userId,
          detected_from: "message_analysis",
          intervention_offered: result.intervention_recommended,
        };

        if (result.severity_score >= 7) {
          emotionalData.anxiety_level = 9;
          emotionalData.overwhelm_level = 9;
          emotionalData.hope_level = 2;
        } else if (result.severity_score >= 5) {
          emotionalData.anxiety_level = 7;
          emotionalData.overwhelm_level = 7;
          emotionalData.hope_level = 4;
        }

        await supabase.from("emotional_checkins").insert(emotionalData);
      }
    }

    await logAuditEvent(userId, "safety_check_completed", requestId, {
      severity_score: result.severity_score,
      detected_patterns: result.detected_patterns,
      escalation_required: result.escalation_required,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        request_id: requestId,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Safety check error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
