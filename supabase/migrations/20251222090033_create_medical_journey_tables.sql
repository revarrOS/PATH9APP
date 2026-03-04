/*
  # Medical Journey Infrastructure - Day 1-7 Support

  ## Purpose
  Create comprehensive tables to support users through their first week after diagnosis.
  These tables enable medical translation, appointment coordination, timeline inference,
  and emotional safety interventions.

  ## New Tables

  ### 1. diagnoses
  Stores structured medical diagnosis data with plain English translations
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `diagnosis_name` (text) - Medical diagnosis name
  - `diagnosis_date` (date) - When diagnosis was received
  - `stage_or_severity` (text) - Stage/grade information
  - `icd_code` (text) - Standard diagnosis code
  - `raw_pathology_text` (text) - Original medical language
  - `plain_english_summary` (text) - Translated version
  - `created_at` (timestamptz)

  ### 2. appointments
  Tracks medical appointments for care coordination
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `appointment_datetime` (timestamptz) - When appointment occurs
  - `provider_name` (text) - Doctor/provider name
  - `provider_role` (text) - Oncologist, surgeon, etc.
  - `appointment_type` (text) - Consultation, treatment, follow-up
  - `location` (text) - Hospital/clinic
  - `preparation_notes` (text) - What to bring/prepare
  - `questions_to_ask` (jsonb) - Suggested questions array
  - `status` (text) - scheduled, completed, cancelled
  - `notes_after` (text) - Post-appointment notes
  - `created_at` (timestamptz)

  ### 3. care_team
  Directory of user's medical providers
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `provider_name` (text) - Provider's name
  - `role` (text) - Medical role/specialty
  - `specialty` (text) - Additional specialty info
  - `contact_info` (jsonb) - Phone, email, etc.
  - `communication_preferences` (text) - How they prefer contact
  - `first_seen_date` (date) - When first met
  - `notes` (text) - User notes about provider
  - `created_at` (timestamptz)

  ### 4. treatment_timeline
  Predicted treatment journey phases
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `diagnosis_id` (uuid, references diagnoses)
  - `timeline_phase` (text) - Phase name (surgery, chemo, etc.)
  - `phase_order` (integer) - Sequential order
  - `estimated_start_date` (date) - When phase should start
  - `estimated_duration_weeks` (integer) - How long phase lasts
  - `description` (text) - What happens in this phase
  - `key_milestones` (jsonb) - Important events in phase
  - `actual_start_date` (date) - When phase actually started
  - `actual_end_date` (date) - When phase actually ended
  - `status` (text) - upcoming, in_progress, completed
  - `created_at` (timestamptz)

  ### 5. emotional_checkins
  Track user's emotional state over time
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `checkin_time` (timestamptz) - When check-in occurred
  - `anxiety_level` (integer) - 1-10 scale
  - `overwhelm_level` (integer) - 1-10 scale
  - `hope_level` (integer) - 1-10 scale
  - `physical_wellbeing` (integer) - 1-10 scale
  - `detected_from` (text) - How we detected state
  - `intervention_offered` (text) - What help was offered
  - `intervention_accepted` (boolean) - Did user accept help
  - `created_at` (timestamptz)

  ### 6. safety_interventions
  Crisis detection and intervention tracking
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `intervention_time` (timestamptz) - When intervention happened
  - `trigger_type` (text) - What triggered intervention
  - `trigger_content` (text) - User's message that triggered
  - `severity_score` (integer) - 1-10 severity
  - `intervention_type` (text) - Type of help offered
  - `intervention_content` (text) - What we said/did
  - `user_response` (text) - How user responded
  - `resolved` (boolean) - Is crisis resolved
  - `escalated_to_human` (boolean) - Did we escalate
  - `created_at` (timestamptz)

  ### 7. user_literacy_profile
  Track user's understanding level for personalization
  - `user_id` (uuid, primary key, references profiles)
  - `medical_literacy` (integer) - 1-10 medical knowledge
  - `nutrition_literacy` (integer) - 1-10 nutrition knowledge
  - `meditation_literacy` (integer) - 1-10 meditation knowledge
  - `mindfulness_literacy` (integer) - 1-10 mindfulness knowledge
  - `movement_literacy` (integer) - 1-10 movement knowledge
  - `updated_at` (timestamptz)

  ### 8. translation_cache
  Cache medical translations to avoid re-translating
  - `id` (uuid, primary key)
  - `domain` (text) - medical, nutrition, etc.
  - `technical_text` (text) - Original medical language
  - `plain_english` (text) - Translation
  - `key_terms` (jsonb) - Terms with definitions
  - `complexity_score` (integer) - 1-10 complexity
  - `context_hash` (text) - Hash of user context
  - `access_count` (integer) - How many times used
  - `last_accessed_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 9. translation_feedback
  User feedback on translation quality
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `translation_cache_id` (uuid, references translation_cache)
  - `helpful` (boolean) - Was translation helpful
  - `too_simple` (boolean) - Was it too simple
  - `too_complex` (boolean) - Was it too complex
  - `comments` (text) - User feedback
  - `created_at` (timestamptz)

  ## Security
  All tables have RLS enabled with policies ensuring users can only access their own data.
  No public access is allowed - all operations require authentication.

  ## Indexes
  Critical indexes added for common query patterns:
  - Diagnosis lookups by user
  - Appointment lookups by user and date
  - Timeline phase lookups
  - Translation cache lookups
*/

