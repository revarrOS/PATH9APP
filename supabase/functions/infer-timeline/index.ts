import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { validateAuth, checkRateLimit, logAuditEvent } from "../_shared/policy.ts";
import { TimelineInferencer } from "./service.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InferTimelineRequest {
  diagnosis_info?: {
    diagnosis_name?: string;
    stage_or_severity?: string;
    type?: string;
  };
  diagnosis_id?: string;
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

    let body: InferTimelineRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON", code: "INVALID_JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestId = body.request_id || crypto.randomUUID();

    const rateLimitCheck = await checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      await logAuditEvent(userId, "rate_limit_exceeded", requestId, {
        service: "infer-timeline",
      });

      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createSupabaseClient();
    let diagnosisInfo = body.diagnosis_info || {};

    if (!diagnosisInfo.diagnosis_name && body.diagnosis_id) {
      const { data: diagnosisData, error: diagnosisError } = await supabase
        .from("diagnoses")
        .select("diagnosis_name, stage_or_severity")
        .eq("id", body.diagnosis_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (diagnosisData) {
        diagnosisInfo = diagnosisData;
      }
    } else if (!diagnosisInfo.diagnosis_name) {
      const { data: diagnosisData, error: diagnosisError } = await supabase
        .from("diagnoses")
        .select("id, diagnosis_name, stage_or_severity")
        .eq("user_id", userId)
        .order("diagnosis_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (diagnosisData) {
        diagnosisInfo = diagnosisData;
        body.diagnosis_id = diagnosisData.id;
      }
    }

    if (!diagnosisInfo.diagnosis_name) {
      return new Response(
        JSON.stringify({
          error: "No diagnosis information provided or found",
          code: "MISSING_DIAGNOSIS",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await logAuditEvent(userId, "timeline_inference_requested", requestId, {
      diagnosis_info: diagnosisInfo,
    });

    const inferencer = new TimelineInferencer();
    const result = await inferencer.infer(diagnosisInfo, userId);

    if (body.save_to_database !== false && body.diagnosis_id) {
      await supabase.from("treatment_timeline").delete().eq("user_id", userId).eq("diagnosis_id", body.diagnosis_id);

      const timelineRecords = result.phases.map((phase) => ({
        user_id: userId,
        diagnosis_id: body.diagnosis_id,
        timeline_phase: phase.phase_name,
        phase_order: phase.phase_order,
        estimated_duration_weeks: phase.typical_duration_weeks,
        description: phase.description,
        key_milestones: phase.key_milestones,
        status: phase.phase_order === 1 ? "in_progress" : "upcoming",
      }));

      const { error: timelineError } = await supabase
        .from("treatment_timeline")
        .insert(timelineRecords);

      if (timelineError) {
        console.error("Failed to save timeline:", timelineError);
      }
    }

    await logAuditEvent(userId, "timeline_inference_completed", requestId, {
      total_phases: result.phases.length,
      total_weeks: result.total_estimated_weeks,
      timeline_saved: body.save_to_database !== false,
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
    console.error("Timeline inference error:", error);

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
