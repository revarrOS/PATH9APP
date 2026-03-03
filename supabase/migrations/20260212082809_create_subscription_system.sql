/*
  # Subscription & Usage Tracking System

  ## Overview
  Implements a 3-tier subscription model (Free, Plus, Complete) with usage tracking
  and entitlement checking for feature gating.

  ## New Tables
  
  ### `subscription_tiers`
  Master table defining available subscription tiers and their limits
  - `tier_id` (text, primary key): 'free', 'plus', 'complete'
  - `display_name` (text): User-facing tier name
  - `monthly_price` (decimal): Monthly price in USD
  - `annual_price` (decimal): Annual price in USD
  - `limits` (jsonb): Feature limits and entitlements
  
  ### `user_subscriptions`
  Tracks active subscriptions per user
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key): References auth.users
  - `tier_id` (text, foreign key): References subscription_tiers
  - `status` (text): active, cancelled, expired, trialing
  - `billing_cycle` (text): monthly, annual, free
  - `trial_ends_at` (timestamptz): When trial ends (null if not trialing)
  - `current_period_start` (timestamptz): Start of current billing period
  - `current_period_end` (timestamptz): End of current billing period
  - `cancelled_at` (timestamptz): When subscription was cancelled
  - `external_subscription_id` (text): RevenueCat/Stripe subscription ID
  
  ### `usage_tracking`
  Tracks feature usage for quota enforcement
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key): References auth.users
  - `feature_key` (text): e.g., 'gemma_conversations', 'image_analyses'
  - `usage_count` (integer): Current usage count
  - `period_start` (timestamptz): Start of tracking period (monthly reset)
  - `period_end` (timestamptz): End of tracking period
  
  ## Security
  - RLS enabled on all tables
  - Users can only view their own subscription and usage data
  - Subscription tier definitions are publicly readable
  
  ## Notes
  - Free tier is assigned automatically on user creation
  - Trial period is 30 days for Plus and Complete tiers
  - Usage resets monthly based on period_start
*/

-- Create subscription_tiers master table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  tier_id text PRIMARY KEY,
  display_name text NOT NULL,
  description text NOT NULL,
  monthly_price decimal(10,2) NOT NULL DEFAULT 0,
  annual_price decimal(10,2) NOT NULL DEFAULT 0,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id text NOT NULL REFERENCES subscription_tiers(tier_id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trialing', 'past_due')),
  billing_cycle text NOT NULL DEFAULT 'free' CHECK (billing_cycle IN ('free', 'monthly', 'annual')),
  trial_ends_at timestamptz,
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  cancelled_at timestamptz,
  external_subscription_id text,
  external_customer_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tier_id)
);

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  period_end timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature_key, period_start)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_feature ON usage_tracking(user_id, feature_key);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_tiers (public read)
CREATE POLICY "Anyone can view subscription tiers"
  ON subscription_tiers FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON usage_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seed subscription tiers
INSERT INTO subscription_tiers (tier_id, display_name, description, monthly_price, annual_price, limits, features)
VALUES 
  (
    'free',
    'Free',
    'Your medical timeline, organized',
    0.00,
    0.00,
    '{
      "gemma_conversations_per_month": 3,
      "appointments_max": 10,
      "care_team_max": 5,
      "image_analyses_per_month": 0,
      "bloodwork_entries": 999999,
      "condition_letters": 999999,
      "nutrition_enabled": false,
      "movement_enabled": false,
      "meditation_enabled": false,
      "mindfulness_enabled": false,
      "consultation_prep_enabled": false
    }'::jsonb,
    '[
      "Timeline view",
      "Up to 10 appointments",
      "Up to 5 care team contacts",
      "3 Gemma conversations/month",
      "Basic tracking"
    ]'::jsonb
  ),
  (
    'plus',
    'Path9 Plus',
    'Your medical companion through treatment',
    19.99,
    179.00,
    '{
      "gemma_conversations_per_month": 999999,
      "appointments_max": 999999,
      "care_team_max": 999999,
      "image_analyses_per_month": 999999,
      "bloodwork_entries": 999999,
      "bloodwork_image_upload": true,
      "bloodwork_ai_analysis": true,
      "bloodwork_trends": true,
      "condition_letters": 999999,
      "condition_image_upload": true,
      "condition_ai_analysis": true,
      "condition_timeline": true,
      "consultation_prep_enabled": true,
      "consultation_prep_domains": ["bloodwork", "condition"],
      "nutrition_enabled": false,
      "movement_enabled": false,
      "meditation_enabled": false,
      "mindfulness_enabled": false
    }'::jsonb,
    '[
      "Everything in Free",
      "Unlimited Gemma conversations",
      "Unlimited appointments & care team",
      "Bloodwork: Image upload + AI analysis + trends",
      "Condition: Letter upload + AI analysis + timeline",
      "AI Consultation Prep (medical focus)"
    ]'::jsonb
  ),
  (
    'complete',
    'Path9 Complete',
    'Your complete healing journey companion',
    39.99,
    359.00,
    '{
      "gemma_conversations_per_month": 999999,
      "appointments_max": 999999,
      "care_team_max": 999999,
      "image_analyses_per_month": 999999,
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
      "mindfulness_enabled": true,
      "priority_support": true,
      "early_access": true
    }'::jsonb,
    '[
      "Everything in Plus",
      "Full Nutrition OS: AI analysis + patterns + trends + lens insights",
      "Full Movement OS: Tracking + AI guidance",
      "Full Meditation OS: Library + personalized recommendations",
      "Full Mindfulness OS: Journal + emotion tracking",
      "Priority support",
      "Early access to new features"
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

