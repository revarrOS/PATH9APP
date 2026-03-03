import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RealityExplainerRequest {
  symptoms: string[];
  conditions: string[];
  energyLevel: 'very_low' | 'low' | 'moderate';
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body: RealityExplainerRequest = await req.json();

    const explanation = generateRealityExplanation(
      body.symptoms,
      body.conditions,
      body.energyLevel
    );

    const { error: insertError } = await supabase
      .from('movement_insights')
      .insert({
        user_id: user.id,
        insight_type: 'reality_check',
        insight_text: explanation.mainMessage,
        pacing_recommendations: explanation.pacingTips,
      });

    if (insertError) {
      console.error('Error saving movement insight:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        explanation: explanation.mainMessage,
        pacingTips: explanation.pacingTips,
        reassurance: explanation.reassurance,
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

function generateRealityExplanation(
  symptoms: string[],
  conditions: string[],
  energyLevel: string
) {
  const hasSymptoms = symptoms.length > 0;
  const hasFatigue = symptoms.some((s) =>
    s.toLowerCase().includes('fatigue') || s.toLowerCase().includes('tired')
  );
  const hasAnemia = conditions.some((c) => c.toLowerCase().includes('anemia'));
  const hasWeakness = symptoms.some((s) => s.toLowerCase().includes('weak'));

  let mainMessage = '';
  let pacingTips: string[] = [];
  let reassurance = '';

  if (energyLevel === 'very_low') {
    mainMessage =
      "Your body is working incredibly hard right now - harder than most people realize. What feels like 'doing nothing' is actually your body doing massive work: repairing cells, fighting inflammation, managing treatment side effects. Movement looks different for you right now, and that's exactly how it should be.";

    pacingTips = [
      'Rest is active healing, not laziness',
      'Even sitting up counts as movement today',
      'Listen to your body first, expectations second',
      'Good days and bad days are both normal',
    ];

    reassurance =
      "Your body isn't broken. It's redirecting all its energy to what matters most right now - healing. Movement will come back, but forcing it now would actually slow your recovery.";
  } else if (hasFatigue || hasAnemia) {
    mainMessage =
      "Fatigue from illness or treatment isn't the same as regular tiredness. Your muscles might be weaker, your endurance lower, and that's a real physical change - not in your head. Movement is still possible and helpful, but it needs to match where your body actually is right now, not where it used to be.";

    pacingTips = [
      'Start with 2-5 minutes, not 20-30',
      'Sitting exercises count as real movement',
      'Rest between activities, not just at the end',
      'Good energy in the morning? Use it then',
    ];

    reassurance =
      "What you're experiencing is called 'cancer-related fatigue' or 'treatment fatigue,' and it's one of the most common challenges. You're not imagining it, and you're not weak. Your body is legitimately different right now.";
  } else if (hasWeakness) {
    mainMessage =
      "Muscle weakness during treatment is real and measurable. Your body might be breaking down muscle for energy, or treatment might be affecting nerve signals. This means movement needs to be gentler and more strategic than before. Walking counts. Standing counts. Moving from bed to chair counts.";

    pacingTips = [
      'Focus on maintaining, not improving',
      'Use walls, counters, and furniture for support',
      'Short bursts are better than one long session',
      'Some movement beats perfect movement every time',
    ];

    reassurance =
      "Weakness doesn't mean you're failing. It means your body is prioritizing survival and healing over strength. As treatment progresses or your body recovers, strength will rebuild. For now, any movement you do is protecting your future mobility.";
  } else {
    mainMessage =
      "Your body is in a state of change right now. What used to feel easy might feel hard. What you could do before might not be possible today. That's not a moral failing or a character flaw - it's biology. Movement can help, but only if it matches your actual capacity, not your expectations.";

    pacingTips = [
      'Start smaller than you think you need to',
      'Track how you feel after, not during',
      'Rest is part of the plan, not a failure',
      'Consistency beats intensity every single time',
    ];

    reassurance =
      "You don't have to earn rest. You don't have to push through pain. You don't have to prove anything. The most powerful thing you can do right now is trust your body's signals.";
  }

  return {
    mainMessage,
    pacingTips,
    reassurance,
  };
}
