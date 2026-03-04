import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateSessionRequest {
  sessionType: 'stillness' | 'breathing' | 'meaning_search' | 'custom';
  durationSeconds?: number;
  userStateBefore?: Record<string, any>;
}

interface UpdateSessionRequest {
  sessionId: string;
  completed?: boolean;
  durationSeconds?: number;
  userStateAfter?: Record<string, any>;
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
      const body: CreateSessionRequest = await req.json();

      if (!body.sessionType) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: sessionType' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: session, error } = await supabase
        .from('meditation_sessions')
        .insert({
          user_id: user.id,
          session_type: body.sessionType,
          duration_seconds: body.durationSeconds || 0,
          user_state_before: body.userStateBefore || {},
          completed: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating meditation session:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create meditation session' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, session }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (req.method === 'PUT') {
      const body: UpdateSessionRequest = await req.json();

      if (!body.sessionId) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: sessionId' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const updateData: Record<string, any> = {};
      if (body.completed !== undefined) updateData.completed = body.completed;
      if (body.durationSeconds !== undefined) updateData.duration_seconds = body.durationSeconds;
      if (body.userStateAfter) updateData.user_state_after = body.userStateAfter;
      if (body.notes) updateData.notes = body.notes;

      const { data: session, error } = await supabase
        .from('meditation_sessions')
        .update(updateData)
        .eq('id', body.sessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating meditation session:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update meditation session' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, session }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (req.method === 'GET') {
      const url = new URL(req.url);
      const sessionType = url.searchParams.get('sessionType');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      let query = supabase
        .from('meditation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (sessionType) {
        query = query.eq('session_type', sessionType);
      }

      const { data: sessions, error } = await query;

      if (error) {
        console.error('Error fetching meditation sessions:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch meditation sessions' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, sessions }),
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