/*
  # Create Unified Consultation Questions Table

  1. New Tables
    - `consultation_questions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `question_text` (text)
      - `domain` (text: 'bloodwork' | 'condition' | 'general')
      - `related_entry_id` (uuid, nullable - can link to bloodwork or condition entry)
      - `priority` (text: 'clinical' | 'logistical' | 'general')
      - `source` (text: 'ai_suggested' | 'user_added')
      - `is_answered` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `consultation_questions` table
    - Add policies for authenticated users to manage their own questions

  3. Notes
    - This table unifies consultation questions across all Medical domains
    - Questions can be tagged by domain but live in one global list
    - Supports cross-domain question management
    - Replaces domain-specific consultation tables
*/

CREATE TABLE IF NOT EXISTS consultation_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  domain text DEFAULT 'general' NOT NULL CHECK (domain IN ('bloodwork', 'condition', 'general')),
  related_entry_id uuid,
  priority text DEFAULT 'general' NOT NULL CHECK (priority IN ('clinical', 'logistical', 'general')),
  source text DEFAULT 'user_added' NOT NULL CHECK (source IN ('ai_suggested', 'user_added')),
  is_answered boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE consultation_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own questions"
  ON consultation_questions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own questions"
  ON consultation_questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions"
  ON consultation_questions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions"
  ON consultation_questions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_consultation_questions_user_id 
  ON consultation_questions(user_id);

CREATE INDEX IF NOT EXISTS idx_consultation_questions_domain 
  ON consultation_questions(domain);
