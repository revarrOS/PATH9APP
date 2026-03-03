import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface StillnessRequest {
  userState?: {
    emotionalState?: string;
    energyLevel?: number;
    nervousSystemState?: string;
  };
  durationPreference?: number;
}

interface StillnessScript {
  title: string;
  duration_seconds: number;
  opening: string;
  body: string;
  closing: string;
  focus_points: string[];
  nervous_system_cues: string[];
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

    const body: StillnessRequest = await req.json();
    const emotionalState = body.userState?.emotionalState || 'overwhelmed';
    const energyLevel = body.userState?.energyLevel || 3;
    const nervousSystemState = body.userState?.nervousSystemState || 'activated';
    const durationPreference = body.durationPreference || 120;

    const systemPrompt = buildSystemPrompt(emotionalState, energyLevel, nervousSystemState);
    const userPrompt = buildUserPrompt(durationPreference);

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

    let script: StillnessScript;
    try {
      script = JSON.parse(llmResponse);
    } catch {
      script = {
        title: 'Just Be Still',
        duration_seconds: durationPreference,
        opening: 'Find a comfortable position. You don\'t need to do anything special.',
        body: 'Notice your breath without changing it. If thoughts come, let them pass like clouds.',
        closing: 'When you\'re ready, gently return. You did well.',
        focus_points: ['Breath awareness', 'Body sensations', 'Present moment'],
        nervous_system_cues: ['Soften your jaw', 'Release your shoulders', 'Ground your feet'],
      };
    }

    const { error: insertError } = await supabase
      .from('meditation_sessions')
      .insert({
        user_id: user.id,
        session_type: 'stillness',
        duration_seconds: 0,
        user_state_before: body.userState || {},
        completed: false,
      });

    if (insertError) {
      console.error('Error creating session:', insertError);
    }

    return new Response(
      JSON.stringify({ success: true, script }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate stillness script' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildSystemPrompt(emotionalState: string, energyLevel: number, nervousSystemState: string): string {
  return `You are Gemma, a quiet, steady recovery companion.

YOUR TONE:
- Calm, gentle, respectful, plain-spoken
- Never push or prescribe
- Support, don't force

USER CONTEXT:
- Emotional State: ${emotionalState}
- Energy Level: ${energyLevel}/10
- Nervous System: ${nervousSystemState}

YOUR ROLE:
Create a 1-2 minute stillness meditation focused on nervous system regulation. This person just needs the noise to stop.

MEDITATION PRINCIPLES:
1. Start where they are - no judgment, no expectations
2. Focus on safety and grounding
3. Use simple, gentle language
4. Normalize whatever they're feeling
5. End with validation and kindness

SPIRITUAL BOUNDARIES:
- Support grounding and reflection
- Use neutral, inclusive language
- Never interpret experiences
- Never introduce belief systems

NERVOUS SYSTEM CUES:
- Soften jaw and shoulders
- Ground through feet or seat
- Notice breath without forcing
- Allow body to be exactly as it is

OUTPUT FORMAT (JSON):
{
  "title": "Short, gentle title (3-5 words)",
  "duration_seconds": 60-120,
  "opening": "Gentle welcome and permission to be exactly as they are (2-3 sentences)",
  "body": "Main practice with nervous system cues and grounding (4-6 sentences)",
  "closing": "Validation and gentle return (2-3 sentences)",
  "focus_points": ["3-4 simple focus points"],
  "nervous_system_cues": ["3-5 gentle body awareness cues"]
}

TONE:
${emotionalState === 'anxious' || emotionalState === 'overwhelmed' ? 'Extra gentle and reassuring. Speak slowly, softly.' : ''}
${energyLevel < 4 ? 'They are tired. Keep it very simple. Allow rest.' : ''}
${nervousSystemState === 'activated' ? 'Their nervous system is on high alert. Focus on safety and grounding first.' : ''}

Remember: This is about stopping the noise, not achieving anything. Permission to simply be.`;
}

function buildUserPrompt(duration: number): string {
  return `Create a ${duration}-second stillness meditation script.

Focus on:
- Nervous system regulation
- "I just need the noise to stop"
- No pressure to achieve or feel anything specific
- Simple grounding through breath and body
- Validation and safety

This is Day 1-3 chaos phase: gentle introduction to being still.`;
}
