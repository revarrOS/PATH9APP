/*
  # Create Condition Documents System

  1. New Tables
    - `condition_documents`
      - Stores PDF metadata, extraction results, and masked/full text
      - Links to Supabase Storage for actual PDF files
      - Tracks extraction status and confidence
    - `condition_trend_signals`
      - Stores progression signals extracted from letters
      - Links back to source document
      - Categorized by type, polarity, and category

  2. Security
    - Enable RLS on both tables
    - Users can only access their own documents and signals
    - Cascade delete when user or document is deleted

  3. Indexes
    - Optimized for common queries (user_id, status, date)
*/

-- Create condition_documents table
CREATE TABLE IF NOT EXISTS condition_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  doc_type text NOT NULL DEFAULT 'letter'
    CHECK (doc_type IN ('letter', 'report', 'discharge', 'other')),
  source text,
  doc_date date,
  storage_path text NOT NULL,
  masked_text text,
  full_text text,
  extraction_json jsonb,
  extraction_status text NOT NULL DEFAULT 'uploaded'
    CHECK (extraction_status IN ('uploaded', 'processing', 'extracted', 'partial', 'failed')),
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create condition_trend_signals table
CREATE TABLE IF NOT EXISTS condition_trend_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES condition_documents(id) ON DELETE CASCADE,
  signal_date date NOT NULL,
  signal_type text NOT NULL DEFAULT 'other'
    CHECK (signal_type IN ('stability', 'improvement', 'progression', 'monitoring_change', 'other')),
  polarity text NOT NULL DEFAULT 'neutral'
    CHECK (polarity IN ('positive', 'negative', 'neutral')),
  category text NOT NULL DEFAULT 'other'
    CHECK (category IN ('clinical_marker', 'symptom', 'treatment_response', 'other')),
  description text NOT NULL,
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for condition_documents
CREATE INDEX IF NOT EXISTS idx_condition_documents_user_id
  ON condition_documents(user_id);

CREATE INDEX IF NOT EXISTS idx_condition_documents_status
  ON condition_documents(user_id, extraction_status);

CREATE INDEX IF NOT EXISTS idx_condition_documents_date
  ON condition_documents(user_id, doc_date DESC NULLS LAST);

-- Create indexes for condition_trend_signals
CREATE INDEX IF NOT EXISTS idx_condition_trend_signals_user_id
  ON condition_trend_signals(user_id);

CREATE INDEX IF NOT EXISTS idx_condition_trend_signals_document_id
  ON condition_trend_signals(document_id);

CREATE INDEX IF NOT EXISTS idx_condition_trend_signals_date
  ON condition_trend_signals(user_id, signal_date DESC);

CREATE INDEX IF NOT EXISTS idx_condition_trend_signals_polarity
  ON condition_trend_signals(user_id, polarity);

-- Enable RLS on condition_documents
ALTER TABLE condition_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for condition_documents
CREATE POLICY "Users can view own condition documents"
  ON condition_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own condition documents"
  ON condition_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own condition documents"
  ON condition_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own condition documents"
  ON condition_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable RLS on condition_trend_signals
ALTER TABLE condition_trend_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for condition_trend_signals
CREATE POLICY "Users can view own condition trend signals"
  ON condition_trend_signals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own condition trend signals"
  ON condition_trend_signals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own condition trend signals"
  ON condition_trend_signals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own condition trend signals"
  ON condition_trend_signals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
