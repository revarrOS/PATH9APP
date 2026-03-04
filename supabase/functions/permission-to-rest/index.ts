import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PermissionRequest {
  guiltSource?: string;
  activities_skipped?: string[];
  concernAbout?: string;
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

    const body: PermissionRequest = await req.json();

    const permission = generatePermissionToRest(
      body.guiltSource,
      body.activities_skipped,
      body.concernAbout
    );

    const { error: insertError } = await supabase
      .from('movement_insights')
      .insert({
        user_id: user.id,
        insight_type: 'rest_permission',
        insight_text: permission.mainMessage,
        pacing_recommendations: permission.reminders,
      });

    if (insertError) {
      console.error('Error saving movement insight:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        permission: permission.mainMessage,
        reminders: permission.reminders,
        affirmation: permission.affirmation,
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

function generatePermissionToRest(
  guiltSource?: string,
  activitiesSkipped?: string[],
  concernAbout?: string
) {
  const hasGuilt = guiltSource && guiltSource.length > 0;
  const skippedActivities = activitiesSkipped || [];
  const hasConcerns = concernAbout && concernAbout.length > 0;

  let mainMessage = '';
  let reminders: string[] = [];
  let affirmation = '';

  if (hasGuilt && guiltSource.toLowerCase().includes('others')) {
    mainMessage =
      "You are not a burden. You are a person healing. The people who care about you want you to rest and recover - not push yourself to collapse to make them comfortable. Saying 'I need to rest today' is not letting anyone down. It's being honest about what your body needs to heal.";

    reminders = [
      'Rest today = more capacity tomorrow',
      'Your worth is not measured in productivity',
      'Healing is active work, not laziness',
      'People who love you want you healthy, not exhausted',
    ];

    affirmation =
      "You are allowed to stop. You are allowed to rest. You are allowed to take care of yourself without earning it.";
  } else if (skippedActivities.length > 0) {
    mainMessage =
      "Skipping activities right now isn't giving up. It's strategic resource management. Your body has limited energy, and healing takes most of it. Choosing rest over activities isn't failure - it's prioritizing what matters most: your recovery.";

    reminders = [
      'Missing activities now protects future you',
      'Rest is treatment, not avoidance',
      'You can return to activities when ready',
      'Healing first, everything else second',
    ];

    affirmation =
      "Every activity you skip to rest is an investment in your future health. You're not quitting. You're healing.";
  } else if (hasConcerns && concernAbout.toLowerCase().includes('fitness')) {
    mainMessage =
      "Losing fitness during treatment is expected and reversible. Your body will rebuild strength when it's ready. Right now, maintaining baseline function is the goal - not improvement. Resting today doesn't erase your progress. Pushing too hard does.";

    reminders = [
      'Fitness returns faster than you think',
      'Muscle memory is real and powerful',
      'Rest preserves more than it costs',
      'Recovery today = capacity tomorrow',
    ];

    affirmation =
      "You are not losing everything. You are protecting your foundation so you can rebuild when ready.";
  } else {
    mainMessage =
      "You don't have to earn permission to rest. You don't have to be 'sick enough.' You don't have to prove you're tired. If your body is asking for rest, that's enough. Rest is not weakness. It's wisdom.";

    reminders = [
      'Rest is part of healing, not a break from it',
      'Your body knows what it needs',
      'Resting today prevents crashes tomorrow',
      'You are allowed to stop',
    ];

    affirmation =
      "You are allowed to rest. No justification needed. No permission required. Just rest.";
  }

  return {
    mainMessage,
    reminders,
    affirmation,
  };
}
