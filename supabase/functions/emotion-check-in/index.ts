import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CheckInRequest {
  namedEmotion: string;
  intensity: number;
  triggerContext?: string;
  bodySensations?: string;
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

    if (req.method === 'POST') {
      const body: CheckInRequest = await req.json();

      if (!body.namedEmotion || !body.intensity) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: namedEmotion, intensity' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (body.intensity < 1 || body.intensity > 10) {
        return new Response(
          JSON.stringify({ error: 'Intensity must be between 1 and 10' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: checkIn, error } = await supabase
        .from('emotion_check_ins')
        .insert({
          user_id: user.id,
          named_emotion: body.namedEmotion,
          intensity: body.intensity,
          trigger_context: body.triggerContext,
          body_sensations: body.bodySensations,
          normalized: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating emotion check-in:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create emotion check-in' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: profile } = await supabase
        .from('mindfulness_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentEmotions = profile?.identified_emotions || [];
      if (!currentEmotions.includes(body.namedEmotion)) {
        currentEmotions.push(body.namedEmotion);
        
        if (profile) {
          await supabase
            .from('mindfulness_profiles')
            .update({ identified_emotions: currentEmotions })
            .eq('user_id', user.id);
        } else {
          await supabase
            .from('mindfulness_profiles')
            .insert({
              user_id: user.id,
              identified_emotions: currentEmotions,
            });
        }
      }

      return new Response(
        JSON.stringify({ success: true, checkIn }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '30');

      const { data: checkIns, error } = await supabase
        .from('emotion_check_ins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching emotion check-ins:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch emotion check-ins' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, checkIns }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
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