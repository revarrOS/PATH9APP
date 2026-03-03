/*
 * IMPORTANT: This edge function is currently UNUSED by the app.
 *
 * Consultation questions are saved exclusively via client-side stores:
 * - products/bloodwork/consultation-prep/services/consultation-prep.store.ts
 * - products/condition/consultation-prep/services/consultation-prep.store.ts
 *
 * DO NOT wire this function to the UI without explicit approval.
 * Client auth ensures correct user_id propagation. Service-role usage here
 * was historically problematic and is no longer the intended write path.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SaveQuestionRequest {
  question_text: string;
  domain: 'bloodwork' | 'condition' | 'general';
  related_terms?: string[];
  source_context?: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const body: SaveQuestionRequest = await req.json();

    if (!body.question_text || !body.domain) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: question_text, domain" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!['bloodwork', 'condition', 'general'].includes(body.domain)) {
      return new Response(
        JSON.stringify({ error: "Invalid domain. Must be: bloodwork, condition, or general" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: question, error: insertError } = await supabase
      .from("consultation_questions")
      .insert({
        user_id: user.id,
        question_text: body.question_text,
        domain: body.domain,
        source: 'ai_suggested',
        priority: 'general',
        is_answered: false,
        related_entry_id: body.source_context?.related_entry_id || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting question:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save question", details: insertError.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: question,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
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
