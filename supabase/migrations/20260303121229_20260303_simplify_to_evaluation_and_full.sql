/*
  # Simplify Subscription Model: Free Evaluation + Path9 Full

  ## Overview
  Moving from 3-tier model (Free/Plus/Complete) to 2-tier model:
  - Free Evaluation: 15 AI interactions (lifetime, not monthly)
  - Path9 Full: Unlimited AI + all features

  ## Changes

  1. New Tier Structure
    - `free_evaluation`: 15 total AI interactions for evaluation
    - `path9_full`: Unlimited AI + all premium features
    - Remove: `plus` and `complete` tiers

  2. Usage Tracking Logic
    - Change from monthly reset to lifetime tracking for evaluation
    - New feature key: `ai_interactions_evaluation` (lifetime quota)
    - Path9 Full uses: `ai_interactions_unlimited` (boolean, no tracking)

  3. Migration of Existing Users
    - Users on `plus` or `complete` → migrated to `path9_full`
    - Users on `free` → migrated to `free_evaluation`

  ## Security
  - RLS policies remain unchanged
  - Functions updated to handle lifetime vs monthly tracking
*/

-- Step 1: Add new tiers (free_evaluation and path9_full)
INSERT INTO subscription_tiers (tier_id, display_name, description, monthly_price, annual_price, limits, features)
VALUES
  (
    'free_evaluation',
    'Free Evaluation',
    'Try Path9 with 15 AI interactions',
    0.00,
    0.00,
    '{
      "ai_interactions_evaluation": 15,
      "appointments_max": 10,
      "care_team_max": 5,
      "bloodwork_entries": 999999,
      "condition_letters": 999999
    }'::jsonb,
    '[
      "15 AI interactions to explore Path9",
      "Unlimited bloodwork & condition entries",
      "Basic appointment & care team tracking",
      "Full data export"
    ]'::jsonb
  ),
  (
    'path9_full',
    'Path9 Full',
    'Your complete healing journey companion',
    19.99,
    179.00,
    '{
      "ai_interactions_unlimited": true,
      "appointments_max": 999999,
      "care_team_max": 999999,
      "bloodwork_entries": 999999,
      "bloodwork_image_upload": true,
      "bloodwork_ai_analysis": true,
      "bloodwork_trends": true,
      "condition_letters": 999999,
      "condition_image_upload": true,
      "condition_ai_analysis": true,
      "condition_timeline": true,
      "consultation_prep_enabled": true,
      "consultation_prep_domains": ["bloodwork", "condition", "nutrition"],
      "nutrition_enabled": true,
      "nutrition_ai_analysis": true,
      "nutrition_pattern_detection": true,
      "nutrition_trends": true,
      "nutrition_lens_insights": true,
      "movement_enabled": true,
      "meditation_enabled": true,
      "mindfulness_enabled": true
    }'::jsonb,
    '[
      "Unlimited AI conversations across all domains",
      "Bloodwork: Image upload + AI analysis + trends",
      "Condition: Letter upload + AI analysis + timeline",
      "Nutrition: AI analysis + patterns + trends + lens insights",
      "AI Consultation Prep for all medical appointments",
      "Full Movement, Meditation & Mindfulness features",
      "Priority support"
    ]'::jsonb
  )
ON CONFLICT (tier_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  limits = EXCLUDED.limits,
  features = EXCLUDED.features,
  updated_at = now();

-- Step 2: Migrate existing users
-- Users on 'free' → 'free_evaluation'
UPDATE user_subscriptions
SET tier_id = 'free_evaluation'
WHERE tier_id = 'free';

-- Users on 'plus' or 'complete' → 'path9_full'
UPDATE user_subscriptions
SET tier_id = 'path9_full'
WHERE tier_id IN ('plus', 'complete');

-- Step 3: Update check_usage_limit function to handle lifetime evaluation tracking
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id uuid,
  p_feature_key text
)
RETURNS boolean AS $$
DECLARE
  v_limit integer;
  v_limit_bool boolean;
  v_current_usage integer;
  v_tier_limits jsonb;
