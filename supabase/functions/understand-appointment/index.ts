import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { validateAuth, checkRateLimit, logAuditEvent } from "../_shared/policy.ts";
import { AppointmentParser } from "./service.ts";
import { createSupabaseClient } from "../_shared/supabase-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UnderstandAppointmentRequest {
  user_id?: string;  // For service-to-service calls from orchestrate
  user_message: string;
  context?: {
    journey_phase?: string;
    days_since_diagnosis?: number;
  };
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
    let body: UnderstandAppointmentRequest;
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

    if (!body.user_message || body.user_message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing user_message", code: "INVALID_INPUT" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rateLimitCheck = await checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      await logAuditEvent(userId, "rate_limit_exceeded", requestId, {
        service: "understand-appointment",
      });

      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await logAuditEvent(userId, "appointment_understanding_requested", requestId, {
      message_length: body.user_message.length,
      context: body.context,
    });

    const parser = new AppointmentParser();
    const result = await parser.parse(
      body.user_message,
      userId,
      body.context || {}
    );

    const supabase = createSupabaseClient();

    if (
      body.save_to_database !== false &&
      result.extraction.confidence_score >= 5 &&
      result.extraction.appointment_datetime
    ) {
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          user_id: userId,
          appointment_datetime: result.extraction.appointment_datetime,
          provider_name: result.extraction.provider_name,
          provider_role: result.extraction.provider_role,
          appointment_type: result.extraction.appointment_type,
          location: result.extraction.location,
          preparation_notes: result.preparation_tips.join("\n"),
          questions_to_ask: result.questions_to_ask,
          status: "scheduled",
        })
        .select()
        .single();

      if (appointmentError) {
        console.error("Failed to save appointment:", appointmentError);
      } else if (appointmentData && result.extraction.provider_name && result.extraction.provider_role) {
        const { error: careTeamError } = await supabase
          .from("care_team")
          .upsert(
            {
              user_id: userId,
              provider_name: result.extraction.provider_name,
              role: result.extraction.provider_role,
              first_seen_date: new Date().toISOString().split("T")[0],
            },
            {
              onConflict: "user_id,provider_name",
              ignoreDuplicates: true,
            }
          );

        if (careTeamError) {
          console.error("Failed to save care team member:", careTeamError);
        }
      }
    }

    await logAuditEvent(userId, "appointment_understanding_completed", requestId, {
      confidence_score: result.extraction.confidence_score,
      appointment_saved: body.save_to_database !== false && result.extraction.confidence_score >= 5,
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
    console.error("Appointment understanding error:", error);

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
