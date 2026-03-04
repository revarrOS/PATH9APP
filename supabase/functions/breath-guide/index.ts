import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface BreathRequest {
  userState?: {
    breathingRate?: number;
    anxietyLevel?: number;
    physicalTension?: string;
  };
  durationMinutes?: number;
}

interface BreathPattern {
  name: string;
  description: string;
  inhale_seconds: number;
  hold_top_seconds: number;
  exhale_seconds: number;
  hold_bottom_seconds: number;
  cycles: number;
  total_duration_seconds: number;
  visual_cues: string[];
  grounding_phrases: string[];
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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body: BreathRequest = await req.json();
    const breathingRate = body.userState?.breathingRate || 16;
    const anxietyLevel = body.userState?.anxietyLevel || 5;
    const physicalTension = body.userState?.physicalTension || 'moderate';
    const durationMinutes = body.durationMinutes || 3;

    const systemPrompt = buildSystemPrompt(breathingRate, anxietyLevel, physicalTension);
    const userPrompt = buildUserPrompt(durationMinutes);

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const orchestrateUrl = `${supabaseUrl}/functions/v1/orchestrate`;

    const orchestrateResponse = await fetch(orchestrateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        prompts: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        metadata: {
          state_hydrated: false,
          canon_included: false,
        },
        request_id: crypto.randomUUID(),
        auth_user_id: user.id,
        user_message: userPrompt,
      }),
    });

    if (!orchestrateResponse.ok) {
      throw new Error(`Orchestrate call failed: ${orchestrateResponse.statusText}`);
    }

    const orchestrateData = await orchestrateResponse.json();
    const llmResponse = orchestrateData.response || orchestrateData.data?.response || '';

    let pattern: BreathPattern;
    try {
      pattern = JSON.parse(llmResponse);
    } catch {
      const cycleTime = 4 + 0 + 6 + 0;
      const cycles = Math.floor((durationMinutes * 60) / cycleTime);
      pattern = {
        name: 'Calming Breath',
        description: 'Longer exhale to activate rest and digest',
        inhale_seconds: 4,
        hold_top_seconds: 0,
        exhale_seconds: 6,
        hold_bottom_seconds: 0,
        cycles: cycles,
        total_duration_seconds: cycles * cycleTime,
        visual_cues: [
          'Watch the circle expand as you breathe in',
          'Follow the circle contracting as you breathe out',
          'Let your body soften with each exhale',
        ],
        grounding_phrases: [
          'I am not alone in this moment',
          'My breath is always with me',
          'This too shall pass',
        ],
      };
    }

    const { error: insertError } = await supabase
      .from('meditation_sessions')
      .insert({
        user_id: user.id,
        session_type: 'breathing',
        duration_seconds: 0,
        user_state_before: body.userState || {},
        completed: false,
      });

    if (insertError) {
      console.error('Error creating session:', insertError);
    }

    return new Response(
      JSON.stringify({ success: true, pattern }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate breath pattern' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildSystemPrompt(breathingRate: number, anxietyLevel: number, physicalTension: string): string {
  return `You are Gemma, a quiet, steady recovery companion.

YOUR TONE:
- Calm, gentle, respectful, plain-spoken
- Never push or force
- Support, don't prescribe

USER CONTEXT:
- Current Breathing Rate: ${breathingRate} breaths/min (normal: 12-16)
- Anxiety Level: ${anxietyLevel}/10
- Physical Tension: ${physicalTension}

YOUR ROLE:
Design a grounding breath practice that:
1. Activates parasympathetic nervous system (rest and digest)
2. Provides visual synchronization cues
3. Uses grounding phrases for emotional safety

BREATHING SCIENCE:
- Longer exhale than inhale = calming
- 4-6 seconds exhale activates vagus nerve
- No forced holds if anxiety is high
- Natural, gentle pacing

PATTERN DESIGN:
${anxietyLevel > 7 ? '- Keep it very simple: 4 in, 6 out, no holds\n- Focus on gentle exhale extension' : ''}
${breathingRate > 18 ? '- Start with their current pace, then gradually slow\n- Emphasize gentle, not forced' : ''}
${physicalTension === 'high' ? '- Add body awareness cues\n- Release tension on exhale' : ''}

OUTPUT FORMAT (JSON):
{
  "name": "Pattern name (e.g., 'Calming Breath', 'Grounding Breath')",
  "description": "Brief explanation of why this pattern helps",
  "inhale_seconds": 3-5,
  "hold_top_seconds": 0-3,
  "exhale_seconds": 5-7,
  "hold_bottom_seconds": 0-2,
  "cycles": "Number of cycles for requested duration",
  "total_duration_seconds": "Total practice time",
  "visual_cues": ["3-4 simple cues for visual breathing guide"],
  "grounding_phrases": ["3-5 grounded phrases for emotional safety"]
}

GROUNDING PHRASES:
- "I'm not alone in this moment"
- "My breath is my anchor"
- "I can be still while I move"
- "This too shall pass"

Remember: This is Day 4-5 orientation phase. Building trust with their own breath.`;
}

function buildUserPrompt(duration: number): string {
  return `Create a ${duration}-minute breath-with-me practice.

Focus on:
- Parasympathetic nervous system activation
- Visual pacing for synchronization
- Grounding phrases for emotional safety
- "I'm not alone in this moment"

Ensure exhale is longer than inhale for maximum calming effect.`;
}
