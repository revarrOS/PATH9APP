import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SelectionRequest {
  currentState: {
    emotionalState: string;
    energyLevel: number;
    timeAvailable: number;
    nervousSystemState?: string;
  };
}

interface MeditationRecommendation {
  recommended_type: 'stillness' | 'breathing' | 'meaning_search' | 'guided_calm' | 'waking';
  reason: string;
  suggested_duration_seconds: number;
  preparation_cues: string[];
  focus_intention: string;
  end_state_goal: string;
  service_endpoint: string;
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

    const body: SelectionRequest = await req.json();
    const { emotionalState, energyLevel, timeAvailable, nervousSystemState } = body.currentState;

    const { data: sessionHistory } = await supabase
      .from('meditation_sessions')
      .select('session_type, completed, user_state_after')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const sessionsCompleted = sessionHistory?.filter(s => s.completed).length || 0;

    const { data: preferences } = await supabase
      .from('meditation_preferences')
      .select('preferred_style, preferred_duration, personal_meaning')
      .eq('user_id', user.id)
      .maybeSingle();

    const systemPrompt = buildSystemPrompt(
      emotionalState,
      energyLevel,
      timeAvailable,
      nervousSystemState || 'unknown',
      sessionsCompleted,
      preferences
    );
    const userPrompt = buildUserPrompt();

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

    let recommendation: MeditationRecommendation;
    try {
      recommendation = JSON.parse(llmResponse);
    } catch {
      recommendation = {
        recommended_type: 'stillness',
        reason: 'Starting simple with stillness practice',
        suggested_duration_seconds: Math.min(timeAvailable * 60, 120),
        preparation_cues: [
          'Find a comfortable seated position',
          'Take three deep breaths',
          'Allow yourself to arrive exactly as you are',
        ],
        focus_intention: 'Simply be present, no expectations',
        end_state_goal: 'A few moments of quiet',
        service_endpoint: 'stillness-starter',
      };
    }

    return new Response(
      JSON.stringify({ success: true, recommendation }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate meditation recommendation' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildSystemPrompt(
  emotionalState: string,
  energyLevel: number,
  timeAvailable: number,
  nervousSystemState: string,
  sessionsCompleted: number,
  preferences: any
): string {
  return `You are Gemma, a quiet, steady recovery companion.

YOUR TONE:
- Calm, gentle, respectful, plain-spoken
- Never push or prescribe
- Support, don't force

YOUR ROLE:
Help select an appropriate meditation practice for their current state.

USER CONTEXT:
- Emotional State: ${emotionalState}
- Energy Level: ${energyLevel}/10
- Time Available: ${timeAvailable} minutes
- Nervous System: ${nervousSystemState}
- Sessions Completed: ${sessionsCompleted}
- Preferred Style: ${preferences?.preferred_style || 'unknown'}
- Personal Meaning: ${preferences?.personal_meaning || 'not yet defined'}

AVAILABLE PRACTICES:
1. **stillness** (1-2 min) - Day 1-3 chaos phase
   - "I just need the noise to stop"
   - Nervous system regulation
   - Gentle introduction to sitting still
   - Best for: High anxiety, overwhelm, new to practice

2. **breathing** (2-5 min) - Day 4-5 orientation
   - "I'm not alone in this moment"
   - Grounding through breath
   - Visual pacing and synchronization
   - Best for: Moderate anxiety, need grounding, building confidence

3. **meaning_search** (5-10 min) - Day 6-7+ clarity
   - "I can be still while moving"
   - Personal meaning discovery
   - Integration into daily life
   - Best for: Ready for depth, establishing regular practice

4. **guided_calm** (3-10 min) - Adaptive
   - Gentle guided meditation
   - Adjustable length and tone
   - State-aware content
   - Best for: Needs support, varies by mood

5. **waking** (5-15 min) - Movement + mindfulness
   - Walking meditation intro
   - Body awareness in motion
   - Integration practice
   - Best for: Higher energy, needs movement

SELECTION CRITERIA:
- Match practice to current state, not aspirations
- Consider time constraints realistically
- Progression: stillness → breathing → meaning → integration
- Honor their energy level
- Meet them where they are today

OUTPUT FORMAT (JSON):
{
  "recommended_type": "stillness|breathing|meaning_search|guided_calm|waking",
  "reason": "Clear explanation why this practice matches their current state",
  "suggested_duration_seconds": 60-900,
  "preparation_cues": ["3-4 steps to get ready"],
  "focus_intention": "What to focus on during practice",
  "end_state_goal": "What they might experience after",
  "service_endpoint": "stillness-starter|breath-guide|meaning-explorer|meditation-adapt|movement-activity"
}

DECISION LOGIC:
${emotionalState === 'overwhelmed' || emotionalState === 'anxious' ? '- High anxiety detected. Recommend stillness (shortest) or breathing (grounding)' : ''}
${energyLevel < 4 ? '- Low energy. Keep it gentle and short. Stillness or guided calm.' : ''}
${energyLevel > 7 ? '- High energy. Consider waking meditation or breathing for focus.' : ''}
${timeAvailable < 3 ? '- Limited time. Stillness starter (1-2 min) is best.' : ''}
${sessionsCompleted < 3 ? '- New to practice. Start with stillness or breathing basics.' : ''}
${sessionsCompleted > 10 ? '- Experienced practitioner. Can explore meaning or integration.' : ''}

Remember: The best practice is the one they will actually do. Match their reality, not ideals.`;
}

function buildUserPrompt(): string {
  return `Recommend the most appropriate meditation practice for this user's current state.

Consider:
- Their actual emotional and physical state RIGHT NOW
- Time they have available
- Experience level
- Progression through chaos → orientation → clarity
- What will actually help them in this moment

Provide clear reasoning and actionable preparation steps.`;
}
