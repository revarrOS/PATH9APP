import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WalkingGuideRequest {
  currentEnergy: 'very_low' | 'low' | 'moderate' | 'good';
  canWalkOutside: boolean;
  painLevel: number;
  recentActivities?: any[];
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

    const body: WalkingGuideRequest = await req.json();

    const guide = generateWalkingGuide(
      body.currentEnergy,
      body.canWalkOutside,
      body.painLevel,
      body.recentActivities
    );

    const { error: insertError } = await supabase
      .from('movement_insights')
      .insert({
        user_id: user.id,
        insight_type: 'walking_guide',
        insight_text: guide.mainGuidance,
        pacing_recommendations: guide.specificSteps,
      });

    if (insertError) {
      console.error('Error saving movement insight:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        guidance: guide.mainGuidance,
        specificSteps: guide.specificSteps,
        safetyTips: guide.safetyTips,
        progressionPlan: guide.progressionPlan,
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

function generateWalkingGuide(
  currentEnergy: string,
  canWalkOutside: boolean,
  painLevel: number,
  recentActivities?: any[]
) {
  let mainGuidance = '';
  let specificSteps: string[] = [];
  let safetyTips: string[] = [];
  let progressionPlan = '';

  if (currentEnergy === 'very_low' || painLevel > 6) {
    mainGuidance =
      "Walking right now means moving from your bed to a chair, or standing for 30 seconds. That's it. That's legitimate movement medicine. Don't think 'walk around the block.' Think 'stand up twice today.' When you're this depleted, micro-movements protect your future mobility.";

    specificSteps = [
      'Sit on the edge of your bed for 1 minute',
      'Stand up for 30 seconds, holding onto something',
      'Walk to the bathroom slowly',
      'Sit in a different chair for 5 minutes',
    ];

    safetyTips = [
      'Keep one hand on furniture or walls',
      'Rest before you feel exhausted',
      'Dizzy? Sit immediately, no pushing through',
      'Two small walks beat one big one',
    ];

    progressionPlan =
      "When you can do these micro-movements 2 days in a row without crashes, add 30 more seconds of standing. That's it. No rush.";
  } else if (currentEnergy === 'low' || painLevel > 3) {
    mainGuidance =
      "Your walking medicine today is 2-5 minutes, slow pace, with breaks. Not 'get your heart rate up.' Not 'break a sweat.' Just gentle, steady movement. Inside the house is perfect. Around one room is enough. This isn't about fitness - it's about maintaining basic mobility.";

    specificSteps = [
      'Walk around one room (living room or kitchen)',
      'Aim for 2-3 minutes of continuous movement',
      'Rest for 5 minutes, then decide if you can do another lap',
      'If tired, sit and consider it a success',
    ];

    safetyTips = [
      'Stay where you can sit down quickly',
      'Use walls for balance if needed',
      'Stop at the first sign of fatigue',
      'Morning walks often work better than afternoon',
    ];

    progressionPlan =
      "When 2-3 minutes feels manageable for 3 days straight, add 1 more minute. Build slowly. Your body will tell you when it's ready for more.";
  } else if (canWalkOutside && currentEnergy === 'moderate') {
    mainGuidance =
      "You're ready for a short outdoor walk - but short means 5-10 minutes total, including the walk back. Not a workout. Not a loop around the neighborhood. A gentle, slow walk to the mailbox or end of the block and back. Fresh air is medicine. Overexertion is setback. Find the line.";

    specificSteps = [
      'Walk to the end of your driveway or one house down',
      'Pause, check in with your body',
      'Walk back at the same slow pace',
      'Total time: 5-7 minutes',
    ];

    safetyTips = [
      'Bring your phone in case you need a ride back',
      'Tell someone where you're going',
      'Turn back early if energy drops',
      'Shade is better than sun right now',
    ];

    progressionPlan =
      "If you can do this 3-4 times this week without next-day fatigue, increase to 10 minutes next week. Consistency beats intensity every time.";
  } else {
    mainGuidance =
      "Walking is one of the safest, most effective forms of movement medicine during treatment. It maintains circulation, protects muscle, helps mood, and doesn't require equipment. But it has to match your actual energy - not your old baseline. Start smaller than you think you should. Build from there.";

    specificSteps = [
      'Start with 5 minutes inside your home',
      'If that feels good, try 5-7 minutes outside',
      'Flat surfaces only - no hills or stairs yet',
      'Track how you feel 2 hours after, not during',
    ];

    safetyTips = [
      'Never walk alone if you're feeling unstable',
      'Bring water, even for short walks',
      'Morning or evening - avoid heat',
      'Rest is always allowed, even mid-walk',
    ];

    progressionPlan =
      "Increase by 2-3 minutes per week if you're not experiencing next-day crashes. The goal is sustainable movement, not speed or distance.";
  }

  return {
    mainGuidance,
    specificSteps,
    safetyTips,
    progressionPlan,
  };
}
