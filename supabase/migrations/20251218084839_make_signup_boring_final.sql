/*
  # Make Profile Creation Boring and Bulletproof

  ## Goal
  When a user signs up, silently create a profiles row. Always. No errors.

  ## How it works
  1. Trigger fires AFTER INSERT on auth.users
  2. Function runs as postgres (BYPASSRLS = true)
  3. Inserts only user_id into profiles
  4. ON CONFLICT DO NOTHING makes it idempotent
  5. RLS is bypassed automatically because postgres owns the function

  ## No Schema Changes
  This only updates the trigger function and trigger definition.
*/

-- Recreate the function with explicit, boring settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- System action: insert profile row for new user
  -- Only user_id needed; created_at/updated_at have defaults
  -- Idempotent: won't fail if row already exists
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Ensure function is owned by postgres (who has BYPASSRLS)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Recreate trigger to be absolutely explicit
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure postgres has necessary grants (should already exist)
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON public.profiles TO postgres;
