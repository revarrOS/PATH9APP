/*
  # Create Shared Infrastructure Tables
  
  This migration creates the foundational tables used across multiple pathways:
  - Journaling system (Meditation, Mindfulness)
  - Content library and delivery (Meditation, Movement)
  - Education generation and caching (Nutrition, Movement)
  
  ## 1. Journaling System
  
  ### Tables
  - `journal_entries`: Individual journal entries from users
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `pathway_type` (text): Which pathway this entry belongs to
    - `entry_text` (text): The actual journal content
    - `entry_date` (date): Date of the entry
    - `emotional_tags` (jsonb): AI-detected emotions/themes
    - `created_at` (timestamptz)
    
  - `journal_summaries`: AI-generated summaries of journal patterns
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `pathway_type` (text): Which pathway this summary is for
    - `summary_period_start` (date): Start of summary period
    - `summary_period_end` (date): End of summary period
    - `summary_text` (text): AI-generated summary
    - `detected_patterns` (jsonb): Patterns detected (triggers, progress, etc.)
    - `created_at` (timestamptz)
  
  ## 2. Content Library System
  
  ### Tables
  - `content_library`: Reusable content pieces (exercises, prompts, articles)
    - `id` (uuid, primary key)
    - `content_type` (text): 'exercise', 'prompt', 'article', 'audio_guide'
    - `pathway_type` (text): Which pathway this belongs to
    - `title` (text): Content title
    - `description` (text): Brief description
    - `content_body` (text): The actual content
    - `metadata` (jsonb): Additional properties (duration, difficulty, tags)
    - `state_requirements` (jsonb): User state conditions for this content
    - `created_at` (timestamptz)
    
  - `user_content_history`: Track content delivery to users
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `content_id` (uuid, references content_library)
    - `delivered_at` (timestamptz)
    - `user_state_at_delivery` (jsonb): User's state when content was delivered
    - `completed` (boolean): Whether user completed the content
    - `user_feedback` (jsonb): Optional feedback from user
  
  - `user_state_snapshots`: Track user's current state for content matching
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `pathway_type` (text): Which pathway this state belongs to
    - `emotional_state` (text): Current emotional state
    - `energy_level` (text): Current energy level
    - `context` (jsonb): Additional context (time of day, recent events, etc.)
    - `created_at` (timestamptz)
  
  ## 3. Education Cache System
  
  ### Tables
  - `education_cache`: Cache AI-generated educational content
    - `id` (uuid, primary key)
    - `topic_key` (text): Unique key for this topic
    - `pathway_type` (text): Which pathway this belongs to
    - `source_text` (text): Original complex text
    - `simplified_text` (text): AI-simplified version
    - `key_concepts` (jsonb): Extracted key concepts
    - `follow_up_questions` (jsonb): Suggested questions
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
  
  - `user_education_progress`: Track educational content delivered to users
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `pathway_type` (text): Which pathway
    - `topic_key` (text): Reference to education_cache topic
    - `delivered_at` (timestamptz)
    - `understood` (boolean): User indicated understanding
    - `follow_up_needed` (boolean): User requested more info
  
  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Content library is readable by authenticated users
*/

-- ============================================================================
-- JOURNALING SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pathway_type text NOT NULL CHECK (pathway_type IN ('medical', 'nutrition', 'meditation', 'mindfulness', 'movement')),
  entry_text text NOT NULL,
  entry_date date DEFAULT CURRENT_DATE NOT NULL,
  emotional_tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_pathway ON journal_entries(pathway_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own journal entries"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================

CREATE TABLE IF NOT EXISTS journal_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pathway_type text NOT NULL CHECK (pathway_type IN ('medical', 'nutrition', 'meditation', 'mindfulness', 'movement')),
  summary_period_start date NOT NULL,
  summary_period_end date NOT NULL,
  summary_text text NOT NULL,
  detected_patterns jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_journal_summaries_user_id ON journal_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_summaries_pathway ON journal_summaries(pathway_type);

ALTER TABLE journal_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal summaries"
  ON journal_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage journal summaries"
  ON journal_summaries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- CONTENT LIBRARY SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('exercise', 'prompt', 'article', 'audio_guide', 'reflection')),
  pathway_type text NOT NULL CHECK (pathway_type IN ('medical', 'nutrition', 'meditation', 'mindfulness', 'movement')),
  title text NOT NULL,
  description text NOT NULL,
  content_body text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  state_requirements jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_library_pathway ON content_library(pathway_type);
CREATE INDEX IF NOT EXISTS idx_content_library_type ON content_library(content_type);

ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view content library"
  ON content_library FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage content library"
  ON content_library FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================

CREATE TABLE IF NOT EXISTS user_content_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES content_library(id) ON DELETE CASCADE NOT NULL,
  delivered_at timestamptz DEFAULT now() NOT NULL,
  user_state_at_delivery jsonb DEFAULT '{}'::jsonb,
  completed boolean DEFAULT false,
  user_feedback jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_content_history_user_id ON user_content_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_history_content_id ON user_content_history(content_id);

ALTER TABLE user_content_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content history"
  ON user_content_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage content history"
  ON user_content_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================

CREATE TABLE IF NOT EXISTS user_state_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pathway_type text NOT NULL CHECK (pathway_type IN ('medical', 'nutrition', 'meditation', 'mindfulness', 'movement')),
  emotional_state text,
  energy_level text,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_state_snapshots_user_id ON user_state_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_user_state_snapshots_created ON user_state_snapshots(created_at DESC);

ALTER TABLE user_state_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own state snapshots"
  ON user_state_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own state snapshots"
  ON user_state_snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- EDUCATION CACHE SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS education_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_key text NOT NULL UNIQUE,
  pathway_type text NOT NULL CHECK (pathway_type IN ('medical', 'nutrition', 'meditation', 'mindfulness', 'movement')),
  source_text text NOT NULL,
  simplified_text text NOT NULL,
  key_concepts jsonb DEFAULT '[]'::jsonb,
  follow_up_questions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_education_cache_topic_key ON education_cache(topic_key);
CREATE INDEX IF NOT EXISTS idx_education_cache_pathway ON education_cache(pathway_type);

ALTER TABLE education_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view education cache"
  ON education_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage education cache"
  ON education_cache FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================

CREATE TABLE IF NOT EXISTS user_education_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pathway_type text NOT NULL CHECK (pathway_type IN ('medical', 'nutrition', 'meditation', 'mindfulness', 'movement')),
  topic_key text NOT NULL,
  delivered_at timestamptz DEFAULT now() NOT NULL,
  understood boolean DEFAULT false,
  follow_up_needed boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_user_education_progress_user_id ON user_education_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_education_progress_topic ON user_education_progress(topic_key);

ALTER TABLE user_education_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own education progress"
  ON user_education_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage education progress"
  ON user_education_progress FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);