BEGIN
  -- Get tier limits
  SELECT st.limits INTO v_tier_limits
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.tier_id
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
  ORDER BY
    CASE st.tier_id
      WHEN 'path9_full' THEN 3
      WHEN 'complete' THEN 2
      WHEN 'plus' THEN 2
      WHEN 'free_evaluation' THEN 1
      WHEN 'free' THEN 1
    END DESC
  LIMIT 1;

  IF v_tier_limits IS NULL THEN
    RETURN false;
  END IF;

  -- Special case: Check for unlimited boolean flag
  IF v_tier_limits ? 'ai_interactions_unlimited' THEN
    v_limit_bool := (v_tier_limits ->> 'ai_interactions_unlimited')::boolean;
    IF v_limit_bool = true THEN
      RETURN true; -- Unlimited access
    END IF;
  END IF;

  -- Special case: Evaluation tier uses lifetime tracking (no period filter)
  IF p_feature_key = 'ai_interactions_evaluation' THEN
    -- Get lifetime usage (no period_start filter)
    SELECT COALESCE(SUM(usage_count), 0) INTO v_current_usage
    FROM usage_tracking
    WHERE user_id = p_user_id
      AND feature_key = p_feature_key;

    -- Get limit from tier
    v_limit := (v_tier_limits ->> p_feature_key)::integer;

    IF v_limit IS NULL THEN
      RETURN false;
    END IF;

    RETURN v_current_usage < v_limit;
  END IF;

  -- Default: Monthly tracking for other features
  SELECT COALESCE(usage_count, 0) INTO v_current_usage
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND feature_key = p_feature_key
    AND period_start = date_trunc('month', now());

  -- Try to get limit with '_per_month' suffix
  v_limit := (v_tier_limits ->> (p_feature_key || '_per_month'))::integer;

  IF v_limit IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_current_usage < v_limit;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Update increment_usage to handle lifetime evaluation tracking
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid,
  p_feature_key text
)
RETURNS boolean AS $$
DECLARE
  v_current_period_start timestamptz;
  v_current_period_end timestamptz;
  v_lifetime_period_start timestamptz;
  v_lifetime_period_end timestamptz;
BEGIN
  -- Special case: Evaluation tier uses lifetime tracking
  IF p_feature_key = 'ai_interactions_evaluation' THEN
    -- Use a fixed "lifetime" period (start of Unix epoch to far future)
    v_lifetime_period_start := '1970-01-01 00:00:00+00'::timestamptz;
    v_lifetime_period_end := '2099-12-31 23:59:59+00'::timestamptz;

    INSERT INTO usage_tracking (user_id, feature_key, usage_count, period_start, period_end)
    VALUES (p_user_id, p_feature_key, 1, v_lifetime_period_start, v_lifetime_period_end)
    ON CONFLICT (user_id, feature_key, period_start)
    DO UPDATE SET
      usage_count = usage_tracking.usage_count + 1,
      updated_at = now();

    RETURN true;
  END IF;

  -- Default: Monthly tracking
  v_current_period_start := date_trunc('month', now());
  v_current_period_end := v_current_period_start + interval '1 month';

  INSERT INTO usage_tracking (user_id, feature_key, usage_count, period_start, period_end)
  VALUES (p_user_id, p_feature_key, 1, v_current_period_start, v_current_period_end)
  ON CONFLICT (user_id, feature_key, period_start)
  DO UPDATE SET
    usage_count = usage_tracking.usage_count + 1,
    updated_at = now();

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Keep old tiers for now (backwards compatibility) but mark as deprecated
UPDATE subscription_tiers
SET description = '[DEPRECATED] Use free_evaluation instead'
WHERE tier_id = 'free';

UPDATE subscription_tiers
SET description = '[DEPRECATED] Use path9_full instead'
WHERE tier_id IN ('plus', 'complete');