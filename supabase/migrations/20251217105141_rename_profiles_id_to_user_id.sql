/*
  # Rename profiles.id to profiles.user_id

  ## Overview
  Update the profiles table primary key column name from `id` to `user_id`
  to better reflect its purpose and match naming conventions.

  ## Changes
  
  ### 1. Column Rename
  - Rename `profiles.id` → `profiles.user_id`
  - Maintain all constraints and foreign key relationships
  
  ### 2. RLS Policy Updates
  - Update all policies to reference `user_id` instead of `id`
  - Maintain same security guarantees (auth.uid() = user_id)
  
  ### 3. Trigger Function Updates
  - Update `handle_new_user()` to insert `user_id` instead of `id`
  
  ## Important Notes
  - Non-breaking: Column rename preserves data and relationships
  - All RLS policies recreated with new column name
  - Existing test data preserved
  - Foreign key constraint maintained
*/

-- Step 1: Drop existing RLS policies (will be recreated with new column name)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Step 2: Rename the column
ALTER TABLE profiles RENAME COLUMN id TO user_id;

-- Step 3: Recreate RLS policies with new column name
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 4: Update trigger function to use user_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (user_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;