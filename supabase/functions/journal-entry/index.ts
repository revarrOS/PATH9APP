import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateJournalEntryRequest {
  pathwayType: 'medical' | 'nutrition' | 'meditation' | 'mindfulness' | 'movement';
  entryText: string;
  entryDate?: string;
  emotionalTags?: string[];
}

interface GetJournalEntriesRequest {
  pathwayType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
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

    // Verify user is authenticated
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
      // Create new journal entry
      const body: CreateJournalEntryRequest = await req.json();

      if (!body.pathwayType || !body.entryText) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: pathwayType, entryText' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          pathway_type: body.pathwayType,
          entry_text: body.entryText,
          entry_date: body.entryDate || new Date().toISOString().split('T')[0],
          emotional_tags: body.emotionalTags || [],
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating journal entry:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create journal entry' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, entry: data }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (req.method === 'GET') {
      // Retrieve journal entries
      const url = new URL(req.url);
      const pathwayType = url.searchParams.get('pathwayType');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(limit);

      if (pathwayType) {
        query = query.eq('pathway_type', pathwayType);
      }

      if (startDate) {
        query = query.gte('entry_date', startDate);
      }

      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching journal entries:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch journal entries' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, entries: data }),
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