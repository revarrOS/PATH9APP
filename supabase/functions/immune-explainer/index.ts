import { createSupabaseClient } from '../_shared/supabase-client.ts';
import { callLLM } from '../orchestrate/llm-adapter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ImmuneExplainerRequest {
  topic?: 'general' | 'protein' | 'vitamins' | 'zinc' | 'gut_health' | 'inflammation';
  user_question?: string;
}

interface ImmuneExplainerResponse {
  plain_english_explanation: string;
  why_it_matters: string;
  key_nutrients: Array<{
    name: string;
    role: string;
    simple_sources: string[];
  }>;
  visual_analogy: string;
  practical_actions: string[];
  confidence_score: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = await createSupabaseClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ImmuneExplainerRequest = await req.json();
    const topic = body.topic || 'general';

    const result = await generateImmuneExplanation(topic, body.user_question);

    await supabase.from('nutrition_insights').insert({
      user_id: user.id,
      insight_type: 'immune_education',
      insight_text: result.plain_english_explanation,
      key_takeaways: result.key_nutrients.map(n => `${n.name}: ${n.role}`),
      action_items: result.practical_actions,
    });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in immune-explainer:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateImmuneExplanation(
  topic: string,
  userQuestion?: string
): Promise<ImmuneExplainerResponse> {
  const systemPrompt = `You are Gemma, a quiet, steady recovery companion.

YOUR TONE:
- Calm, gentle, respectful, plain-spoken, non-judgmental
- Never panic or overexplain
- Never use clinical jargon unnecessarily

YOUR ROLE:
Explain immune system concepts in plain language that reduces fear through clarity, not false reassurance.

EXPLANATION PRINCIPLES:
1. Use grounded everyday analogies (immune system = security team, gut = headquarters)
2. Avoid medical jargon or explain it immediately
3. Focus on PRACTICAL actions, not just theory
4. Make it visual and memorable
5. Stay calm and factual

MEDICAL BOUNDARIES (NON-NEGOTIABLE):
- Never diagnose
- Never recommend specific treatments or supplements
- Never contradict healthcare providers
- Never predict outcomes
- Explain concepts only - don't prescribe

Target audience: People navigating chronic illness who are overwhelmed and need simple clarity.`;

  const topicPrompts: Record<string, string> = {
    general: 'Explain how nutrition supports the immune system during medical treatment',
    protein: 'Explain why protein is critical for immune function and healing',
    vitamins: 'Explain the role of vitamins C and D in immune health',
    zinc: 'Explain how zinc supports immune function and wound healing',
    gut_health: 'Explain the gut-immune connection and why it matters',
    inflammation: 'Explain inflammation and how nutrition can help manage it',
  };

  const userPrompt = `${topicPrompts[topic] || topicPrompts.general}
${userQuestion ? `\nUser's specific question: "${userQuestion}"` : ''}

Provide a clear, simple explanation. Format as JSON:
{
  "plain_english_explanation": "2-3 sentences explaining the concept in simple terms",
  "why_it_matters": "Why this is important during medical treatment",
  "key_nutrients": [
    {
      "name": "Protein",
      "role": "Builds immune cells and repairs tissue",
      "simple_sources": ["Eggs", "Greek yogurt", "Chicken", "Beans"]
    }
  ],
  "visual_analogy": "Simple metaphor to make it memorable",
  "practical_actions": ["Action 1", "Action 2", "Action 3"],
  "confidence_score": 9
}`;

  const response = await callLLM({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.6,
    response_format: 'json',
  });

  try {
    return JSON.parse(response);
  } catch {
    return {
      plain_english_explanation:
        'Your immune system is like a security team for your body. It needs fuel to work properly, especially during treatment when it\'s working overtime.',
      why_it_matters:
        'Treatment can weaken your immune defenses. Good nutrition helps your body heal and fight infection.',
      key_nutrients: [
        {
          name: 'Protein',
          role: 'Builds immune cells and repairs damaged tissue',
          simple_sources: ['Eggs', 'Greek yogurt', 'Chicken', 'Protein shakes'],
        },
        {
          name: 'Vitamin C',
          role: 'Supports immune cell function',
          simple_sources: ['Oranges', 'Strawberries', 'Bell peppers', 'Broccoli'],
        },
        {
          name: 'Zinc',
          role: 'Helps wounds heal and immune cells communicate',
          simple_sources: ['Meat', 'Beans', 'Nuts', 'Whole grains'],
        },
      ],
      visual_analogy:
        'Think of your immune system as a security team. Protein is like the building materials they need. Vitamins are their communication tools. Without these, the team can\'t do their job.',
      practical_actions: [
        'Include protein at every meal, even if it\'s just a spoonful',
        'Add colorful fruits or vegetables when you can',
        'Consider a daily multivitamin if eating is hard',
      ],
      confidence_score: 9,
    };
  }
}
