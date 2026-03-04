import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateEducationRequest {
  pathwayType: 'medical' | 'nutrition' | 'meditation' | 'mindfulness' | 'movement';
  topicKey: string;
  sourceText: string;
  context?: Record<string, any>;
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

    // Service client for cache operations
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
      // Generate educational content
      const body: GenerateEducationRequest = await req.json();

      if (!body.pathwayType || !body.topicKey || !body.sourceText) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: pathwayType, topicKey, sourceText' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check cache first
      const { data: cachedContent } = await supabaseClient
        .from('education_cache')
        .select('*')
        .eq('topic_key', body.topicKey)
        .eq('pathway_type', body.pathwayType)
        .maybeSingle();

      if (cachedContent) {
        // Record delivery to user
        await supabaseService.from('user_education_progress').insert({
          user_id: user.id,
          pathway_type: body.pathwayType,
          topic_key: body.topicKey,
          understood: false,
          follow_up_needed: false,
        });

        return new Response(
          JSON.stringify({
            success: true,
            education: cachedContent,
            cached: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Generate new educational content
      const education = await generateEducationalContent(
        body.sourceText,
        body.pathwayType,
        body.context
      );

      // Cache the generated content
      const { data: newEducation, error: cacheError } = await supabaseService
        .from('education_cache')
        .insert({
          topic_key: body.topicKey,
          pathway_type: body.pathwayType,
          source_text: body.sourceText,
          simplified_text: education.simplified,
          key_concepts: education.concepts,
          follow_up_questions: education.questions,
        })
        .select()
        .single();

      if (cacheError) {
        console.error('Error caching education content:', cacheError);
      }

      // Record delivery to user
      await supabaseService.from('user_education_progress').insert({
        user_id: user.id,
        pathway_type: body.pathwayType,
        topic_key: body.topicKey,
        understood: false,
        follow_up_needed: false,
      });

      return new Response(
        JSON.stringify({
          success: true,
          education: newEducation || {
            topic_key: body.topicKey,
            simplified_text: education.simplified,
            key_concepts: education.concepts,
            follow_up_questions: education.questions,
          },
          cached: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (req.method === 'GET') {
      // Get user's education progress
      const url = new URL(req.url);
      const pathwayType = url.searchParams.get('pathwayType');
      const topicKey = url.searchParams.get('topicKey');

      if (topicKey) {
        // Get specific topic
        const { data: education } = await supabaseClient
          .from('education_cache')
          .select('*')
          .eq('topic_key', topicKey)
          .maybeSingle();

        if (!education) {
          return new Response(
            JSON.stringify({ error: 'Topic not found' }),
            {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, education }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get user's progress
      let query = supabaseClient
        .from('user_education_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('delivered_at', { ascending: false });

      if (pathwayType) {
        query = query.eq('pathway_type', pathwayType);
      }

      const { data: progress, error } = await query;

      if (error) {
        console.error('Error fetching education progress:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch education progress' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, progress }),
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

async function generateEducationalContent(
  sourceText: string,
  pathwayType: string,
  context?: Record<string, any>
): Promise<{ simplified: string; concepts: string[]; questions: string[] }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openaiKey) {
    // Fallback to basic simplification
    return {
      simplified: sourceText,
      concepts: [],
      questions: ['Would you like to learn more about this topic?'],
    };
  }

  try {
    const prompt = `You are an educational assistant helping someone on their ${pathwayType} journey. Take this complex information and make it accessible:

"${sourceText}"

Provide:
1. A simplified explanation in 2-3 sentences using everyday language
2. 3-5 key concepts to remember
3. 2-3 thoughtful follow-up questions they might want to ask

Context: ${JSON.stringify(context || {})}

Respond in JSON format:
{
  "simplified": "Your simplified explanation",
  "concepts": ["concept1", "concept2", "concept3"],
  "questions": ["question1", "question2", "question3"]
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
            content: 'You are Gemma, a quiet, steady recovery companion. Your tone is calm, gentle, respectful, and plain-spoken. You explain complex topics in simple language that reduces fear through clarity, not false reassurance.',
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
      return {
        simplified: sourceText,
        concepts: [],
        questions: ['Would you like to learn more about this topic?'],
      };
    }

    const result = await response.json();
    const parsed = JSON.parse(result.choices[0].message.content);

    return {
      simplified: parsed.simplified,
      concepts: parsed.concepts,
      questions: parsed.questions,
    };
  } catch (error) {
    console.error('Error generating educational content:', error);
    return {
      simplified: sourceText,
      concepts: [],
      questions: ['Would you like to learn more about this topic?'],
    };
  }
}