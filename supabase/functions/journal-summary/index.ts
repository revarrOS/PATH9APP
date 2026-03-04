import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateSummaryRequest {
  pathwayType: 'medical' | 'nutrition' | 'meditation' | 'mindfulness' | 'movement';
  startDate?: string;
  endDate?: string;
}

interface JournalEntry {
  id: string;
  entry_text: string;
  entry_date: string;
  emotional_tags: string[];
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    // Client for user authentication
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Service client for summary operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
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
      // Generate new summary
      const body: GenerateSummaryRequest = await req.json();

      if (!body.pathwayType) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: pathwayType' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Calculate date range (default: last 7 days)
      const endDate = body.endDate || new Date().toISOString().split('T')[0];
      const startDate = body.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch journal entries for the period
      const { data: entries, error: entriesError } = await supabaseClient
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('pathway_type', body.pathwayType)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true });

      if (entriesError) {
        console.error('Error fetching journal entries:', entriesError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch journal entries' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!entries || entries.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No journal entries found for the specified period' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Generate AI summary
      const summary = await generateAISummary(entries as JournalEntry[], body.pathwayType);

      // Save summary to database
      const { data: summaryData, error: summaryError } = await supabaseService
        .from('journal_summaries')
        .insert({
          user_id: user.id,
          pathway_type: body.pathwayType,
          summary_period_start: startDate,
          summary_period_end: endDate,
          summary_text: summary.text,
          detected_patterns: summary.patterns,
        })
        .select()
        .single();

      if (summaryError) {
        console.error('Error saving journal summary:', summaryError);
        return new Response(
          JSON.stringify({ error: 'Failed to save journal summary' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, summary: summaryData }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (req.method === 'GET') {
      // Retrieve existing summaries
      const url = new URL(req.url);
      const pathwayType = url.searchParams.get('pathwayType');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      let query = supabaseClient
        .from('journal_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('summary_period_end', { ascending: false })
        .limit(limit);

      if (pathwayType) {
        query = query.eq('pathway_type', pathwayType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching journal summaries:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch journal summaries' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, summaries: data }),
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

async function generateAISummary(
  entries: JournalEntry[],
  pathwayType: string
): Promise<{ text: string; patterns: any }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiKey) {
    // Fallback to basic summary if no AI key
    return generateBasicSummary(entries, pathwayType);
  }

  try {
    const entriesText = entries
      .map((e, i) => `Entry ${i + 1} (${e.entry_date}):\n${e.entry_text}\n`)
      .join('\n');

    const prompt = `You are analyzing journal entries from a user's ${pathwayType} journey. Review these entries and provide:

1. A compassionate, 3-4 sentence summary of their journey during this period
2. Key patterns you notice (emotional, behavioral, progress)
3. Any triggers or recurring themes
4. Signs of growth or areas needing support

Journal Entries:
${entriesText}

Respond in JSON format:
{
  "summary": "Your compassionate summary here",
  "patterns": {
    "emotional_themes": ["theme1", "theme2"],
    "triggers": ["trigger1", "trigger2"],
    "growth_areas": ["area1", "area2"],
    "support_needed": ["need1", "need2"]
  }
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are Gemma, a quiet, steady recovery companion. Your tone is calm, gentle, respectful, and plain-spoken. You normalize difficult emotions (fear, anger, grief, confusion) without minimizing pain. You never rush emotional processing.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return generateBasicSummary(entries, pathwayType);
    }

    const result = await response.json();
    const parsed = JSON.parse(result.choices[0].message.content);

    return {
      text: parsed.summary,
      patterns: parsed.patterns,
    };
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return generateBasicSummary(entries, pathwayType);
  }
}

function generateBasicSummary(
  entries: JournalEntry[],
  pathwayType: string
): { text: string; patterns: any } {
  const emotionalTags = entries.flatMap((e) => e.emotional_tags || []);
  const uniqueTags = [...new Set(emotionalTags)];

  return {
    text: `You've made ${entries.length} journal entries in your ${pathwayType} journey during this period. This shows commitment to self-reflection and growth.`,
    patterns: {
      emotional_themes: uniqueTags.slice(0, 5),
      triggers: [],
      growth_areas: ['Consistent journaling practice'],
      support_needed: [],
    },
  };
}