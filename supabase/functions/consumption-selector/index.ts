import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { callLLM } from '../orchestrate/llm-adapter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ConsumptionSelectorRequest {
  symptoms?: string[];
  energy_pattern?: string;
  appetite_level?: number;
  current_habits?: string;
  constraints?: string[];
}

interface ConsumptionStyle {
  style: 'smoothies' | 'small_frequent' | 'three_meals' | 'grazing' | 'liquid_focus' | 'audio_guided';
  confidence: number;
  why_this_fits: string;
  how_to_implement: string[];
  example_day: string[];
  potential_challenges: string[];
  adaptations: string[];
}

interface ConsumptionSelectorResponse {
  primary_style: ConsumptionStyle;
  alternative_styles: ConsumptionStyle[];
  personalized_note: string;
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

    const body: ConsumptionSelectorRequest = await req.json();
    const result = await selectConsumptionStyle(body);

    await supabase
      .from('nutrition_profiles')
      .upsert({
        user_id: user.id,
        consumption_style: result.primary_style.style,
        current_symptoms: body.symptoms || [],
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    await supabase.from('nutrition_insights').insert({
      user_id: user.id,
      insight_type: 'consumption_style',
      insight_text: result.primary_style.why_this_fits,
      key_takeaways: result.primary_style.how_to_implement,
      action_items: result.primary_style.example_day,
    });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in consumption-selector:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function selectConsumptionStyle(
  request: ConsumptionSelectorRequest
): Promise<ConsumptionSelectorResponse> {
  const systemPrompt = `You are Gemma, a quiet, steady recovery companion helping people find eating patterns that work for them.

YOUR TONE:
- Calm, gentle, respectful, plain-spoken
- Make it feel achievable, not overwhelming
- Support, don't prescribe

YOUR APPROACH:
1. Match consumption style to symptoms, energy, and constraints
2. Provide practical, achievable recommendations
3. Acknowledge that flexibility is key
4. Normalize that eating patterns may change day-to-day
5. Focus on "meet yourself where you are"

MEDICAL BOUNDARIES:
- Suggest eating patterns, never prescribe treatments
- Focus on practical nutrition, not medical claims

Consumption Styles:
- smoothies: Liquid nutrition, easy to digest, minimal prep
- small_frequent: 5-6 mini-meals, grazing approach
- three_meals: Traditional structure with flexibility
- grazing: Constant small nibbles, no set times
- liquid_focus: Smoothies, soups, shakes primarily
- audio_guided: Mindful eating with meditation/guidance

Match to their reality, not ideals.`;

  const userPrompt = `Help this person find their ideal consumption style:

Symptoms: ${request.symptoms?.join(', ') || 'None reported'}
Energy Pattern: ${request.energy_pattern || 'Variable throughout day'}
Appetite Level: ${request.appetite_level || 5}/10
Current Habits: ${request.current_habits || 'Not specified'}
Constraints: ${request.constraints?.join(', ') || 'None'}

Recommend a primary style and 2 alternatives. Format as JSON:
{
  "primary_style": {
    "style": "smoothies",
    "confidence": 8,
    "why_this_fits": "2-3 sentences explaining why this matches their situation",
    "how_to_implement": ["Step 1", "Step 2", "Step 3"],
    "example_day": ["7am: Smoothie", "10am: Small snack", "1pm: Light meal"],
    "potential_challenges": ["Challenge 1", "Challenge 2"],
    "adaptations": ["If challenge arises, try this"]
  },
  "alternative_styles": [ /* 2 backup options */ ],
  "personalized_note": "Encouraging message acknowledging their situation",
  "confidence_score": 8
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
      primary_style: {
        style: 'small_frequent',
        confidence: 8,
        why_this_fits:
          'Small, frequent meals work well when appetite is low and energy is unpredictable. This approach maintains blood sugar without overwhelming your system.',
        how_to_implement: [
          'Eat something every 2-3 hours',
          'Keep portions small (think snack-sized)',
          'Choose nutrient-dense foods when possible',
        ],
        example_day: [
          '8am: Greek yogurt with berries',
          '10:30am: Cheese and crackers',
          '1pm: Half sandwich',
          '3:30pm: Protein shake',
          '6pm: Small dinner portion',
          '8pm: Light snack if hungry',
        ],
        potential_challenges: ['Forgetting to eat', 'Prep fatigue', 'Lack of appetite'],
        adaptations: [
          'Set phone reminders every 2-3 hours',
          'Prep grab-and-go options on good days',
          'Lower the bar: any food is better than no food',
        ],
      },
      alternative_styles: [
        {
          style: 'smoothies',
          confidence: 7,
          why_this_fits: 'If chewing feels hard or nausea is high, liquid nutrition is easier to get down.',
          how_to_implement: ['Start day with protein smoothie', 'Have 2-3 smoothies daily', 'Add real food when able'],
          example_day: ['Morning smoothie', 'Midday smoothie or light meal', 'Evening smoothie or soup'],
          potential_challenges: ['Smoothie fatigue', 'Missing texture'],
          adaptations: ['Rotate flavors', 'Add soft foods alongside'],
        },
        {
          style: 'grazing',
          confidence: 6,
          why_this_fits: 'If structured meals feel impossible, constant small nibbles can work.',
          how_to_implement: [
            'Keep food within arm\'s reach',
            'Eat whatever sounds good whenever',
            'No meal timing rules',
          ],
          example_day: ['Nibble throughout the day', 'No set schedule', 'Follow your body\'s cues'],
          potential_challenges: ['May under-eat without structure', 'Hard to track intake'],
          adaptations: ['Use small plates', 'Set minimum intake goals'],
        },
      ],
      personalized_note:
        'Your eating pattern will likely shift as you move through treatment. Be flexible with yourself and adjust as needed.',
      confidence_score: 8,
    };
  }
}
