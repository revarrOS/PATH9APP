/*
  # Add User Isolation Infrastructure

  ## Overview
  Infrastructure-only migration to support user isolation and audit logging.
  No business logic, no clinical data, no features.

  ## 1. Updates to Existing Tables
  
  ### `profiles` table modifications
  - Add `timezone` (text, nullable) - User timezone preference
  - Add `locale` (text, nullable) - User locale/language preference
  
  ## 2. New Tables
  
  ### `audit_events`
  Minimal audit logging for user actions
  - `id` (uuid, primary key) - Unique event identifier
  - `user_id` (uuid, foreign key) - References auth.users.id
  - `event_type` (text) - Type of event being logged
  - `created_at` (timestamptz) - Event timestamp
  - `metadata` (jsonb, nullable) - Additional event data
  
  ## 3. Security
  
  ### Row Level Security (RLS)
  - Profiles: Users can only access their own profile row
  - Audit Events: Users can only see their own audit events
  - No admin bypass in code
  - Strict user isolation enforced at database level
  
  ## 4. Important Notes
  - Infrastructure skeleton only
  - No sensitive content in audit logs
  - All access is user-scoped
  - No additional tables beyond profiles and audit_events
*/

-- Add columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN timezone text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'locale'
  ) THEN
    ALTER TABLE profiles ADD COLUMN locale text;
  END IF;
END $$;

-- Create audit_events table
CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb
);

-- Enable RLS on audit_events
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_events - strict user isolation
CREATE POLICY "Users can read own audit events"
  ON audit_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit events"
  ON audit_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for efficient user queries
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id 
  ON audit_events(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_events_created_at 
  ON audit_events(created_at DESC);