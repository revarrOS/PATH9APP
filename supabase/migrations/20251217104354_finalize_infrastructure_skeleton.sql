/*
  # Finalize Infrastructure Skeleton - NO DRIFT

  ## Overview
  Lock down the infrastructure to exact specifications.
  Remove any fields not in the spec. Add missing RLS policies.

  ## 1. Schema Modifications
  
  ### `profiles` table cleanup
  - Remove `email` column (not in spec)
  - Keep only: id, created_at, updated_at, timezone, locale
  
  ## 2. RLS Policy Updates
  
  ### `profiles` policies
  - Add DELETE policy for user isolation
  
  ### `audit_events` policies  
  - Add UPDATE policy for user isolation
  - Add DELETE policy for user isolation
  
  ## 3. Security
  - All policies enforce auth.uid() = user_id/id
  - Complete CRUD isolation at database level
  - No admin bypass
  
  ## 4. Important Notes
  - Infrastructure skeleton only
  - No business logic
  - No health/clinical data
  - Strict user isolation on all operations
*/

-- Remove email column from profiles (not in spec)
ALTER TABLE profiles DROP COLUMN IF EXISTS email;

-- Update the trigger function to not insert email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (
    NEW.id,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add DELETE policy for profiles
CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Add UPDATE policy for audit_events
CREATE POLICY "Users can update own audit events"
  ON audit_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for audit_events
CREATE POLICY "Users can delete own audit events"
  ON audit_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);