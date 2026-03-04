/*
  # Bloodwork Key Contacts System

  ## Purpose
  Enable users to maintain a trusted directory of all contacts involved in their
  blood cancer care journey, including consultants, nurses, lab staff, GPs, and
  administrative contacts.

  ## Tables Created

  ### `bloodwork_key_contacts`
  Stores contact information for healthcare providers and administrative staff.
  - `id` (uuid, primary key) - Unique contact identifier
  - `user_id` (uuid, foreign key to auth.users) - Contact owner
  - `contact_name` (text) - Full name of the contact
  - `role` (text) - Role type (consultant, nurse, lab, gp, secretary, other)
  - `establishment` (text, nullable) - Hospital, clinic, or facility name
  - `email` (text, nullable) - Contact email address
  - `phone` (text, nullable) - Contact phone number
  - `notes` (text, nullable) - Additional notes about the contact
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security
  - RLS enabled
  - Users can only access their own contacts
  - Full CRUD permissions for owned records

  ## Future Extensibility
  - Linkable to bloodwork_appointments (not enforced, ready for future use)
  - Can be referenced in consultation prep questions
*/

-- Create bloodwork_key_contacts table
CREATE TABLE IF NOT EXISTS bloodwork_key_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  role text NOT NULL,
  establishment text,
  email text,
  phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bloodwork_key_contacts_user_id 
  ON bloodwork_key_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_bloodwork_key_contacts_role 
  ON bloodwork_key_contacts(user_id, role);

-- Enable Row Level Security
ALTER TABLE bloodwork_key_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bloodwork_key_contacts

-- Users can view their own contacts
CREATE POLICY "Users can view own bloodwork key contacts"
  ON bloodwork_key_contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own contacts
CREATE POLICY "Users can insert own bloodwork key contacts"
  ON bloodwork_key_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own contacts
CREATE POLICY "Users can update own bloodwork key contacts"
  ON bloodwork_key_contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own contacts
CREATE POLICY "Users can delete own bloodwork key contacts"
  ON bloodwork_key_contacts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_bloodwork_key_contacts_updated_at
  BEFORE UPDATE ON bloodwork_key_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