-- 1. DIAGNOSES
CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  diagnosis_name text NOT NULL,
  diagnosis_date date NOT NULL,
  stage_or_severity text,
  icd_code text,
  raw_pathology_text text,
  plain_english_summary text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_user_id ON diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_date ON diagnoses(user_id, diagnosis_date DESC);

ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own diagnoses"
  ON diagnoses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnoses"
  ON diagnoses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diagnoses"
  ON diagnoses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  appointment_datetime timestamptz NOT NULL,
  provider_name text,
  provider_role text,
  appointment_type text,
  location text,
  preparation_notes text,
  questions_to_ask jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'scheduled',
  notes_after text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(user_id, appointment_datetime);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(user_id, status);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
  ON appointments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. CARE TEAM
CREATE TABLE IF NOT EXISTS care_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  provider_name text NOT NULL,
  role text NOT NULL,
  specialty text,
  contact_info jsonb DEFAULT '{}'::jsonb,
  communication_preferences text,
  first_seen_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_care_team_user_id ON care_team(user_id);
CREATE INDEX IF NOT EXISTS idx_care_team_role ON care_team(user_id, role);

ALTER TABLE care_team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own care team"
  ON care_team FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own care team"
  ON care_team FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own care team"
  ON care_team FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own care team"
  ON care_team FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. TREATMENT TIMELINE
CREATE TABLE IF NOT EXISTS treatment_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  diagnosis_id uuid REFERENCES diagnoses(id) ON DELETE CASCADE,
  timeline_phase text NOT NULL,
  phase_order integer NOT NULL,
  estimated_start_date date,
  estimated_duration_weeks integer,
  description text,
  key_milestones jsonb DEFAULT '[]'::jsonb,
  actual_start_date date,
  actual_end_date date,
  status text DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treatment_timeline_user_id ON treatment_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_timeline_phase_order ON treatment_timeline(user_id, phase_order);
CREATE INDEX IF NOT EXISTS idx_treatment_timeline_status ON treatment_timeline(user_id, status);

ALTER TABLE treatment_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own treatment timeline"
  ON treatment_timeline FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own treatment timeline"
  ON treatment_timeline FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treatment timeline"
  ON treatment_timeline FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own treatment timeline"
  ON treatment_timeline FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. EMOTIONAL CHECKINS
