# New Supabase Project Setup Checklist

Your new Supabase project has been created! Here's everything you need to do to get Gemma running.

## Project Details

- **URL**: https://hdeeowrlzdzegleswxtn.supabase.co
- **Anon Key**: sb_publishable_-Jj-iQL7Pnkf6QjPZqoYCw_IMY5wz34
- **Project ID**: hdeeowrlzdzegleswxtn

Your local `.env` files have been updated with these credentials.

## Setup Steps

### Step 1: Run Database Migrations (REQUIRED)

You have 14 migrations that need to be run in order. These create all the tables, RLS policies, and functions.

**Using Supabase Dashboard** (Easiest):

1. Go to: https://supabase.com/dashboard/project/hdeeowrlzdzegleswxtn/editor
2. Click **SQL Editor** in sidebar
3. Copy and paste each migration file below IN ORDER
4. Click **Run** after each one

**Migration Order** (MUST run in this exact order):

1. `supabase/migrations/20251217101105_initial_schema_setup.sql` - Core tables (profiles, audit)
2. `supabase/migrations/20251217101808_add_user_isolation_tables.sql` - User data isolation
3. `supabase/migrations/20251217104354_finalize_infrastructure_skeleton.sql` - Infrastructure complete
4. `supabase/migrations/20251217105141_rename_profiles_id_to_user_id.sql` - Profile fixes
5. `supabase/migrations/20251217132428_create_canon_tables.sql` - Knowledge canon system
6. `supabase/migrations/20251217154740_fix_profile_creation_with_email.sql` - Profile creation fixes
7. `supabase/migrations/20251217185208_fix_handle_new_user_function.sql` - Auth trigger fixes
8. `supabase/migrations/20251218084839_make_signup_boring_final.sql` - Auth flow complete
9. `supabase/migrations/20251222090033_create_medical_journey_tables.sql` - Medical journey
10. `supabase/migrations/20251222091643_create_shared_infrastructure_tables.sql` - Shared tables
11. `supabase/migrations/20251222092227_create_nutrition_pathway_tables.sql` - Nutrition pathway
12. `supabase/migrations/20251222092254_create_meditation_pathway_tables.sql` - Meditation pathway
13. `supabase/migrations/20251222092329_create_movement_mindfulness_tables.sql` - Movement/Mindfulness
14. `supabase/migrations/20251222125823_create_blood_cancer_knowledge_system.sql` - Blood cancer knowledge

**OR Using Supabase CLI**:

```bash
# Link to your project
supabase link --project-ref hdeeowrlzdzegleswxtn

# Run all migrations
supabase db push
```

### Step 2: Set Up Edge Function Secrets (REQUIRED)

Go to: https://supabase.com/dashboard/project/hdeeowrlzdzegleswxtn/settings/functions

Click **Secrets** tab and add these:

```
ANTHROPIC_API_KEY = your-anthropic-api-key-here

OPENAI_API_KEY = your-openai-api-key-here

LLM_PROVIDER = anthropic

ANTHROPIC_MODEL = claude-3-5-sonnet-20241022

OPENAI_MODEL = gpt-4o-mini

LLM_TEMPERATURE = 0.3

LLM_MAX_TOKENS = 2000

LLM_TIMEOUT_MS = 30000

LLM_MAX_RETRIES = 2
```

**Why this matters**: Without these secrets, Gemma will use the mock LLM (the robotic "personal development journey" response you saw).

### Step 3: Deploy Edge Functions (REQUIRED)

