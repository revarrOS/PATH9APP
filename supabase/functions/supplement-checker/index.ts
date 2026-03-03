import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { callLLM } from '../orchestrate/llm-adapter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SupplementCheckerRequest {
  medications: string[];
  supplements: string[];
  foods?: string[];
}

interface Interaction {
  item1: string;
  item2: string;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  description: string;
  recommendation: string;
}

interface SupplementCheckerResponse {
  interactions: Interaction[];
  safe_combinations: string[];
  warnings: string[];
  doctor_questions: string[];
  overall_safety: 'safe' | 'caution' | 'consult_doctor';
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

    const body: SupplementCheckerRequest = await req.json();

    if (!body.medications && !body.supplements) {
      return new Response(
        JSON.stringify({ error: 'At least medications or supplements required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await checkInteractions(body);

    await supabase.from('nutrition_interactions').insert({
      user_id: user.id,
      doctor_recommendation: body.medications.join(', '),
      translated_guidance: result.interactions
        .filter(i => i.severity !== 'none')
        .map(i => `${i.item1} + ${i.item2}: ${i.description}`)
        .join('\n'),
      practical_examples: result.safe_combinations,
    });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in supplement-checker:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkInteractions(
  request: SupplementCheckerRequest
): Promise<SupplementCheckerResponse> {
  const systemPrompt = `You are Gemma, a quiet, steady recovery companion helping people understand potential supplement interactions.

YOUR TONE:
- Calm, gentle, respectful, plain-spoken
- Never panic or catastrophize
- State facts clearly without alarm

YOUR ROLE:
Provide information about potential interactions between medications, supplements, and foods.

MEDICAL BOUNDARIES (NON-NEGOTIABLE):
- NEVER give medical advice
- NEVER recommend specific treatments
- NEVER contradict healthcare providers
- NEVER interpret clinical data
- Provide information only for discussion with doctors

YOUR APPROACH:
1. Identify known interactions with clinical evidence
2. Rate severity accurately (severe = dangerous, moderate = monitor, mild = usually okay)
3. Provide clear, calm recommendations
4. Suggest questions for their doctor
5. When unsure, say "I don't know - ask your doctor"

CRITICAL: Be conservative. If unsure, recommend consulting a doctor. Patient safety is paramount.`;

  const userPrompt = `Analyze potential interactions:

Medications: ${request.medications.join(', ')}
Supplements: ${request.supplements.join(', ')}
Foods: ${request.foods?.join(', ') || 'None specified'}

Check for interactions between all items. Format as JSON:
{
  "interactions": [
    {
      "item1": "Medication A",
      "item2": "Supplement B",
      "severity": "moderate",
      "description": "Clear explanation of the interaction",
      "recommendation": "What to do about it"
    }
  ],
  "safe_combinations": ["Item pairs that are safe together"],
  "warnings": ["Important general warnings"],
  "doctor_questions": ["Questions to ask your doctor"],
  "overall_safety": "caution",
  "confidence_score": 7
}

If no interactions found, return empty interactions array with overall_safety: "safe"`;

  const response = await callLLM({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    response_format: 'json',
  });

  try {
    return JSON.parse(response);
  } catch {
    return {
      interactions: [],
      safe_combinations: [],
      warnings: [
        'Unable to analyze interactions. Please consult your pharmacist or oncologist before starting any new supplements.',
      ],
      doctor_questions: [
        'Are there any supplements I should avoid with my current medications?',
        'Which vitamins or minerals might help during treatment?',
      ],
      overall_safety: 'consult_doctor',
      confidence_score: 3,
    };
  }
}
