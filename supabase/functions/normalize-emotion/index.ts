import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface NormalizeEmotionRequest {
  emotion: string;
  context: string;
  intensity?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body: NormalizeEmotionRequest = await req.json();

    if (!body.emotion || !body.context) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: emotion, context' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const normalization = await generateNormalization(
      body.emotion,
      body.context,
      body.intensity
    );

    const { data: savedNormalization, error: saveError } = await supabaseService
      .from('emotion_normalizations')
      .insert({
        user_id: user.id,
        emotion: body.emotion,
        context: body.context,
        normalization_text: normalization.text,
        reassurance_points: normalization.reassurances,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving emotion normalization:', saveError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        normalization: savedNormalization || {
          emotion: body.emotion,
          normalization_text: normalization.text,
          reassurance_points: normalization.reassurances,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateNormalization(
  emotion: string,
  context: string,
  intensity?: number
): Promise<{ text: string; reassurances: string[] }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openaiKey) {
    return getFallbackNormalization(emotion);
  }

  try {
    const prompt = `A person navigating chronic illness is feeling "${emotion}" (intensity: ${intensity || 'unknown'}/10) in this context:

"${context}"

Help them understand:
1. This emotion is valid and makes sense
2. Many others in similar situations feel this way
3. Feeling this doesn't mean something is wrong with them
4. Specific reassurances grounded in reality

Respond in JSON format:
{
  "normalization": "Calm, gentle validation message (2-3 sentences, plain-spoken)",
  "reassurances": ["reassurance 1", "reassurance 2", "reassurance 3"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are Gemma, a quiet, steady recovery companion. Your tone is calm, gentle, respectful, plain-spoken, and non-judgmental. You normalize difficult emotions (fear, anger, grief, confusion) without minimizing pain. You avoid false reassurance and toxic positivity. You never rush emotional processing.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return getFallbackNormalization(emotion);
    }

    const result = await response.json();
    const parsed = JSON.parse(result.choices[0].message.content);

    return {
      text: parsed.normalization,
      reassurances: parsed.reassurances,
    };
  } catch (error) {
    console.error('Error generating normalization:', error);
    return getFallbackNormalization(emotion);
  }
}

function getFallbackNormalization(emotion: string): { text: string; reassurances: string[] } {
  const normalizations: Record<string, any> = {
    fear: {
      text: 'Feeling fear in the face of medical challenges is completely natural and valid. Your body is responding to real uncertainty, and this fear shows you care deeply about your wellbeing.',
      reassurances: [
        'Fear is a normal response to medical situations',
        'Feeling afraid doesn\'t mean you\'re weak',
        'Many people in your situation feel the same way',
      ],
    },
    anger: {
      text: 'Anger is a valid response when your body and life feel beyond your control. This emotion is normal and doesn\'t make you a bad person—it\'s a natural reaction to loss and change.',
      reassurances: [
        'Anger at your diagnosis is completely normal',
        'You have every right to feel angry about this disruption',
        'Anger can be protective and show what matters to you',
      ],
    },
    sadness: {
      text: 'Feeling sad about what\'s happening is a natural and appropriate response. Your sadness honors what you\'re going through and what you may be grieving.',
      reassurances: [
        'Sadness is a normal part of processing difficult news',
        'You don\'t have to be positive all the time',
        'Allowing yourself to feel sad is part of healing',
      ],
    },
    overwhelm: {
      text: 'Feeling overwhelmed when facing so much at once is completely understandable. The amount you\'re dealing with would overwhelm anyone—this isn\'t a personal failing.',
      reassurances: [
        'Anyone would feel overwhelmed by this much change',
        'Overwhelm is a sign you\'re processing a lot, not that you can\'t handle it',
        'You don\'t have to figure everything out at once',
      ],
    },
  };

  const normalized = normalizations[emotion.toLowerCase()] || {
    text: `Feeling ${emotion} in your situation is completely valid and understandable. Your emotions are appropriate responses to what you're experiencing.`,
    reassurances: [
      `${emotion} is a normal human emotion`,
      'Your feelings make sense given what you\'re going through',
      'Many others in similar situations feel the same way',
    ],
  };

  return {
    text: normalized.text,
    reassurances: normalized.reassurances,
  };
}