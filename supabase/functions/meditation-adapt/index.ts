import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AdaptRequest {
  meditationType: 'stillness' | 'breathing' | 'body_scan' | 'compassion' | 'custom';
  userState: {
    emotionalState: string;
    energyLevel: number;
    timeAvailable: number;
    preferredTone?: 'gentle' | 'neutral' | 'encouraging';
  };
}

interface AdaptedMeditation {
  meditation_type: string;
  actual_duration_seconds: number;
  tone_applied: string;
  script: {
    opening: string;
    main_practice: string[];
    transitions: string[];
    closing: string;
  };
  pacing_guidance: {
    speak_pace: string;
    pause_seconds: number[];
    emphasis_points: string[];
  };
  adaptation_notes: string;
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

    const body: AdaptRequest = await req.json();
    const { meditationType, userState } = body;

    const systemPrompt = buildSystemPrompt(meditationType, userState);
    const userPrompt = buildUserPrompt(meditationType, userState.timeAvailable);

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

    let adapted: AdaptedMeditation;
    try {
      adapted = JSON.parse(llmResponse);
    } catch {
      adapted = {
        meditation_type: meditationType,
        actual_duration_seconds: userState.timeAvailable * 60,
        tone_applied: userState.preferredTone || 'gentle',
        script: {
          opening: 'Find a comfortable position. Allow yourself to arrive exactly as you are.',
          main_practice: [
            'Notice your breath without trying to change it.',
            'If thoughts arise, simply acknowledge them and return to breath.',
            'Allow your body to soften with each exhale.',
          ],
          transitions: [
            'Now gently shift your awareness...',
            'In your own time...',
          ],
          closing: 'When you\'re ready, gently return. Thank yourself for taking this time.',
        },
        pacing_guidance: {
          speak_pace: 'slow and gentle',
          pause_seconds: [3, 5, 3],
          emphasis_points: ['breath', 'allow', 'gently'],
        },
        adaptation_notes: 'Adapted for current state and time available',
      };
    }

    const { error: insertError } = await supabase
      .from('meditation_sessions')
      .insert({
        user_id: user.id,
        session_type: meditationType === 'stillness' ? 'stillness' :
                      meditationType === 'breathing' ? 'breathing' : 'custom',
        duration_seconds: 0,
        user_state_before: userState,
        completed: false,
      });

    if (insertError) {
      console.error('Error creating session:', insertError);
    }

    return new Response(
      JSON.stringify({ success: true, adapted }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to adapt meditation' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildSystemPrompt(meditationType: string, userState: any): string {
  const { emotionalState, energyLevel, timeAvailable, preferredTone } = userState;

  return `You are Gemma, a quiet, steady recovery companion.

YOUR TONE:
- Calm, gentle, respectful, plain-spoken
- Never push or prescribe
- Support, don't force

YOUR ROLE:
Adapt meditation practices for people's current states.

USER CONTEXT:
- Emotional State: ${emotionalState}
- Energy Level: ${energyLevel}/10
- Time Available: ${timeAvailable} minutes
- Preferred Tone: ${preferredTone || 'gentle'}

MEDITATION TYPE: ${meditationType}

YOUR ROLE:
Create a personalized meditation script that adapts to:
1. Current emotional state (adjust tone and pacing)
2. Available time (compress or expand appropriately)
3. Energy level (match intensity)

TONE ADAPTATION:
- **gentle**: Extra soft, reassuring, permission-giving
  - Use: "allow", "invite", "if you'd like", "in your own time"
  - Pace: Slower, more pauses
  - Best for: Anxiety, overwhelm, low energy

- **neutral**: Clear, straightforward, grounding
  - Use: "notice", "return to", "simply observe"
  - Pace: Steady, balanced
  - Best for: Moderate states, building routine

- **encouraging**: Supportive, empowering, building confidence
  - Use: "you're doing well", "trust your practice", "you've got this"
  - Pace: Slightly upbeat, energizing
  - Best for: Building momentum, higher energy

LENGTH ADAPTATION:
${timeAvailable < 3 ? 'VERY SHORT - Focus on one simple anchor (breath). Minimal transitions.' : ''}
${timeAvailable >= 3 && timeAvailable < 7 ? 'SHORT - One primary practice with gentle opening/closing.' : ''}
${timeAvailable >= 7 ? 'FULL - Can include multiple elements, deeper exploration.' : ''}

ENERGY ADAPTATION:
${energyLevel < 4 ? 'LOW ENERGY - Allow rest, minimal effort, permission to be tired.' : ''}
${energyLevel >= 4 && energyLevel < 7 ? 'MODERATE - Balanced engagement, gentle focus.' : ''}
${energyLevel >= 7 ? 'HIGH ENERGY - Can work with energy, grounding through movement or focus.' : ''}

EMOTIONAL ADAPTATION:
${emotionalState === 'anxious' || emotionalState === 'overwhelmed' ? 'ANXIOUS - Extra grounding, nervous system focus, safety cues.' : ''}
${emotionalState === 'sad' || emotionalState === 'grieving' ? 'TENDER - Compassionate tone, permission to feel, self-kindness.' : ''}
${emotionalState === 'calm' || emotionalState === 'peaceful' ? 'STABLE - Deepen awareness, explore subtleties.' : ''}

OUTPUT FORMAT (JSON):
{
  "meditation_type": "${meditationType}",
  "actual_duration_seconds": "Realistic time for this adaptation",
  "tone_applied": "gentle|neutral|encouraging",
  "script": {
    "opening": "Welcome and arrival (2-3 sentences)",
    "main_practice": ["Array of 3-6 main guidance statements"],
    "transitions": ["Gentle transition phrases between sections"],
    "closing": "Validation and return (2-3 sentences)"
  },
  "pacing_guidance": {
    "speak_pace": "Description of speaking pace",
    "pause_seconds": [Array of pause lengths between sections],
    "emphasis_points": ["Key words to emphasize"]
  },
  "adaptation_notes": "How this was adapted for their specific state"
}

SPIRITUAL BOUNDARIES (NON-NEGOTIABLE):
- Support grounding and reflection
- Use neutral, inclusive language
- Allow them to frame experiences in their own belief system
- Never interpret experiences
- Never introduce belief systems

SCRIPT QUALITY:
- Natural, conversational language
- No spiritual jargon
- Person-first, not prescriptive
- Give permission, don't demand
- Honor their actual experience

Remember: The best meditation is the one they can actually do right now. Adapt to reality.`;
}

function buildUserPrompt(meditationType: string, timeAvailable: number): string {
  return `Create an adapted ${meditationType} meditation for ${timeAvailable} minutes.

Requirements:
- Match the user's current emotional and energy state
- Adjust tone and pacing appropriately
- Fit realistically within time available
- Provide clear pacing guidance for audio/visual presentation
- Make it accessible and doable, not aspirational

Focus on what will actually help them in this moment.`;
}
