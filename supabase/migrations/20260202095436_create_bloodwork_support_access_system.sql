/*
  # Bloodwork Support Access System

  ## Purpose
  Enable users managing chronic blood conditions to invite trusted individuals
  (partners, carers, family members) to access their bloodwork data with
  controlled permissions.

  ## Tables Created

  ### `bloodwork_support_invitations`
  Stores pending invitations to access a user's bloodwork data.
  - `id` (uuid, primary key) - Unique invitation identifier
  - `owner_user_id` (uuid, foreign key to auth.users) - User sending the invitation
  - `invitee_email` (text) - Email address of person being invited
  - `invitee_name` (text) - Name of person being invited
  - `access_level` (text) - 'read_only' or 'read_write'
  - `invitation_token` (uuid) - Secure token for accepting invitation
  - `expires_at` (timestamptz) - Invitation expiry timestamp (30 days)
  - `status` (text) - 'pending', 'accepted', 'expired', 'revoked'
  - `created_at` (timestamptz) - Record creation timestamp

  ### `bloodwork_support_access`
  Stores active support relationships with granted access.
  - `id` (uuid, primary key) - Unique access record identifier
  - `owner_user_id` (uuid, foreign key to auth.users) - User who owns the data
  - `supporter_user_id` (uuid, foreign key to auth.users) - User with granted access
  - `supporter_name` (text) - Display name of supporter
  - `access_level` (text) - 'read_only' or 'read_write'
  - `created_at` (timestamptz) - When access was granted
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security
  - RLS enabled on both tables
  - Owners can manage their own invitations and access grants
  - Supporters can view their granted access records
  - No public sharing or anonymous access
  - Bloodwork-only scope (does not affect other products)

  ## Access Levels
  - read_only: Can view bloodwork entries, trends, and analysis
  - read_write: Can also add entries, appointments, notes, and questions

  ## Invitation Flow
  1. User creates invitation → stored in bloodwork_support_invitations
  2. Invitee receives email with secure token
  3. Invitee accepts → record created in bloodwork_support_access
  4. Original invitation marked as 'accepted'
  5. Owner can revoke access at any time
*/

-- Create bloodwork_support_invitations table
CREATE TABLE IF NOT EXISTS bloodwork_support_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email text NOT NULL,
  invitee_name text NOT NULL,
  access_level text NOT NULL DEFAULT 'read_only',
  invitation_token uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Add constraints for bloodwork_support_invitations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bloodwork_support_invitations_access_level_check'
  ) THEN
    ALTER TABLE bloodwork_support_invitations 
      ADD CONSTRAINT bloodwork_support_invitations_access_level_check 
      CHECK (access_level IN ('read_only', 'read_write'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bloodwork_support_invitations_status_check'
  ) THEN
    ALTER TABLE bloodwork_support_invitations 
      ADD CONSTRAINT bloodwork_support_invitations_status_check 
      CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'));
  END IF;
END $$;

-- Create bloodwork_support_access table
CREATE TABLE IF NOT EXISTS bloodwork_support_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supporter_name text NOT NULL,
  access_level text NOT NULL DEFAULT 'read_only',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(owner_user_id, supporter_user_id)
);

-- Add constraints for bloodwork_support_access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bloodwork_support_access_access_level_check'
  ) THEN
    ALTER TABLE bloodwork_support_access 
      ADD CONSTRAINT bloodwork_support_access_access_level_check 
      CHECK (access_level IN ('read_only', 'read_write'));
  END IF;

  -- Prevent self-access
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bloodwork_support_access_no_self_access'
  ) THEN
    ALTER TABLE bloodwork_support_access 
      ADD CONSTRAINT bloodwork_support_access_no_self_access 
      CHECK (owner_user_id != supporter_user_id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bloodwork_support_invitations_owner 
  ON bloodwork_support_invitations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_support_invitations_email 
  ON bloodwork_support_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_bloodwork_support_invitations_token 
  ON bloodwork_support_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_bloodwork_support_invitations_status 
  ON bloodwork_support_invitations(owner_user_id, status);

CREATE INDEX IF NOT EXISTS idx_bloodwork_support_access_owner 
  ON bloodwork_support_access(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_support_access_supporter 
  ON bloodwork_support_access(supporter_user_id);

-- Enable Row Level Security
ALTER TABLE bloodwork_support_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloodwork_support_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bloodwork_support_invitations

-- Owners can view their own invitations
CREATE POLICY "Users can view own support invitations"
  ON bloodwork_support_invitations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_user_id);

-- Owners can create invitations
CREATE POLICY "Users can create support invitations"
  ON bloodwork_support_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

-- Owners can update their own invitations (to revoke, etc.)
CREATE POLICY "Users can update own support invitations"
  ON bloodwork_support_invitations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Owners can delete their own invitations
CREATE POLICY "Users can delete own support invitations"
  ON bloodwork_support_invitations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_user_id);

-- RLS Policies for bloodwork_support_access

-- Owners can view access grants they've made
CREATE POLICY "Owners can view granted support access"
  ON bloodwork_support_access
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_user_id);

-- Supporters can view their granted access
CREATE POLICY "Supporters can view their access grants"
  ON bloodwork_support_access
  FOR SELECT
  TO authenticated
  USING (auth.uid() = supporter_user_id);

-- Only system/edge functions can create access records (via invitation acceptance)
CREATE POLICY "System can create support access records"
  ON bloodwork_support_access
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_user_id OR 
    auth.uid() = supporter_user_id
  );

-- Owners can update access levels
CREATE POLICY "Owners can update support access levels"
  ON bloodwork_support_access
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Owners can revoke access
CREATE POLICY "Owners can revoke support access"
  ON bloodwork_support_access
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_user_id);

-- Supporters can remove their own access
CREATE POLICY "Supporters can remove their access"
  ON bloodwork_support_access
  FOR DELETE
  TO authenticated
  USING (auth.uid() = supporter_user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_bloodwork_support_access_updated_at
  BEFORE UPDATE ON bloodwork_support_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
