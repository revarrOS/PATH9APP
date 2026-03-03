# Set These Secrets Right Now (5 Minutes)

Your app is ready to go! Database is set up, edge functions are deployed. You just need to add your API keys.

## What You Need To Do

Go to this URL:
**https://supabase.com/dashboard/project/hdeeowrlzdzegleswxtn/settings/functions**

Click the **"Secrets"** tab at the top.

## Add These Secrets One By One

Click **"Add new secret"** and enter:

### Secret 1: ANTHROPIC_API_KEY
```
Name: ANTHROPIC_API_KEY
Value: your-anthropic-api-key-here
```

### Secret 2: LLM_PROVIDER
```
Name: LLM_PROVIDER
Value: anthropic
```

### Secret 3: ANTHROPIC_MODEL
```
Name: ANTHROPIC_MODEL
Value: claude-3-5-sonnet-20241022
```

### Secret 4: LLM_TEMPERATURE
```
Name: LLM_TEMPERATURE
Value: 0.3
```

### Secret 5: LLM_MAX_TOKENS
```
Name: LLM_MAX_TOKENS
Value: 2000
```

### Optional (for future use):

#### OPENAI_API_KEY
```
Name: OPENAI_API_KEY
Value: your-openai-api-key-here
```

#### OPENAI_MODEL
```
Name: OPENAI_MODEL
Value: gpt-4o-mini
```

## How To Add Each Secret

1. Click **"Add new secret"** button
2. Type the **Name** exactly as shown (case-sensitive!)
3. Paste the **Value** exactly as shown
4. Click **"Save"**
5. Repeat for each secret

## What Happens Next

Once you save all 5 secrets:
- The `orchestrate` function will automatically use them (no redeploy needed)
- Gemma will use real Claude AI instead of the mock fallback
- You'll see intelligent, contextual responses

## Test It

1. Open your app
2. Sign up with a test email
3. Go to **Today** tab
4. Type: "hey"
5. Send

**Before secrets (what you see now)**:
> "I hear you saying: 'hey'. As Gemma, I'm here to support your personal development journey..."

**After secrets (what you'll see)**:
> "Hey. I'm here. How are you feeling today?"

Warm, calm, actually Gemma.

## Screenshots To Help

### Step 1: Go to Secrets Tab
Look for the **Functions** section in left sidebar → **Settings** → **Secrets** tab

### Step 2: Add Secret
Click **"Add new secret"** button (top right)

### Step 3: Enter Name and Value
- Name field: Type exactly as shown (e.g., `ANTHROPIC_API_KEY`)
- Value field: Paste the long string (e.g., `sk-ant-api03-...`)

### Step 4: Save
Click **"Save"** button

### Step 5: Repeat
Do this 5 times for the 5 required secrets

## Troubleshooting

### "I can't find the Secrets tab"
1. Make sure you're logged into Supabase Dashboard
2. Select your project: `hdeeowrlzdzegleswxtn`
3. Go to **Settings** in left sidebar
4. Click **Edge Functions**
5. Look for **Secrets** tab at the top

### "The secret didn't save"
- Check for typos in the secret name
- Secret names are case-sensitive
- Make sure there are no extra spaces
- Try again

### "I'm still seeing the mock response"
1. Verify all 5 secrets are saved (you should see them listed)
2. Wait 30 seconds for functions to reload
3. Clear your browser cache
4. Try sending "hey" again

### "Which provider should I use?"
**Use Anthropic** (already configured above). It's the best for Gemma's compassionate personality.

## Cost Info

**Anthropic (Claude)**:
- ~$0.0045 per message
- 100 messages = ~$0.45
- Perfect for Gemma's personality

**OpenAI (GPT-4o-mini)** (if you switch):
- ~$0.0002 per message
- 100 messages = ~$0.02
- Good for testing, less personality

## Next Steps After Secrets Are Set

1. **Test Gemma** - Have a real conversation
2. **Try different scenarios**:
   - Medical questions
   - Emotional check-ins
   - Nutrition questions
   - Movement tracking
3. **Monitor costs** - Check your Anthropic dashboard after ~20 messages
4. **Refine prompts** - Edit `config/prompts/` if Gemma's tone needs adjustment

## You're Almost There!

Database: ✅ Done
Edge Functions: ✅ Done
API Keys: ⏳ 5 minutes to set secrets

Once you add these secrets, Gemma comes to life!
