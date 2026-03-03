/*
  # Create Knowledge Canon Tables

  1. New Tables
    - `canon_documents`
      - `id` (uuid, primary key)
      - `title` (text)
      - `pillar` (text) - Content category (e.g., "goal_setting", "habit_formation")
      - `journey_phase` (text) - Relevant journey phase
      - `tone` (text) - Content tone (e.g., "instructional", "reflective")
      - `sensitivity` (text) - Content sensitivity level (e.g., "low", "medium", "high")
      - `version` (text) - Document version
      - `content` (text) - Full document content
      - `metadata` (jsonb) - Additional metadata
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `canon_chunks`
      - `id` (uuid, primary key)
      - `document_id` (uuid, foreign key to canon_documents)
      - `chunk_index` (integer) - Order within document
      - `content` (text) - Chunk content
      - `pillar` (text) - Inherited from document
      - `journey_phase` (text) - Inherited from document
      - `tone` (text) - Inherited from document
      - `sensitivity` (text) - Inherited from document
      - `version` (text) - Canon version
      - `tags` (text[]) - Additional tags for retrieval
      - `metadata` (jsonb) - Additional metadata
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Canon is read-only for authenticated users
    - No insert/update/delete for regular users
    - Only service role can modify canon

  3. Indexes
    - Index on pillar, journey_phase for efficient retrieval
*/

-- Create canon_documents table
CREATE TABLE IF NOT EXISTS canon_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  pillar text NOT NULL,
  journey_phase text NOT NULL,
  tone text NOT NULL,
  sensitivity text NOT NULL,
  version text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create canon_chunks table
CREATE TABLE IF NOT EXISTS canon_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES canon_documents(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  pillar text NOT NULL,
  journey_phase text NOT NULL,
  tone text NOT NULL,
  sensitivity text NOT NULL,
  version text NOT NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, chunk_index)
);

-- Create indexes for efficient retrieval
CREATE INDEX IF NOT EXISTS idx_canon_chunks_pillar ON canon_chunks(pillar);
CREATE INDEX IF NOT EXISTS idx_canon_chunks_journey_phase ON canon_chunks(journey_phase);
CREATE INDEX IF NOT EXISTS idx_canon_chunks_tags ON canon_chunks USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_canon_chunks_document_id ON canon_chunks(document_id);

-- Enable RLS
ALTER TABLE canon_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE canon_chunks ENABLE ROW LEVEL SECURITY;

-- Canon is read-only for authenticated users
CREATE POLICY "Authenticated users can read canon documents"
  ON canon_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read canon chunks"
  ON canon_chunks FOR SELECT
  TO authenticated
  USING (true);

-- Service role can manage canon (for ingestion)
CREATE POLICY "Service role can manage canon documents"
  ON canon_documents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage canon chunks"
  ON canon_chunks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
