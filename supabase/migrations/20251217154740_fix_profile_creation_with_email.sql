/*
  # Fix Profile Creation - Add Missing Email Field

  ## Issue
  The handle_new_user() trigger was failing because:
  1. The email column (NOT NULL) was not being inserted
  2. RLS policies were blocking the trigger function

  ## Solution
  1. Update trigger function to insert email from NEW.email
  2. Make trigger function explicitly set search_path for security
  3. Grant necessary permissions for the function to work

  ## Changes
  - Update handle_new_user() to insert email
  - Set search_path to prevent security issues
  - Maintain SECURITY DEFINER for RLS bypass
*/

-- Update the trigger function to include email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
