/**
 * Bloodwork Image Analysis Edge Function
 *
 * Purpose:
 * - Extracts blood marker values from lab report images using Claude Vision API
 * - Runs as a Supabase Edge Function (Deno runtime)
 * - Processes images transiently (never stores them)
 * - Returns structured JSON for UI pre-fill
 *
 * Why this lives outside /products/bloodwork/:
 * - Supabase Edge Functions MUST live in /supabase/functions/
 * - Cannot import from main project (different runtime environment)
 * - Must be self-contained with all dependencies inline
 *
 * Code Duplication Notice:
 * - MARKER_ALIASES is duplicated from products/bloodwork/types/bloodwork.types.ts
 * - This is necessary because edge functions run in Deno and cannot import from the project
 * - If you update marker aliases in bloodwork.types.ts, update them here too
 * - This is an acceptable trade-off for keeping the edge function self-contained
 *
 * Dependencies:
 * - Anthropic Claude Vision API (requires ANTHROPIC_API_KEY in Supabase secrets)
 * - Runs stateless (no session, no persistence)
 *
 * Related Files:
 * - /products/bloodwork/types/bloodwork.types.ts (canonical marker definitions)
 * - /products/bloodwork/utils/smart-normalize.ts (client-side normalization)
 * - /app/(tabs)/medical/bloodwork/new.tsx (calls this function)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  image_base64: string;
}

interface MarkerExtraction {
  marker_name: string;
  value: string;
  unit: string;
  confidence: number;
  reference_range_low?: string;
  reference_range_high?: string;
}

interface AnalysisResponse {
  suggested_values: Record<string, string>;
  units: Record<string, string>;
  confidence: Record<string, number>;
  reference_ranges: Record<string, { low?: string; high?: string }>;
  unmapped_markers: string[];
  warnings: string[];
  extracted_date?: string;
  extracted_location?: string;
}

const KNOWN_CBC_MARKERS = [
  'WBC', 'RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'PLT',
  'LYM', 'LYM%', 'MXD', 'MXD%', 'NEUT', 'NEUT%',
  'RDW-SD', 'RDW-CV', 'PDW', 'MPV', 'PLCR'
];

// Marker name normalization mapping
const MARKER_ALIASES: Record<string, string> = {
  'LYM#': 'LYM',
  'LYMPH': 'LYM',
  'LYMPH#': 'LYM',
  'LYMPH%': 'LYM%',
  'MXD#': 'MXD',
  'MONO': 'MXD',
  'MONO#': 'MXD',
  'MONO%': 'MXD%',
  'NEUT#': 'NEUT',
  'NEUTRO': 'NEUT',
  'NEUTRO#': 'NEUT',
  'NEUTRO%': 'NEUT%',
  'P-LCR': 'PLCR',
  'PCT': 'HCT',
  'HEMOGLOBIN': 'HGB',
  'HB': 'HGB',
  'PLATELETS': 'PLT',
  'PLATELET': 'PLT',
};

function normalizeMarkerName(name: string): string {
  const upperName = name.toUpperCase().trim();
  return MARKER_ALIASES[upperName] || upperName;
}

function normalizeDateToISO(dateString: string): string | undefined {
  if (!dateString) return undefined;

  try {
    // Try parsing the date
    const parsed = new Date(dateString);

    // Check if date is valid
    if (isNaN(parsed.getTime())) {
      return undefined;
    }

    // Return in YYYY-MM-DD format
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch {
    return undefined;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const { image_base64 }: AnalysisRequest = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "image_base64 is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const imageType = image_base64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';

    const prompt = `You are analyzing a blood test report image. Extract blood marker values, test date, and lab location.

Known CBC markers: ${KNOWN_CBC_MARKERS.join(', ')}

CRITICAL INSTRUCTIONS:
- Extract ONLY values that are clearly visible and legible
- Do NOT guess or estimate any values
- Include unit of measurement for each marker
- Include reference ranges if visible (low and high)
- Flag any markers you see that are NOT in the known list as "unmapped"
- If units appear inconsistent or unusual, add a warning
- Extract the test date if clearly visible (prefer the result/specimen date)
- Extract lab/location name if clearly visible
- If multiple dates are present, choose the most likely test/result date
- If date confidence is low, omit it

Return ONLY valid JSON in this exact format:
{
  "extractions": [
    {
      "marker_name": "WBC",
      "value": "4.6",
      "unit": "10^9/L",
      "confidence": 0.95,
      "reference_range_low": "4.0",
      "reference_range_high": "11.0"
    }
  ],
  "test_date": "2026-01-16",
  "lab_location": "Quest Diagnostics",
  "unmapped_markers": ["BASO", "EOS"],
  "warnings": ["Unit mismatch detected for HCT"]
}

You MUST return ONLY valid JSON.
Do NOT include explanations.
Do NOT include markdown.
Do NOT include backticks.
Do NOT include any text before or after the JSON object.
If a value cannot be determined, omit it.`;

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: imageType,
                  data: image_base64,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic API error status:", anthropicResponse.status);
      console.error("Anthropic API error body:", errorText);
      console.error("Request headers used:", {
        "anthropic-version": "2023-06-01",
        "x-api-key": anthropicApiKey ? "present" : "missing"
      });
      throw new Error(`Vision API Failed: ${anthropicResponse.status} - ${errorText}`);
    }

    const anthropicData = await anthropicResponse.json();
    const messageContent = anthropicData.content?.[0]?.text;

    if (!messageContent) {
      throw new Error("No content in vision response");
    }

    // Defensive JSON extraction
    let parsedData;
    try {
      // Trim whitespace
      let cleanedContent = messageContent.trim();

      // Extract from first { to last }
      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace = cleanedContent.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
      }

      parsedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      // Fail soft: return empty results instead of throwing
      console.error("Could not parse vision response, returning empty results");
      parsedData = {
        extractions: [],
        unmapped_markers: [],
        warnings: ["Could not confidently read this image. Please continue with manual entry."]
      };
    }

    const extractions: MarkerExtraction[] = parsedData.extractions || [];
    const unmapped: string[] = parsedData.unmapped_markers || [];
    const warnings: string[] = parsedData.warnings || [];
    const testDate: string | undefined = parsedData.test_date;
    const labLocation: string | undefined = parsedData.lab_location;

    // Normalize date to YYYY-MM-DD format
    const normalizedDate = testDate ? normalizeDateToISO(testDate) : undefined;

    const response: AnalysisResponse = {
      suggested_values: {},
      units: {},
      confidence: {},
      reference_ranges: {},
      unmapped_markers: unmapped,
      warnings: warnings,
      extracted_date: normalizedDate,
      extracted_location: labLocation,
    };

    for (const extraction of extractions) {
      const rawMarkerName = extraction.marker_name.toUpperCase();
      const normalizedName = normalizeMarkerName(rawMarkerName);

      if (KNOWN_CBC_MARKERS.includes(normalizedName)) {
        response.suggested_values[normalizedName] = extraction.value;
        response.units[normalizedName] = extraction.unit;
        response.confidence[normalizedName] = extraction.confidence;

        if (extraction.reference_range_low || extraction.reference_range_high) {
          response.reference_ranges[normalizedName] = {
            low: extraction.reference_range_low,
            high: extraction.reference_range_high,
          };
        }
      } else {
        // Only add to unmapped if it's truly unknown (not just a variant)
        if (!response.unmapped_markers.includes(rawMarkerName)) {
          response.unmapped_markers.push(rawMarkerName);
        }
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error analyzing image:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to analyze image",
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
