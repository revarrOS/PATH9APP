/*
  # Create Movement and Mindfulness Pathway Tables
  
  This migration creates tables for both Movement and Mindfulness pathways.
  
  ## Movement Journey (Day 1-7)
  - Day 1-3: Movement reality explainer - understand body's new needs
  - Day 4-5: Permission to rest - normalize rest as healing
  - Day 6-7: Walking as medicine - gentle reintroduction to movement
  
  ## Mindfulness Journey (Day 1-7)
  - Day 1-3: Emotion naming - identify and name feelings
  - Day 4-5: Reaction normalizer - validate emotional responses
  - Day 6-7: Private journaling space - secure emotional processing
  
  ## Movement Tables
  
  ### movement_profiles
  User's movement capacity and goals
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `current_capacity` (text): Energy level and physical ability
  - `limitations` (jsonb): Physical constraints (pain, fatigue, etc.)
  - `movement_goals` (jsonb): What they want to achieve
  - `doctor_restrictions` (text): Medical limitations
  - `preferred_activities` (jsonb): Walking, stretching, yoga, etc.
  - `updated_at` (timestamptz)
  
  ### movement_activities
  Track movement sessions and progress
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `activity_type` (text): Walking, stretching, rest, etc.
  - `duration_minutes` (integer): How long
  - `intensity` (text): Light, moderate, rest
  - `how_felt_before` (text): Energy/state before
  - `how_felt_after` (text): Energy/state after
  - `notes` (text): User reflections
  - `created_at` (timestamptz)
  
  ### movement_insights
  AI-generated movement guidance
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `insight_type` (text): 'reality_check', 'rest_permission', 'walking_guide'
  - `insight_text` (text): Personalized guidance
  - `pacing_recommendations` (jsonb): Specific pacing advice
  - `created_at` (timestamptz)
  
  ## Mindfulness Tables
  
  ### mindfulness_profiles
  User's emotional awareness journey
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `identified_emotions` (jsonb): Emotions they've named
  - `common_triggers` (jsonb): Recurring trigger patterns
  - `coping_strategies` (jsonb): What helps them
  - `updated_at` (timestamptz)
  
  ### emotion_check_ins
  Track emotion identification over time
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `named_emotion` (text): The emotion they identified
  - `intensity` (integer): 1-10 scale
  - `trigger_context` (text): What led to this emotion
  - `body_sensations` (text): Physical manifestations
  - `normalized` (boolean): Whether AI provided normalization
  - `created_at` (timestamptz)
  
  ### emotion_normalizations
  AI-generated validations and normalizations
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `emotion` (text): The emotion being normalized
  - `context` (text): User's specific situation
  - `normalization_text` (text): AI-generated validation
  - `reassurance_points` (jsonb): Key reassurances
  - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
*/

-- ============================================================================
-- MOVEMENT TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS movement_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_capacity text,
  limitations jsonb DEFAULT '[]'::jsonb,
  movement_goals jsonb DEFAULT '[]'::jsonb,
  doctor_restrictions text,
  preferred_activities jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movement_profiles_user_id ON movement_profiles(user_id);

ALTER TABLE movement_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own movement profile"
  ON movement_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own movement profile"
  ON movement_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own movement profile"
  ON movement_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================

CREATE TABLE IF NOT EXISTS movement_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  duration_minutes integer DEFAULT 0,
  intensity text CHECK (intensity IN ('rest', 'light', 'moderate')),
  how_felt_before text,
  how_felt_after text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movement_activities_user_id ON movement_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_movement_activities_created ON movement_activities(created_at DESC);

ALTER TABLE movement_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own movement activities"
  ON movement_activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own movement activities"
  ON movement_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================

CREATE TABLE IF NOT EXISTS movement_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN ('reality_check', 'rest_permission', 'walking_guide', 'general')),
  insight_text text NOT NULL,
  pacing_recommendations jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_movement_insights_user_id ON movement_insights(user_id);

ALTER TABLE movement_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own movement insights"
  ON movement_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage movement insights"
  ON movement_insights FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- MINDFULNESS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS mindfulness_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  identified_emotions jsonb DEFAULT '[]'::jsonb,
  common_triggers jsonb DEFAULT '[]'::jsonb,
  coping_strategies jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mindfulness_profiles_user_id ON mindfulness_profiles(user_id);

ALTER TABLE mindfulness_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mindfulness profile"
  ON mindfulness_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own mindfulness profile"
  ON mindfulness_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mindfulness profile"
  ON mindfulness_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================

CREATE TABLE IF NOT EXISTS emotion_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  named_emotion text NOT NULL,
  intensity integer CHECK (intensity >= 1 AND intensity <= 10),
  trigger_context text,
  body_sensations text,
  normalized boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_emotion_check_ins_user_id ON emotion_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_check_ins_created ON emotion_check_ins(created_at DESC);

ALTER TABLE emotion_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emotion check-ins"
  ON emotion_check_ins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own emotion check-ins"
  ON emotion_check_ins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update emotion check-ins"
  ON emotion_check_ins FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================

CREATE TABLE IF NOT EXISTS emotion_normalizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emotion text NOT NULL,
  context text NOT NULL,
  normalization_text text NOT NULL,
  reassurance_points jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_emotion_normalizations_user_id ON emotion_normalizations(user_id);

ALTER TABLE emotion_normalizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emotion normalizations"
  ON emotion_normalizations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage emotion normalizations"
  ON emotion_normalizations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);