You have 33 edge functions to deploy. The most critical one is `orchestrate` (Gemma's brain).

**Priority 1 - Deploy Immediately**:
- `orchestrate` - Gemma's conversation engine (REQUIRED for chat)
- `health` - Health check endpoint

**Priority 2 - Medical Journey** (Deploy if using medical features):
- `translate-medical`
- `understand-appointment`
- `infer-timeline`
- `immune-explainer`
- `generate-education`
- `safety-guardrails`

**Priority 3 - Nutrition Pathway**:
- `nutrition-profile`
- `nutrition-questions`
- `nutrition-insight`
- `nutrition-reality`
- `smoothie-generator`
- `supplement-checker`
- `consumption-selector`

**Priority 4 - Meditation Pathway**:
- `meditation-session`
- `meditation-selector`
- `meditation-adapt`
- `stillness-starter`
- `breath-guide`
- `meaning-explorer`

**Priority 5 - Movement/Mindfulness**:
- `movement-activity`
- `movement-reality-explainer`
- `walking-medicine-guide`
- `permission-to-rest`
- `energy-check-in`

**Priority 6 - Emotional/Journaling**:
- `emotion-check-in`
- `normalize-emotion`
- `journal-entry`
- `journal-summary`

**Priority 7 - Misc**:
- `select-content`
- `reset-password`
- `api-gateway`
- `gemma-respond`

**Deployment Options**:

**Option A: Using this tool** (I can deploy them for you):
Just tell me which functions to deploy and I'll use the MCP tool to deploy them directly to your project.

**Option B: Using Supabase CLI**:
```bash
# Deploy one function
supabase functions deploy orchestrate

# Deploy all functions (takes ~5-10 min)
supabase functions deploy orchestrate
supabase functions deploy health
supabase functions deploy translate-medical
# ... (repeat for each)
```

### Step 4: Enable Email Auth (REQUIRED)

1. Go to: https://supabase.com/dashboard/project/hdeeowrlzdzegleswxtn/auth/providers
2. Make sure **Email** provider is enabled
3. Turn OFF email confirmation (we want simple signup)
4. Set **Site URL** to your app's URL (or `http://localhost:8081` for dev)
5. Add redirect URLs if needed

### Step 5: Upload Knowledge Canon (Optional but Recommended)

The app has knowledge canon files in `config/canon/` that Gemma can reference:

- `goal-setting-basics.md`
- `habit-formation-principles.md`
- `overcoming-resistance.md`
- `reflection-practices.md`

These need to be inserted into the `llm_knowledge_canon` table:

**Using SQL Editor**:
1. Go to SQL Editor
2. Run this for each canon file:

```sql
INSERT INTO llm_knowledge_canon (slug, title, content, category, is_active)
VALUES (
  'goal-setting-basics',
  'Goal Setting Basics',
  '[paste content from goal-setting-basics.md here]',
  'behavioral',
  true
);
```

**OR**: I can create a seed script for you that does this automatically.

### Step 6: Test the App

1. **Start the dev server**: (it should auto-start)
2. **Open the app** in your browser/simulator
3. **Sign up** with email/password (test user)
4. **Go to Today tab**
5. **Type "hey"** and send
6. **Expected response**:
   - WITH secrets: "Hey. I'm here. How are you feeling today?"
   - WITHOUT secrets: "Hey. I'm here." (mock fallback)

### Step 7: Verify Everything Works

**Check Auth**:
- Sign up creates user in `auth.users`
- Profile created in `profiles` table
- Can sign in/out

**Check Database**:
- Tables exist (check SQL Editor → Tables)
- RLS policies active (try querying as anon - should fail)

**Check Edge Functions**:
- Go to Functions tab in dashboard
- See `orchestrate` function listed
- Check recent invocations/logs

**Check Gemma**:
- Response is contextual, not generic
- No "personal development journey" language
- Uses calm, grounded tone
- Shows "Not medical advice" footer

## Quick Start Commands

```bash
# Link project (if using CLI)
supabase link --project-ref hdeeowrlzdzegleswxtn

# Run migrations
supabase db push

# Deploy critical function
supabase functions deploy orchestrate

# Check function logs
supabase functions logs orchestrate

# Check function secrets
supabase secrets list
```

## Troubleshooting

### "Can't connect to Supabase"
- Check `.env` files have correct URL/key
- Restart dev server
- Clear browser cache

### "User already exists" error
- Email already registered
- Try different email
- Or go to Auth → Users and delete test user

### "Mock LLM response" (robotic personality)
- Edge function secrets not set
- Go to Step 2 and set secrets
- Redeploy `orchestrate` function

### "No tables found"
- Migrations not run
- Go to Step 1 and run migrations
- Check SQL Editor → Tables

### "RLS policy error"
- Expected for direct queries
- Should work fine through app (user authenticated)
- Check policies: SQL Editor → Policies

## What's Next

Once setup is complete:

1. **Test all pathways** - Medical, Nutrition, Meditation, Movement
2. **Seed test data** - Add sample diagnosis, appointments, timeline
3. **Refine Gemma** - Edit system prompts based on responses
4. **Add canon docs** - Build out behavioral knowledge library
5. **Monitor costs** - Check Anthropic/OpenAI usage after testing

## Files Updated

I've already updated these files with your new Supabase credentials:
- `.env`
- `.env.development`
- `.env.staging`
- `.env.production`

You're ready to go!

## Need Help?

Ask me to:
- Deploy specific edge functions
- Create seed data scripts
- Run test scenarios
- Check logs/errors
- Refine Gemma's prompts

Let's get this running!
