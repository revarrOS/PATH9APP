import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EnergyCheckInRequest {
  energyLevel: number;
  physicalSensations?: string[];
  plannedActivity?: string;
  context?: string;
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

    const body: EnergyCheckInRequest = await req.json();

    if (body.energyLevel < 1 || body.energyLevel > 10) {
      return new Response(
        JSON.stringify({ error: 'Energy level must be between 1 and 10' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const guidance = generateEnergyGuidance(
      body.energyLevel,
      body.physicalSensations,
      body.plannedActivity,
      body.context
    );

    const { error: insertError } = await supabase.from('movement_insights').insert({
      user_id: user.id,
      insight_type: 'general',
      insight_text: guidance.recommendation,
      pacing_recommendations: guidance.pacingTips,
    });

    if (insertError) {
      console.error('Error saving movement insight:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        energyAssessment: guidance.assessment,
        recommendation: guidance.recommendation,
        pacingTips: guidance.pacingTips,
        warningSign: guidance.warningSign,
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

function generateEnergyGuidance(
  energyLevel: number,
  physicalSensations?: string[],
  plannedActivity?: string,
  context?: string
) {
  let assessment = '';
  let recommendation = '';
  let pacingTips: string[] = [];
  let warningSign = '';

  const hasPain = physicalSensations?.some((s) =>
    s.toLowerCase().includes('pain') || s.toLowerCase().includes('ache')
  );
  const hasDizziness = physicalSensations?.some((s) =>
    s.toLowerCase().includes('dizzy') || s.toLowerCase().includes('lightheaded')
  );

  if (energyLevel <= 2) {
    assessment =
      "Your energy is critically low. This is a rest day, not a movement day. Your body is telling you it needs to conserve every bit of energy for healing.";

    recommendation =
      "Skip any planned movement. Rest is your activity today. If you must move, limit it to essential activities only: bathroom, getting water, moving to a more comfortable spot. Everything else can wait.";

    pacingTips = [
      'Stay near your bed or couch',
      'Ask for help with tasks today',
      'Hydrate but don't force yourself to eat heavily',
      'Check in again tomorrow - energy shifts day to day',
    ];

    warningSign =
      "If this low energy persists for 3+ days, contact your healthcare team. This could indicate treatment side effects that need adjustment.";
  } else if (energyLevel <= 4) {
    assessment =
      "Your energy is low but not depleted. Gentle micro-movements are possible, but anything more will cost you tomorrow. This is a 'maintenance' day, not a 'progress' day.";

    recommendation = hasDizziness
      ? "With dizziness present, skip standing movement. Try seated exercises: ankle circles, arm raises while sitting, gentle stretches. Stay safe."
      : "Very short, gentle movement only. Walk to one room and back. Stand for 1 minute. Stretch for 2 minutes. Then rest. Save energy for tomorrow.";

    pacingTips = [
      'Total movement time: 5 minutes maximum',
      'Rest between each small movement',
      'If energy drops further, stop immediately',
      'This is enough - don't push',
    ];

    warningSign = hasPain
      ? "Pain + low energy = higher injury risk. Be extra cautious with any movement today."
      : "If you feel worse after 5 minutes of gentle movement, you overdid it. Rest and try less tomorrow.";
  } else if (energyLevel <= 6) {
    assessment =
      "Your energy is moderate - enough for light, intentional movement. You can do something today, but the key is pacing. Don't use up all your energy in one burst.";

    recommendation = plannedActivity
      ? `You can try ${plannedActivity}, but cut your usual time in half. If you normally do 20 minutes, do 10. If you do 10, do 5. Start smaller than feels necessary.`
      : "Light walking (5-10 minutes), gentle stretching, or seated exercises are good options. Focus on movement that feels restorative, not exhausting.";

    pacingTips = [
      'Start with 5 minutes, assess how you feel',
      'Take breaks every 2-3 minutes',
      'Stop before you feel tired, not after',
      'Check your energy 2 hours later - that's the real test',
    ];

    warningSign =
      "If you feel significantly worse 2 hours after movement, you overdid it. Scale back next time.";
  } else if (energyLevel <= 8) {
    assessment =
      "Your energy is relatively good today. This is a green light for moderate movement - but still not a 'push hard' day. Use this energy wisely.";

    recommendation =
      "Walking 10-15 minutes, light yoga, gentle strengthening exercises, or stretching routines are all appropriate. You can challenge yourself lightly, but avoid exhaustion.";

    pacingTips = [
      'Aim for 10-20 minutes of continuous movement',
      'Stop if you feel your energy dropping mid-activity',
      'Good days are for building consistency, not maxing out',
      'Leave some energy in the tank',
    ];

    warningSign =
      "Don't let a good day tempt you to overdo it. Tomorrow's energy depends on today's pacing.";
  } else {
    assessment =
      "Your energy is strong today. This is a great opportunity for meaningful movement - but remember, your baseline is different now. 'Strong' doesn't mean pre-illness capacity.";

    recommendation =
      "You can do 15-20 minutes of moderate activity: longer walks, light strength work, yoga flows, gentle cardio. Still prioritize form and safety over intensity.";

    pacingTips = [
      'Build duration before intensity',
      'Focus on consistency, not pushing limits',
      'High energy days are for progress, not breakthroughs',
      'Still rest between activities',
    ];

    warningSign =
      "Even on high-energy days, overdoing it will cost you 2-3 days of recovery. Pace yourself.";
  }

  return {
    assessment,
    recommendation,
    pacingTips,
    warningSign,
  };
}
