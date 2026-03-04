/*
  # Create Nutrition Pathway Tables
  
  This migration creates the tables needed for the Nutrition pathway (Day 1-7).
  
  ## User Journey
  - Day 1-3: Nutrition reality explainer - understand how nutrition affects healing
  - Day 4-5: Immune system education - learn about immune support
  - Day 6-7: Consumption-style selector - find personalized eating patterns
  
  ## Tables
  
  ### nutrition_profiles
  Stores user's nutrition preferences and constraints
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `consumption_style` (text): User's preferred eating pattern (e.g., 'small-frequent', 'three-meals', 'intuitive')
  - `dietary_restrictions` (jsonb): Allergies, intolerances, preferences
  - `current_symptoms` (jsonb): Nausea, appetite loss, taste changes, etc.
  - `goals` (jsonb): Healing, energy, immune support
  - `doctor_recommendations` (text): Any doctor-prescribed nutrition guidance
  - `updated_at` (timestamptz)
  
  ### nutrition_insights
  AI-generated personalized nutrition insights
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `insight_type` (text): 'reality_check', 'immune_education', 'consumption_style'
  - `insight_text` (text): The actual insight
  - `key_takeaways` (jsonb): Main points to remember
  - `action_items` (jsonb): Practical next steps
  - `created_at` (timestamptz)
  
  ### nutrition_interactions
  Track doctor-to-nutrition translations
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `doctor_recommendation` (text): Original doctor guidance
  - `translated_guidance` (text): User-friendly translation
  - `practical_examples` (jsonb): Real-world examples
  - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
*/

-- ============================================================================
-- NUTRITION PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  consumption_style text,
  dietary_restrictions jsonb DEFAULT '[]'::jsonb,
  current_symptoms jsonb DEFAULT '[]'::jsonb,
  goals jsonb DEFAULT '[]'::jsonb,
  doctor_recommendations text,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nutrition_profiles_user_id ON nutrition_profiles(user_id);

ALTER TABLE nutrition_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nutrition profile"
  ON nutrition_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own nutrition profile"
  ON nutrition_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition profile"
  ON nutrition_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- NUTRITION INSIGHTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN ('reality_check', 'immune_education', 'consumption_style', 'general')),
  insight_text text NOT NULL,
  key_takeaways jsonb DEFAULT '[]'::jsonb,
  action_items jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nutrition_insights_user_id ON nutrition_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_insights_type ON nutrition_insights(insight_type);

ALTER TABLE nutrition_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nutrition insights"
  ON nutrition_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage nutrition insights"
  ON nutrition_insights FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- NUTRITION INTERACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_recommendation text NOT NULL,
  translated_guidance text NOT NULL,
  practical_examples jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nutrition_interactions_user_id ON nutrition_interactions(user_id);

ALTER TABLE nutrition_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nutrition interactions"
  ON nutrition_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage nutrition interactions"
  ON nutrition_interactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);