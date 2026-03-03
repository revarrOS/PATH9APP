import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { validateAuth, checkRateLimit, logAuditEvent } from "../_shared/policy.ts";
import { MedicalTranslator } from "./service.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TranslateMedicalRequest {
  user_id?: string;  // For service-to-service calls from orchestrate
  technical_text: string;
  context?: {
    user_literacy_level?: number;
    emotional_state?: string;
    journey_phase?: string;
  };
  request_id?: string;
  save_to_diagnosis?: boolean;
  diagnosis_metadata?: {
    diagnosis_name?: string;
    diagnosis_date?: string;
    stage_or_severity?: string;
    icd_code?: string;
  };
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
    let body: TranslateMedicalRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON", code: "INVALID_JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Support service-to-service calls (from orchestrate) which include user_id in body
    let userId: string;
    if (body.user_id) {
      // Called from orchestrate with service role key, trust the user_id in body
      userId = body.user_id;
    } else {
      // Called directly by user, validate auth token
      const authResult = await validateAuth(req);
      if (!authResult.valid || !authResult.user_id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = authResult.user_id;
    }

    const requestId = body.request_id || crypto.randomUUID();

    if (!body.technical_text || body.technical_text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing technical_text", code: "INVALID_INPUT" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rateLimitCheck = await checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      await logAuditEvent(userId, "rate_limit_exceeded", requestId, {
        service: "translate-medical",
      });

      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await logAuditEvent(userId, "medical_translation_requested", requestId, {
      text_length: body.technical_text.length,
      context: body.context,
    });

    const supabase = createSupabaseClient();

    let userContext = body.context || {};
    if (!userContext.user_literacy_level) {
      const { data: literacyProfile } = await supabase
        .from("user_literacy_profile")
        .select("medical_literacy")
        .eq("user_id", userId)
        .maybeSingle();

      if (literacyProfile) {
        userContext.user_literacy_level = literacyProfile.medical_literacy;
      }
    }

    const translator = new MedicalTranslator();

    const result = await translator.translate(
      body.technical_text,
      userId,
      userContext
    );

    if (body.save_to_diagnosis && body.diagnosis_metadata) {
      const { error: diagnosisError } = await supabase.from("diagnoses").insert({
        user_id: userId,
        diagnosis_name: body.diagnosis_metadata.diagnosis_name || "Unknown",
        diagnosis_date: body.diagnosis_metadata.diagnosis_date || new Date().toISOString().split("T")[0],
        stage_or_severity: body.diagnosis_metadata.stage_or_severity,
        icd_code: body.diagnosis_metadata.icd_code,
        raw_pathology_text: body.technical_text,
        plain_english_summary: result.plain_english,
      });

      if (diagnosisError) {
        console.error("Failed to save diagnosis:", diagnosisError);
      }
    }

    const contextHash = JSON.stringify(userContext);
    await supabase.from("translation_cache").insert({
      domain: "medical",
      technical_text: body.technical_text,
      plain_english: result.plain_english,
      key_terms: result.key_terms,
      complexity_score: result.complexity_score,
      context_hash: contextHash,
    });

    await logAuditEvent(userId, "medical_translation_completed", requestId, {
      complexity_score: result.complexity_score,
      confidence_score: result.confidence_score,
      key_terms_count: result.key_terms.length,
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
    console.error("Medical translation error:", error);

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