-- Function to check if user has entitlement
CREATE OR REPLACE FUNCTION check_entitlement(
  p_user_id uuid,
  p_feature_key text
)
RETURNS boolean AS $$
DECLARE
  v_tier_limits jsonb;
  v_limit_value jsonb;
BEGIN
  -- Get active subscription tier limits
  SELECT st.limits INTO v_tier_limits
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.tier_id
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
  ORDER BY 
    CASE st.tier_id 
      WHEN 'complete' THEN 3
      WHEN 'plus' THEN 2
      WHEN 'free' THEN 1
    END DESC
  LIMIT 1;
  
  IF v_tier_limits IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if feature is enabled
  v_limit_value := v_tier_limits -> p_feature_key;
  
  IF v_limit_value IS NULL THEN
    RETURN false;
  END IF;
  
  -- Handle boolean features
  IF jsonb_typeof(v_limit_value) = 'boolean' THEN
    RETURN (v_limit_value)::boolean;
  END IF;
  
  -- Handle numeric limits (checked separately via usage tracking)
  RETURN true;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid,
  p_feature_key text
)
RETURNS boolean AS $$
DECLARE
  v_current_period_start timestamptz;
  v_current_period_end timestamptz;
BEGIN
  v_current_period_start := date_trunc('month', now());
  v_current_period_end := v_current_period_start + interval '1 month';
  
  -- Insert or increment usage
  INSERT INTO usage_tracking (user_id, feature_key, usage_count, period_start, period_end)
  VALUES (p_user_id, p_feature_key, 1, v_current_period_start, v_current_period_end)
  ON CONFLICT (user_id, feature_key, period_start)
  DO UPDATE SET 
    usage_count = usage_tracking.usage_count + 1,
    updated_at = now();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check usage limit
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id uuid,
  p_feature_key text
)
RETURNS boolean AS $$
DECLARE
  v_limit integer;
  v_current_usage integer;
  v_current_period_start timestamptz;
BEGIN
  v_current_period_start := date_trunc('month', now());
  
  -- Get limit from active subscription
  SELECT (st.limits ->> (p_feature_key || '_per_month'))::integer INTO v_limit
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.tier_id
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
  ORDER BY 
    CASE st.tier_id 
      WHEN 'complete' THEN 3
      WHEN 'plus' THEN 2
      WHEN 'free' THEN 1
    END DESC
  LIMIT 1;
  
  -- If no limit or limit is very high (unlimited), allow
  IF v_limit IS NULL OR v_limit >= 999999 THEN
    RETURN true;
  END IF;
  
  -- Get current usage
  SELECT COALESCE(usage_count, 0) INTO v_current_usage
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND feature_key = p_feature_key
    AND period_start = v_current_period_start;
  
  RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing users with free tier
INSERT INTO user_subscriptions (user_id, tier_id, status, billing_cycle)
SELECT id, 'free', 'active', 'free'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions)
ON CONFLICT (user_id, tier_id) DO NOTHING;
