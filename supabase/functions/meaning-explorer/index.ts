import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface MeaningRequest {
  userHistory?: {
    sessionsCompleted?: number;
    preferredStyle?: string;
    previousReflections?: string[];
  };
  currentPhase?: string;
}

interface MeaningExploration {
  guiding_question: string;
  reflection_prompts: string[];
  exploration_activities: Array<{
    activity: string;
    why_it_helps: string;
    duration_minutes: number;
  }>;
  personal_meaning_themes: string[];
  integration_suggestions: string[];
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

    const body: MeaningRequest = await req.json();
    const sessionsCompleted = body.userHistory?.sessionsCompleted || 0;
    const preferredStyle = body.userHistory?.preferredStyle || 'unknown';
    const currentPhase = body.currentPhase || 'clarity';

    const { data: sessions } = await supabase
      .from('meditation_sessions')
      .select('notes, user_state_before, user_state_after')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentReflections = sessions?.map(s => s.notes).filter(Boolean) || [];

    const systemPrompt = buildSystemPrompt(sessionsCompleted, preferredStyle, currentPhase, recentReflections);
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

    let exploration: MeaningExploration;
    try {
      exploration = JSON.parse(llmResponse);
    } catch {
      exploration = {
        guiding_question: 'What does it mean to be still while moving through life?',
        reflection_prompts: [
          'When do you feel most at peace?',
          'What helps you feel grounded during difficult moments?',
          'How do you want to carry stillness into your daily life?',
        ],
        exploration_activities: [
          {
            activity: 'Walking meditation (5 min)',
            why_it_helps: 'Movement + mindfulness integration',
            duration_minutes: 5,
          },
          {
            activity: 'Journaling: "I can be still when..."',
            why_it_helps: 'Discover personal stillness triggers',
            duration_minutes: 10,
          },
        ],
        personal_meaning_themes: [
          'Peace within chaos',
          'Grounding through breath',
          'Self-compassion practice',
        ],
        integration_suggestions: [
          'Take 3 conscious breaths before difficult conversations',
          'Notice one moment of stillness each day',
          'Practice compassion for yourself when practice feels hard',
        ],
      };
    }

    const { error: prefError } = await supabase
      .from('meditation_preferences')
      .upsert({
        user_id: user.id,
        personal_meaning: exploration.guiding_question,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (prefError) {
      console.error('Error updating preferences:', prefError);
    }

    return new Response(
      JSON.stringify({ success: true, exploration }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate meaning exploration' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildSystemPrompt(
  sessionsCompleted: number,
  preferredStyle: string,
  currentPhase: string,
  recentReflections: string[]
): string {
  return `You are Gemma, a quiet, steady recovery companion.

YOUR TONE:
- Calm, gentle, respectful, plain-spoken, non-judgmental
- Never push or prescribe
- Support reflection, never interpret

USER CONTEXT:
- Sessions Completed: ${sessionsCompleted}
- Preferred Style: ${preferredStyle}
- Current Phase: ${currentPhase}
- Recent Reflections: ${recentReflections.length > 0 ? recentReflections.join('; ') : 'None yet'}

YOUR ROLE:
Help them discover their own "why" for meditation. This is Day 6-7+ clarity phase.

CORE INSIGHT:
"I can be still while moving" - Meditation isn't about escaping life, it's about being present within it.

SPIRITUAL BOUNDARIES (NON-NEGOTIABLE):
- Support reflection, grounding, and meaning-making
- Use neutral, inclusive language
- Allow them to frame experiences in their own belief system
- Never interpret visions or experiences
- Never validate supernatural explanations as fact
- Never introduce belief systems
- Meaning belongs to them

EXPLORATION PRINCIPLES:
1. Draw from their actual experience (recent reflections)
2. Connect practice to their real life
3. Help them articulate personal meaning
4. Bridge stillness practice to daily movement
5. No generic spirituality - make it personal and grounded

PERSONAL MEANING THEMES:
- Peace within chaos
- Self-compassion during treatment
- Presence with loved ones
- Emotional regulation
- Body awareness
- Grounding practice

OUTPUT FORMAT (JSON):
{
  "guiding_question": "One clear question that captures their emerging practice (e.g., 'What does it mean to be still while moving?')",
  "reflection_prompts": ["3-4 grounded reflection questions based on their history"],
  "exploration_activities": [
    {
      "activity": "Specific practice (e.g., 'Walking meditation', 'Compassion journaling')",
      "why_it_helps": "Personal relevance",
      "duration_minutes": 5-15
    }
  ],
  "personal_meaning_themes": ["3-5 themes emerging from their practice"],
  "integration_suggestions": ["3-5 practical ways to bring practice into daily life"]
}

INTEGRATION FOCUS:
${currentPhase === 'clarity' ? 'They are ready to integrate practice into life. Focus on practical applications.' : ''}
${sessionsCompleted < 3 ? 'They are new. Keep it simple and concrete.' : ''}
${sessionsCompleted > 10 ? 'They have experience. Support deeper personal meaning.' : ''}

Remember: This is about discovering THEIR meaning, not prescribing meditation dogma.`;
}

function buildUserPrompt(): string {
  return `Create a personal meaning exploration for this user's meditation journey.

Focus on:
- "I can be still while moving" - integrating practice into life
- Drawing from their actual experience
- Practical daily integration
- Personal relevance, not generic spirituality

This is Day 6-7+ clarity phase: helping them articulate why meditation matters to THEM.`;
}
