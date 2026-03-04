/*
  # Create Global Gemma Conversation History

  1. New Tables
    - `gemma_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `messages` (jsonb array of conversation messages)
      - `context_metadata` (jsonb, stores domain context like entry IDs)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `gemma_conversations` table
    - Add policies for authenticated users to manage their own conversations

  3. Notes
    - This table provides a single, global conversation thread per user
    - Gemma maintains continuity across all Medical domains
    - Messages stored as JSONB array for efficient retrieval
    - Context metadata tracks which entries user was discussing
*/

CREATE TABLE IF NOT EXISTS gemma_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb NOT NULL,
  context_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE gemma_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation"
  ON gemma_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation"
  ON gemma_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation"
  ON gemma_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversation"
  ON gemma_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gemma_conversations_user_id 
  ON gemma_conversations(user_id);
