import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface LogActivityRequest {
  activityType: string;
  durationMinutes: number;
  intensity: 'rest' | 'light' | 'moderate';
  howFeltBefore?: string;
  howFeltAfter?: string;
  notes?: string;
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
      const body: LogActivityRequest = await req.json();

      if (!body.activityType || body.durationMinutes === undefined || !body.intensity) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: activityType, durationMinutes, intensity' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: activity, error } = await supabase
        .from('movement_activities')
        .insert({
          user_id: user.id,
          activity_type: body.activityType,
          duration_minutes: body.durationMinutes,
          intensity: body.intensity,
          how_felt_before: body.howFeltBefore,
          how_felt_after: body.howFeltAfter,
          notes: body.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging movement activity:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to log movement activity' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, activity }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      const activityType = url.searchParams.get('activityType');
      const limit = parseInt(url.searchParams.get('limit') || '30');

      let query = supabase
        .from('movement_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (activityType) {
        query = query.eq('activity_type', activityType);
      }

      const { data: activities, error } = await query;

      if (error) {
        console.error('Error fetching movement activities:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch movement activities' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, activities }),
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