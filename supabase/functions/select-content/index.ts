import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SelectContentRequest {
  pathwayType: 'medical' | 'nutrition' | 'meditation' | 'mindfulness' | 'movement';
  contentType?: 'exercise' | 'prompt' | 'article' | 'audio_guide' | 'reflection';
  userState: {
    emotionalState?: string;
    energyLevel?: string;
    context?: Record<string, any>;
  };
}

interface ContentLibraryItem {
  id: string;
  content_type: string;
  pathway_type: string;
  title: string;
  description: string;
  content_body: string;
  metadata: Record<string, any>;
  state_requirements: Record<string, any>;
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

    // Service client for content operations
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
      // Select appropriate content based on user state
      const body: SelectContentRequest = await req.json();

      if (!body.pathwayType || !body.userState) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: pathwayType, userState' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Save user state snapshot
      await supabaseService.from('user_state_snapshots').insert({
        user_id: user.id,
        pathway_type: body.pathwayType,
        emotional_state: body.userState.emotionalState,
        energy_level: body.userState.energyLevel,
        context: body.userState.context || {},
      });

      // Get content history to avoid repetition
      const { data: history } = await supabaseClient
        .from('user_content_history')
        .select('content_id')
        .eq('user_id', user.id)
        .gte('delivered_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const recentContentIds = history?.map((h) => h.content_id) || [];

      // Fetch available content
      let query = supabaseClient
        .from('content_library')
        .select('*')
        .eq('pathway_type', body.pathwayType);

      if (body.contentType) {
        query = query.eq('content_type', body.contentType);
      }

      const { data: availableContent, error: contentError } = await query;

      if (contentError || !availableContent || availableContent.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No content available for the specified criteria' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Score and select best content
      const scoredContent = (availableContent as ContentLibraryItem[])
        .filter((content) => !recentContentIds.includes(content.id))
        .map((content) => ({
          content,
          score: scoreContent(content, body.userState),
        }))
        .sort((a, b) => b.score - a.score);

      if (scoredContent.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No new content available (all recently delivered)' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const selectedContent = scoredContent[0].content;

      // Record content delivery
      await supabaseService.from('user_content_history').insert({
        user_id: user.id,
        content_id: selectedContent.id,
        user_state_at_delivery: body.userState,
        completed: false,
      });

      return new Response(
        JSON.stringify({
          success: true,
          content: selectedContent,
          matchScore: scoredContent[0].score,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (req.method === 'GET') {
      // Get content by ID
      const url = new URL(req.url);
      const contentId = url.searchParams.get('contentId');

      if (!contentId) {
        return new Response(
          JSON.stringify({ error: 'Missing contentId parameter' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: content, error } = await supabaseClient
        .from('content_library')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error || !content) {
        return new Response(
          JSON.stringify({ error: 'Content not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, content }),
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

function scoreContent(
  content: ContentLibraryItem,
  userState: SelectContentRequest['userState']
): number {
  let score = 50; // Base score

  const requirements = content.state_requirements;

  // Match emotional state
  if (requirements.emotionalState && userState.emotionalState) {
    if (Array.isArray(requirements.emotionalState)) {
      if (requirements.emotionalState.includes(userState.emotionalState)) {
        score += 30;
      }
    } else if (requirements.emotionalState === userState.emotionalState) {
      score += 30;
    }
  }

  // Match energy level
  if (requirements.energyLevel && userState.energyLevel) {
    if (Array.isArray(requirements.energyLevel)) {
      if (requirements.energyLevel.includes(userState.energyLevel)) {
        score += 20;
      }
    } else if (requirements.energyLevel === userState.energyLevel) {
      score += 20;
    }
  }

  // Match contextual factors
  if (requirements.context && userState.context) {
    const matchedContextKeys = Object.keys(requirements.context).filter(
      (key) => userState.context![key] === requirements.context[key]
    );
    score += matchedContextKeys.length * 5;
  }

  // Prefer shorter content for low energy
  if (userState.energyLevel === 'low' && content.metadata.duration) {
    const duration = parseInt(content.metadata.duration);
    if (duration < 5) score += 10;
  }

  // Prefer longer content for high energy
  if (userState.energyLevel === 'high' && content.metadata.duration) {
    const duration = parseInt(content.metadata.duration);
    if (duration > 10) score += 10;
  }

  return score;
}