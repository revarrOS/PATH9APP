/*
  # Fix handle_new_user() Function - Remove Non-Existent Email Column

  ## Issue
  The trigger function was trying to insert into an 'email' column that doesn't exist
  in the profiles table, causing signup failures.

  ## Solution
  1. Update function to only insert user_id (created_at/updated_at have defaults)
  2. Make it idempotent with ON CONFLICT DO NOTHING
  3. Maintain SECURITY DEFINER and safe search_path
  4. Ensure function owner can bypass RLS

  ## Changes
  - Remove email, created_at, updated_at from INSERT (use defaults)
  - Add ON CONFLICT (user_id) DO NOTHING for idempotency
  - Keep SECURITY DEFINER for RLS bypass
  - Keep search_path = 'public' for security
*/

-- Update the trigger function to match actual schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert only user_id, let created_at and updated_at use their defaults
  -- Use ON CONFLICT for idempotency in case trigger fires multiple times
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Ensure trigger exists (should already exist, but make it explicit)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions for the function to bypass RLS
-- The function runs as SECURITY DEFINER with the owner's privileges
GRANT USAGE ON SCHEMA public TO postgres;
GRANT INSERT ON public.profiles TO postgres;
