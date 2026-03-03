import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  image_base64: string;
}

interface FoodAnalysis {
  confidence: 'high' | 'moderate' | 'low';
  foodCategories: string[];
  preparationMethod: string;
  portionEstimate: 'small' | 'moderate' | 'large';
  supportAreas: string[];
  observableNotes: string;
}

interface AnalysisResponse {
  success: boolean;
  analysis?: FoodAnalysis;
  message?: string;
}

const VISION_ANALYSIS_PROMPT = `Analyze this food/meal image and provide ONLY observable categories.

CRITICAL RULES:
- Never state quantities, weights, or measurements (no "100g", no "2 cups", no "medium portion")
- Never state calorie counts, macros, or nutrient percentages
- Never claim sufficiency or deficiency
- Use only categorical descriptions
- Use indicative language only ("may contain", "appears to include")

Provide your analysis in this exact JSON format:
{
  "confidence": "high" | "moderate" | "low",
  "foodCategories": ["category1", "category2"],
  "preparationMethod": "grilled" | "raw" | "baked" | "steamed" | "fried" | "mixed" | "unknown",
  "portionEstimate": "small" | "moderate" | "large",
  "supportAreas": ["protein-rich", "hydration", "iron-rich", "anti-inflammatory", "easily-digestible", "energy-dense", "calcium-rich", "vitamin-d-rich", "antioxidant-rich", "fruits-vegetables", "whole-grains", "healthy-fats"],
  "observableNotes": "Brief categorical description in indicative language"
}

Example food categories: "chicken", "salmon", "broccoli", "rice", "pasta", "yogurt", "apple", "water", "smoothie"
Example observable notes: "Appears to include protein-rich foods and vegetables" (NOT "This meal provides 30g of protein")

You MUST return ONLY valid JSON.
Do NOT include explanations.
Do NOT include markdown.
Do NOT include backticks.
If you cannot confidently identify the food, set confidence to "low" and provide minimal categories.`;

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

    const normalizedBase64 = image_base64.includes('base64,')
      ? image_base64.split('base64,')[1]
      : image_base64;

    const imageType = normalizedBase64.startsWith('/9j/') ? 'image/jpeg' : 'image/png';

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
                  data: normalizedBase64,
                },
              },
              {
                type: "text",
                text: VISION_ANALYSIS_PROMPT,
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

    let parsedData: FoodAnalysis;
    try {
      let cleanedContent = messageContent.trim();

      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace = cleanedContent.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
      }

      parsedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Could not parse vision response, returning empty results");
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Could not confidently identify food items in this image',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (parsedData.confidence === 'low') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Could not confidently identify food items in this image',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response: AnalysisResponse = {
      success: true,
      analysis: parsedData,
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
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
