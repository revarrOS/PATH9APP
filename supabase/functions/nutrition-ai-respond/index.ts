import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  conversationHistory: Message[];
  currentMessage: string;
}

interface ConsultationPrepSuggestion {
  suggestedQuestion: string;
  relatedTerms: string[];
  sourceContext?: {
    entryDate?: string;
    entryType?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { conversationHistory = [], currentMessage } = body;

    if (currentMessage === 'ping') {
      return new Response(
        JSON.stringify({ reply: "pong", health: "ok" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!currentMessage || typeof currentMessage !== 'string') {
      return new Response(JSON.stringify({ error: "Invalid message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: limitCheck, error: limitError } = await supabaseClient.rpc('check_usage_limit', {
      p_user_id: user.id,
      p_feature_key: 'ai_interactions_evaluation'
    });

    if (limitError || !limitCheck) {
      return new Response(
        JSON.stringify({ error: "AI interaction limit reached", code: "EVAL_LIMIT_REACHED" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    const orchestratePayload = {
      user_id: user.id,
      request_id: `nutrition_${Date.now()}`,
      user_message: currentMessage,
      journey_state: {
        journey_phase: "Clarity",
        domain: "nutrition",
        pillar: "nutrition",
      },
      consent_flags: {
        data_processing: true,
        analytics: true,
        third_party_sharing: false,
      },
    };

    const orchestrateResponse = await fetch(`${supabaseUrl}/functions/v1/orchestrate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(orchestratePayload),
    });

    if (!orchestrateResponse.ok) {
      const errorText = await orchestrateResponse.text();
      console.error("Orchestrate API error:", orchestrateResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orchestrateData = await orchestrateResponse.json();
    const aiResponse = orchestrateData.data?.response || "";

    const consultationPrepSuggestion = detectConsultationPrepOpportunity(aiResponse, currentMessage);

    return new Response(
      JSON.stringify({
        reply: aiResponse,
        ...(consultationPrepSuggestion && {
          showSaveToConsultationPrep: true,
          suggestedQuestion: consultationPrepSuggestion.suggestedQuestion,
          relatedTerms: consultationPrepSuggestion.relatedTerms,
          sourceContext: consultationPrepSuggestion.sourceContext,
        }),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in nutrition-ai-respond:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function detectConsultationPrepOpportunity(
  aiResponse: string,
  userMessage: string
): ConsultationPrepSuggestion | null {
  const lowerResponse = aiResponse.toLowerCase();
  const lowerMessage = userMessage.toLowerCase();

  // CRITICAL: Only trigger if Gemma explicitly ASKS user about saving
  const clinicianHandoffPatterns = [
    /want me to save/i,
    /should i save/i,
    /want me to capture/i,
    /should i capture/i,
  ];

  const hasExplicitSaveOffer = clinicianHandoffPatterns.some(p => p.test(aiResponse));

  if (!hasExplicitSaveOffer) {
    return null;
  }

  // Extract the SINGLE question being offered (first match only)
  const questionMatch = aiResponse.match(/like:\s*['""]([^'"]+)['"]/i) ||
                        aiResponse.match(/such as:\s*['""]([^'"]+)['"]/i) ||
                        aiResponse.match(/question.*?['""]([^'"]+)['"]/i) ||
                        aiResponse.match(/save.*?['""]([^'"]+)['"]/i);

  return {
    suggestedQuestion: questionMatch?.[1] || "Can you help me understand what foods support my condition?",
    relatedTerms: [],
    sourceContext: {},
  };
}
