import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  documentId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const startTime = Date.now();
  let documentId = "";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestBody: AnalyzeRequest = await req.json();
    documentId = requestBody.documentId;

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "documentId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[INVOCATION] documentId=${documentId}, user=${user.id}`);

    const { data: document, error: docError } = await supabaseClient
      .from("condition_documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: "Document not found or access denied" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (document.extraction_status === 'deleted') {
      console.log(`[TERMINATED] Document ${documentId} was deleted`);
      return new Response(
        JSON.stringify({ error: "Document was deleted" }),
        {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabaseClient
      .from("condition_documents")
      .update({ extraction_status: "processing" })
      .eq("id", documentId);

    console.log(`[STATUS] Set to processing`);

    const bucketName = "condition-letters";
    const filePath = document.storage_path;

    console.log("[STORAGE_DEBUG]", {
      bucket: bucketName,
      path: filePath,
      documentId: documentId,
      userId: user.id,
      storage_path_from_db: document.storage_path,
    });

    const { data: pdfData, error: storageError } = await supabaseClient
      .storage
      .from(bucketName)
      .download(filePath);

    if (storageError || !pdfData) {
      console.error(`[STORAGE_ERROR]`, storageError);
      await supabaseClient
        .from("condition_documents")
        .update({
          extraction_status: "failed",
          extraction_json: {
            confidence_score: 0,
            warnings: ["Failed to retrieve PDF from storage"],
          },
        })
        .eq("id", documentId);

      return new Response(
        JSON.stringify({ error: "Failed to retrieve PDF" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[STORAGE] Downloaded ${pdfData.size} bytes`);

    const arrayBuffer = await pdfData.arrayBuffer();
    const base64Pdf = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const visionPrompt = `Extract all text from this medical letter/report PDF. Return the full text content as plain text. Be thorough and preserve the structure.`;

    console.log(`[VISION_API] Calling Anthropic...`);

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64Pdf,
                },
              },
              {
                type: "text",
                text: visionPrompt,
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error(`[VISION_ERROR] ${anthropicResponse.status}: ${errorText}`);

      await supabaseClient
        .from("condition_documents")
        .update({
          extraction_status: "failed",
          extraction_json: {
            confidence_score: 0,
            warnings: [`Vision API failed: ${anthropicResponse.status}`],
          },
        })
        .eq("id", documentId);

      return new Response(
        JSON.stringify({ error: "Vision API failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const anthropicData = await anthropicResponse.json();
    const extractedText = anthropicData.content?.[0]?.text || "";

    console.log(`[VISION_API] Extracted ${extractedText.length} chars`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const orchestrateUrl = `${supabaseUrl}/functions/v1/orchestrate`;

    const extractionPrompt = `You are analyzing a medical letter/report. Extract structured information to help the patient understand their condition.

CRITICAL INSTRUCTIONS:
- Extract ONLY information that is clearly stated in the letter
- Do NOT make assumptions or infer information not present
- If something is unclear or not mentioned, omit it
- Focus on actionable information (appointments, diagnoses, care team, next steps)

Return ONLY valid JSON in this exact format:
{
  "timeline_events": [
    {
      "event_type": "diagnosis" | "appointment" | "test" | "treatment" | "referral",
      "date": "YYYY-MM-DD" (if mentioned, otherwise null),
      "description": "Brief description of what happened",
      "provider": "Doctor/facility name" (if mentioned)
    }
  ],
  "care_team_contacts": [
    {
      "name": "Dr. Jane Smith",
      "role": "Oncologist" | "Hematologist" | "Primary Care" | "Specialist" | "Nurse" | "Other",
      "phone": "555-1234" (if mentioned, otherwise null),
      "email": "example@hospital.com" (if mentioned, otherwise null),
      "facility": "Hospital/clinic name" (if mentioned, otherwise null)
    }
  ],
  "consultation_questions": [
    {
      "question_text": "What does this diagnosis mean for my daily life?",
      "category": "diagnosis" | "treatment" | "side_effects" | "prognosis" | "lifestyle" | "general",
      "priority": "high" | "medium" | "low"
    }
  ],
  "extracted_diagnosis": "Primary diagnosis mentioned in letter" (or null),
  "confidence_score": 0.85,
  "warnings": ["Any concerns about data quality, missing info, or ambiguity"]
}

You MUST return ONLY valid JSON.
Do NOT include explanations.
Do NOT include markdown.
Do NOT include backticks.
Do NOT include any text before or after the JSON object.

LETTER TEXT:
${extractedText}`;

    const orchestratePayload = {
      user_id: user.id,
      request_id: `condition_letter_${documentId}_${Date.now()}`,
      user_message: extractionPrompt,
      journey_state: {
        journey_phase: "Clarity",
        domain: "condition",
        pillar: "condition",
      },
      consent_flags: {
        data_processing: true,
        analytics: true,
        third_party_sharing: false,
      },
      metadata: {
        documentId,
        title: document.title || "Untitled Letter",
        processingMode: "condition_letter_extraction",
      },
    };

    console.log(`[ORCHESTRATE] Calling orchestrate...`);

    const orchestrateResponse = await fetch(orchestrateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "apikey": Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      },
      body: JSON.stringify(orchestratePayload),
    });

    if (!orchestrateResponse.ok) {
      const errorText = await orchestrateResponse.text();
      console.error(`[ORCHESTRATE_ERROR] ${orchestrateResponse.status}: ${errorText}`);

      await supabaseClient
        .from("condition_documents")
        .update({
          extraction_status: "failed",
          extraction_json: {
            full_text: extractedText,
            confidence_score: 0,
            warnings: [`Orchestrate failed: ${orchestrateResponse.status}`],
          },
        })
        .eq("id", documentId);

      return new Response(
        JSON.stringify({ error: "Processing failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orchestrateData = await orchestrateResponse.json();
    console.log(`[ORCHESTRATE] Response received`);

    const gemmaResponse = orchestrateData.data?.response || "";

    let extractionJson: Record<string, unknown> = {
      full_text: extractedText,
      gemma_raw_response: gemmaResponse,
      confidence_score: 0,
      timeline_events: [],
      care_team_contacts: [],
      consultation_questions: [],
      warnings: [],
      metadata: {
        doc_date: document.doc_date,
        title: document.title,
        processed_at: new Date().toISOString(),
      },
    };

    try {
      let cleanedResponse = gemmaResponse.trim();

      // Try to extract JSON from markdown code blocks first
      const jsonMatch = cleanedResponse.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[1];
      }

      // Extract from first { to last }
      const firstBrace = cleanedResponse.indexOf('{');
      const lastBrace = cleanedResponse.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
      }

      const parsedJson = JSON.parse(cleanedResponse);

      extractionJson = {
        full_text: extractedText,
        timeline_events: parsedJson.timeline_events || [],
        care_team_contacts: parsedJson.care_team_contacts || [],
        consultation_questions: parsedJson.consultation_questions || [],
        extracted_diagnosis: parsedJson.extracted_diagnosis || null,
        confidence_score: parsedJson.confidence_score || 0.85,
        warnings: parsedJson.warnings || [],
        metadata: {
          doc_date: document.doc_date,
          title: document.title,
          processed_at: new Date().toISOString(),
        },
      };

      console.log(`[EXTRACTION_SUCCESS] Found ${extractionJson.timeline_events.length} events, ${extractionJson.care_team_contacts.length} contacts, ${extractionJson.consultation_questions.length} questions`);
    } catch (e) {
      console.error(`[PARSE_ERROR] Could not extract structured JSON from response:`, e);
      extractionJson.warnings.push("Could not parse structured extraction. Manual review required.");
    }

    const maskedText = extractedText;

    const { error: updateError } = await supabaseClient
      .from("condition_documents")
      .update({
        extraction_status: "extracted",
        extraction_json: extractionJson,
        full_text: extractedText,
        masked_text: maskedText,
      })
      .eq("id", documentId);

    if (updateError) {
      console.error(`[DB_ERROR]`, updateError);
      throw updateError;
    }

    const elapsedMs = Date.now() - startTime;
    console.log(`[SUCCESS] Processing complete in ${elapsedMs}ms`);

    return new Response(
      JSON.stringify({
        ok: true,
        documentId,
        extraction_status: "extracted",
        elapsed_ms: elapsedMs,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`[FATAL_ERROR]`, error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        documentId: documentId || undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
