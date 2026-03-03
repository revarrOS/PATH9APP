# Setting Up Supabase Secrets for API Keys

## The Problem

You're seeing this response from Gemma:
> "I hear you saying: 'hey'. As Gemma, I'm here to support your personal development journey..."

This is the **mock LLM fallback**, not the real ChatGPT or Claude. The edge functions can't find your API keys.

## Why This Happens

Supabase Edge Functions run in Deno Deploy, not on your local machine. They don't automatically read from your `.env` file.

The API keys need to be set as **Supabase Secrets** in your project.

## How to Fix It

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `tlmmqwrhjycmehhcvknm`
3. Click **Settings** (left sidebar)
4. Click **Edge Functions** → **Secrets**
5. Add these secrets:

```
OPENAI_API_KEY=your-openai-api-key-here

ANTHROPIC_API_KEY=your-anthropic-api-key-here

LLM_PROVIDER=anthropic
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
OPENAI_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=2000
```

6. Click **Save** after adding each secret
7. Redeploy your edge functions (they'll pick up the new secrets)

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Set OpenAI key
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here

# Set Anthropic key
supabase secrets set ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Set provider
supabase secrets set LLM_PROVIDER=anthropic

# Set model
supabase secrets set ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
supabase secrets set OPENAI_MODEL=gpt-4o-mini

# Set temperature
supabase secrets set LLM_TEMPERATURE=0.3
supabase secrets set LLM_MAX_TOKENS=2000
```

### Option 3: Environment Variables File (Local Development)

For local development with `supabase functions serve`:

1. Create `.env.local` in your project root:

```bash
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
LLM_PROVIDER=anthropic
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
OPENAI_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=2000
```

2. Start local functions:
```bash
supabase functions serve --env-file .env.local
```

## Verifying It Works

After setting secrets, test Gemma again:

**Before (Mock LLM)**:
> "I hear you saying: 'hey'. As Gemma, I'm here to support your personal development journey..."

**After (Real LLM)**:
> "Hey. I'm here. How are you feeling today?"

The real Gemma should be:
- Calm and warm
- Short and grounded
- Not robotic or formal
- Focused on chronic illness/health journey

## Checking Which LLM Is Being Used

Look at the response metadata at the bottom of the chat:

- **Mock**: `Not medical advice` (provider: mock, model: mock-gemma-v1)
- **OpenAI**: Provider will show `openai`, model: `gpt-4o-mini`
- **Anthropic**: Provider will show `anthropic`, model: `claude-3-5-sonnet-20241022`

You can also check the Supabase function logs:
1. Go to Supabase Dashboard → Functions
2. Click on `orchestrate`
3. Look at the logs - you'll see either:
   - `OPENAI_API_KEY not found, using mock LLM` (BAD)
   - `Calling OpenAI with model: gpt-4o-mini` (GOOD)
   - `Calling Anthropic with model: claude-3-5-sonnet-20241022` (GOOD)

## Which Provider Should You Use?

**For Testing (Recommended Start)**:
- Provider: `openai`
- Model: `gpt-4o-mini`
- Cost: ~$0.0002 per message
- Speed: Fast (~1-2s)

**For Production (Best Quality)**:
- Provider: `anthropic`
- Model: `claude-3-5-sonnet-20241022`
- Cost: ~$0.0045 per message
- Speed: Medium (~2-3s)
- Quality: Gemma's compassionate personality shines best here

## Troubleshooting

### "Still seeing mock responses"

1. Verify secrets are set in Supabase Dashboard
2. Redeploy the `orchestrate` function
3. Clear browser cache and try again
4. Check function logs for errors

### "API key invalid"

1. Verify the API keys haven't expired
2. Check OpenAI dashboard: https://platform.openai.com/api-keys
3. Check Anthropic dashboard: https://console.anthropic.com/settings/keys
4. Regenerate keys if needed and update secrets

### "Rate limit exceeded"

1. You've hit the API provider's rate limit
2. Wait a few minutes and try again
3. For OpenAI: Check your usage tier and limits
4. For Anthropic: Check your plan limits

### "Function timeout"

1. LLM took too long to respond (>30s)
2. Try again - it's usually temporary
3. Check LLM_TIMEOUT_MS is set to 30000
4. Consider switching to faster model (gpt-4o-mini)

## Cost Monitoring

### OpenAI
- Dashboard: https://platform.openai.com/usage
- Set monthly budget alerts
- Track token usage per request

### Anthropic
- Console: https://console.anthropic.com/settings/billing
- Monitor monthly spend
- Set usage alerts

## Next Steps

1. **Set the secrets** using Option 1 (Dashboard) above
2. **Test Gemma** - Say "hey" again and see the difference
3. **Monitor usage** - Check costs after a few test conversations
4. **Refine prompts** - Adjust Gemma's personality in `config/prompts/` based on real responses

Once secrets are set, Gemma will be using real AI with full personality and boundaries!
