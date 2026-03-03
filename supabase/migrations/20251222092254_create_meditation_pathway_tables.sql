/*
  # Create Meditation Pathway Tables
  
  This migration creates the tables needed for the Meditation pathway (Day 1-7).
  
  ## User Journey
  - Day 1-3: Stillness starter - gentle introduction to sitting still
  - Day 4-5: Breath-with-me grounding - guided breathing practices
  - Day 6-7: Personal meaning search - discover personal meditation purpose
  
  ## Tables
  
  ### meditation_sessions
  Track individual meditation sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `session_type` (text): 'stillness', 'breathing', 'meaning_search', 'custom'
  - `duration_seconds` (integer): How long the session lasted
  - `completed` (boolean): Whether user finished the session
  - `user_state_before` (jsonb): Emotional/energy state before
  - `user_state_after` (jsonb): Emotional/energy state after
  - `notes` (text): User's reflection notes
  - `created_at` (timestamptz)
  
  ### meditation_preferences
  User's meditation preferences and patterns
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `preferred_duration` (integer): Preferred session length in seconds
  - `preferred_time_of_day` (text): Morning, afternoon, evening, night
  - `preferred_style` (text): Guided, silent, breathing-focused
  - `adaptations_needed` (jsonb): Physical adaptations (chair, lying down, etc.)
  - `personal_meaning` (text): Why meditation matters to them
  - `updated_at` (timestamptz)
  
  ### meditation_prompts
  Context-aware meditation prompts delivered to users
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `prompt_text` (text): The meditation prompt
  - `prompt_type` (text): Type of prompt
  - `user_state_context` (jsonb): User's state when prompt was given
  - `delivered_at` (timestamptz)
  - `user_response` (text): User's reflection on the prompt
  
  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
*/

-- ============================================================================
-- MEDITATION SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS meditation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('stillness', 'breathing', 'meaning_search', 'custom')),
  duration_seconds integer NOT NULL DEFAULT 0,
  completed boolean DEFAULT false,
  user_state_before jsonb DEFAULT '{}'::jsonb,
  user_state_after jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_created ON meditation_sessions(created_at DESC);

ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meditation sessions"
  ON meditation_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meditation sessions"
  ON meditation_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation sessions"
  ON meditation_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MEDITATION PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS meditation_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferred_duration integer DEFAULT 300,
  preferred_time_of_day text,
  preferred_style text,
  adaptations_needed jsonb DEFAULT '[]'::jsonb,
  personal_meaning text,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_meditation_preferences_user_id ON meditation_preferences(user_id);

ALTER TABLE meditation_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meditation preferences"
  ON meditation_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meditation preferences"
  ON meditation_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation preferences"
  ON meditation_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MEDITATION PROMPTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS meditation_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_text text NOT NULL,
  prompt_type text NOT NULL,
  user_state_context jsonb DEFAULT '{}'::jsonb,
  delivered_at timestamptz DEFAULT now() NOT NULL,
  user_response text
);

CREATE INDEX IF NOT EXISTS idx_meditation_prompts_user_id ON meditation_prompts(user_id);

ALTER TABLE meditation_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meditation prompts"
  ON meditation_prompts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage meditation prompts"
  ON meditation_prompts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);