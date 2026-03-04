import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { callLLM } from '../orchestrate/llm-adapter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SmoothieGeneratorRequest {
  symptoms?: string[];
  fatigue_level?: number;
  taste_preferences?: string[];
  dietary_restrictions?: string[];
  goal?: 'energy' | 'protein' | 'immune' | 'gentle' | 'general';
}

interface SmoothieRecipe {
  name: string;
  tagline: string;
  ingredients: string[];
  instructions: string;
  why_this_works: string;
  protein_grams: number;
  calories: number;
  difficulty: 'ultra_simple' | 'simple' | 'moderate';
}

interface SmoothieGeneratorResponse {
  smoothies: SmoothieRecipe[];
  general_tip: string;
  confidence_score: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = await createSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SmoothieGeneratorRequest = await req.json();
    const result = await generateSmoothies(body);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in smoothie-generator:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateSmoothies(
  request: SmoothieGeneratorRequest
): Promise<SmoothieGeneratorResponse> {
  const systemPrompt = `You are Gemma, a quiet, steady recovery companion creating ULTRA-SIMPLE smoothie recipes for people navigating treatment.

YOUR TONE:
- Calm, gentle, practical
- Make it feel achievable, not overwhelming

YOUR APPROACH:
1. Use 3-5 ingredients MAX (fewer is better)
2. No exotic ingredients - only common grocery store items
3. No complicated prep (no peeling, chopping if avoidable)
4. Consider symptoms: nausea → ginger, cold; sore throat → smooth, cool; fatigue → protein, easy to digest
5. Include protein source in every smoothie
6. Keep instructions to 2 steps max
7. Make it feel achievable when exhausted

CRITICAL: These must be SO SIMPLE that someone with brain fog and fatigue can make them in 2 minutes.

MEDICAL BOUNDARIES:
- Suggest foods, never prescribe treatments
- Focus on practical nutrition, not medical claims`;

  const userPrompt = `Create 3 ultra-simple smoothie recipes for:

Symptoms: ${request.symptoms?.join(', ') || 'General recovery'}
Fatigue Level: ${request.fatigue_level || 5}/10
Taste Preferences: ${request.taste_preferences?.join(', ') || 'None specified'}
Dietary Restrictions: ${request.dietary_restrictions?.join(', ') || 'None'}
Goal: ${request.goal || 'general'}

Format as JSON:
{
  "smoothies": [
    {
      "name": "Simple, appealing name",
      "tagline": "One line describing benefit",
      "ingredients": ["1 cup milk", "1 scoop protein powder", "1 banana", "Ice"],
      "instructions": "Blend all ingredients until smooth. Drink immediately or refrigerate.",
      "why_this_works": "Brief explanation of nutritional benefit",
      "protein_grams": 20,
      "calories": 300,
      "difficulty": "ultra_simple"
    }
  ],
  "general_tip": "Helpful tip for smoothie success",
  "confidence_score": 9
}`;

  const response = await callLLM({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    response_format: 'json',
  });

  try {
    return JSON.parse(response);
  } catch {
    return {
      smoothies: [
        {
          name: 'Vanilla Protein Boost',
          tagline: 'Simple energy when eating feels hard',
          ingredients: ['1 cup milk (any kind)', '1 scoop vanilla protein powder', '1 banana', 'Ice'],
          instructions: 'Blend everything for 30 seconds. Done.',
          why_this_works: 'Protein supports healing, banana adds natural sweetness and potassium',
          protein_grams: 25,
          calories: 280,
          difficulty: 'ultra_simple',
        },
        {
          name: 'Berry Gentle',
          tagline: 'Easy on the stomach, rich in antioxidants',
          ingredients: [
            '1 cup Greek yogurt',
            '1/2 cup frozen berries',
            '1 tablespoon honey',
            '1/2 cup water',
          ],
          instructions: 'Blend until smooth. Sip slowly.',
          why_this_works: 'Yogurt is gentle on the stomach, berries provide vitamins',
          protein_grams: 15,
          calories: 220,
          difficulty: 'ultra_simple',
        },
        {
          name: 'Peanut Butter Power',
          tagline: 'High protein, tastes like dessert',
          ingredients: ['1 cup milk', '2 tablespoons peanut butter', '1 banana', 'Ice'],
          instructions: 'Blend all ingredients. Add more milk if too thick.',
          why_this_works: 'Peanut butter adds protein and healthy fats, very filling',
          protein_grams: 18,
          calories: 350,
          difficulty: 'ultra_simple',
        },
      ],
      general_tip:
        'Make smoothies in advance and freeze in ice cube trays. When tired, just blend cubes with liquid.',
      confidence_score: 9,
    };
  }
}