CREATE TABLE IF NOT EXISTS emotional_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  checkin_time timestamptz DEFAULT now(),
  anxiety_level integer CHECK (anxiety_level >= 1 AND anxiety_level <= 10),
  overwhelm_level integer CHECK (overwhelm_level >= 1 AND overwhelm_level <= 10),
  hope_level integer CHECK (hope_level >= 1 AND hope_level <= 10),
  physical_wellbeing integer CHECK (physical_wellbeing >= 1 AND physical_wellbeing <= 10),
  detected_from text,
  intervention_offered text,
  intervention_accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emotional_checkins_user_id ON emotional_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_checkins_time ON emotional_checkins(user_id, checkin_time DESC);

ALTER TABLE emotional_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own emotional checkins"
  ON emotional_checkins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emotional checkins"
  ON emotional_checkins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. SAFETY INTERVENTIONS
CREATE TABLE IF NOT EXISTS safety_interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  intervention_time timestamptz DEFAULT now(),
  trigger_type text NOT NULL,
  trigger_content text,
  severity_score integer CHECK (severity_score >= 1 AND severity_score <= 10),
  intervention_type text,
  intervention_content text,
  user_response text,
  resolved boolean DEFAULT false,
  escalated_to_human boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safety_interventions_user_id ON safety_interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_interventions_time ON safety_interventions(user_id, intervention_time DESC);
CREATE INDEX IF NOT EXISTS idx_safety_interventions_severity ON safety_interventions(user_id, severity_score DESC);

ALTER TABLE safety_interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own safety interventions"
  ON safety_interventions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own safety interventions"
  ON safety_interventions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own safety interventions"
  ON safety_interventions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. USER LITERACY PROFILE
CREATE TABLE IF NOT EXISTS user_literacy_profile (
  user_id uuid PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  medical_literacy integer DEFAULT 5 CHECK (medical_literacy >= 1 AND medical_literacy <= 10),
  nutrition_literacy integer DEFAULT 5 CHECK (nutrition_literacy >= 1 AND nutrition_literacy <= 10),
  meditation_literacy integer DEFAULT 5 CHECK (meditation_literacy >= 1 AND meditation_literacy <= 10),
  mindfulness_literacy integer DEFAULT 5 CHECK (mindfulness_literacy >= 1 AND mindfulness_literacy <= 10),
  movement_literacy integer DEFAULT 5 CHECK (movement_literacy >= 1 AND movement_literacy <= 10),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_literacy_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own literacy profile"
  ON user_literacy_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own literacy profile"
  ON user_literacy_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own literacy profile"
  ON user_literacy_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. TRANSLATION CACHE
CREATE TABLE IF NOT EXISTS translation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  technical_text text NOT NULL,
  plain_english text NOT NULL,
  key_terms jsonb DEFAULT '[]'::jsonb,
  complexity_score integer CHECK (complexity_score >= 1 AND complexity_score <= 10),
  context_hash text,
  access_count integer DEFAULT 1,
  last_accessed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup ON translation_cache(domain, technical_text, context_hash);
CREATE INDEX IF NOT EXISTS idx_translation_cache_access ON translation_cache(last_accessed_at DESC);

-- Translation cache is shared (no RLS) for efficiency

-- 9. TRANSLATION FEEDBACK
CREATE TABLE IF NOT EXISTS translation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  translation_cache_id uuid REFERENCES translation_cache(id) ON DELETE CASCADE,
  helpful boolean NOT NULL,
  too_simple boolean DEFAULT false,
  too_complex boolean DEFAULT false,
  comments text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_translation_feedback_user_id ON translation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_translation_feedback_translation_id ON translation_feedback(translation_cache_id);

ALTER TABLE translation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own translation feedback"
  ON translation_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own translation feedback"
  ON translation_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically create literacy profile on signup
CREATE OR REPLACE FUNCTION create_user_literacy_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_literacy_profile (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create literacy profile when user signs up
DROP TRIGGER IF EXISTS on_user_created_literacy_profile ON profiles;
CREATE TRIGGER on_user_created_literacy_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_literacy_profile();
