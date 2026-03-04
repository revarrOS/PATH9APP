/*
  # Bloodwork Management Product - Database Schema

  ## Purpose
  Support manual entry and storage of blood test results with strict user isolation.

  ## Tables Created

  ### `blood_tests`
  Stores individual blood test records with metadata.
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `test_date` (date) - When the blood test was performed
  - `location` (text, nullable) - Lab or facility name
  - `notes` (text, nullable) - User notes about the test
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `blood_markers`
  Stores individual marker values for each test (WBC, HGB, etc.).
  - `id` (uuid, primary key)
  - `test_id` (uuid, foreign key to blood_tests)
  - `marker_name` (text) - e.g., "WBC", "HGB", "PLT"
  - `value` (numeric) - The measured value
  - `unit` (text) - e.g., "10^9/L", "g/dL", "%"
  - `reference_range_low` (numeric, nullable) - Lower bound of normal range
  - `reference_range_high` (numeric, nullable) - Upper bound of normal range
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own tests and markers
  - Full CRUD permissions for owned records
  - Cascade delete: markers deleted when parent test is deleted

  ## Data Isolation
  - No dependencies on other Path9 product tables
  - Can be dropped without affecting other products
  - User-scoped via RLS (no cross-user data access)
*/

-- Create blood_tests table
CREATE TABLE IF NOT EXISTS blood_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date date NOT NULL,
  location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blood_markers table
CREATE TABLE IF NOT EXISTS blood_markers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES blood_tests(id) ON DELETE CASCADE,
  marker_name text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  reference_range_low numeric,
  reference_range_high numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blood_tests_user_id ON blood_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_blood_tests_test_date ON blood_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_blood_markers_test_id ON blood_markers(test_id);
CREATE INDEX IF NOT EXISTS idx_blood_markers_marker_name ON blood_markers(marker_name);

-- Enable Row Level Security
ALTER TABLE blood_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_markers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blood_tests

-- Users can view their own tests
CREATE POLICY "Users can view own blood tests"
  ON blood_tests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own tests
CREATE POLICY "Users can insert own blood tests"
  ON blood_tests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tests
CREATE POLICY "Users can update own blood tests"
  ON blood_tests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tests
CREATE POLICY "Users can delete own blood tests"
  ON blood_tests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for blood_markers

-- Users can view markers for their own tests
CREATE POLICY "Users can view own blood markers"
  ON blood_markers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blood_tests
      WHERE blood_tests.id = blood_markers.test_id
      AND blood_tests.user_id = auth.uid()
    )
  );

-- Users can insert markers for their own tests
CREATE POLICY "Users can insert own blood markers"
  ON blood_markers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blood_tests
      WHERE blood_tests.id = blood_markers.test_id
      AND blood_tests.user_id = auth.uid()
    )
  );

-- Users can update markers for their own tests
CREATE POLICY "Users can update own blood markers"
  ON blood_markers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blood_tests
      WHERE blood_tests.id = blood_markers.test_id
      AND blood_tests.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blood_tests
      WHERE blood_tests.id = blood_markers.test_id
      AND blood_tests.user_id = auth.uid()
    )
  );

-- Users can delete markers for their own tests
CREATE POLICY "Users can delete own blood markers"
  ON blood_markers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blood_tests
      WHERE blood_tests.id = blood_markers.test_id
      AND blood_tests.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_blood_tests_updated_at
  BEFORE UPDATE ON blood_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blood_markers_updated_at
  BEFORE UPDATE ON blood_markers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
