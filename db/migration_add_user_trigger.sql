-- Migration: Add trigger to auto-create profiles and backfill existing users
-- This fixes the issue where users exist without profiles, causing foreign key violations

-- Step 1: Create a helper function to get auth user data
CREATE OR REPLACE FUNCTION public.get_auth_user(user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT 
    u.id,
    u.email,
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      split_part(u.email, '@', 1),
      'Unknown User'
    ) as full_name
  INTO user_record
  FROM auth.users u
  WHERE u.id = user_id;
  
  IF user_record IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY SELECT user_record.id, user_record.email, user_record.full_name;
END;
$$;

-- Step 2: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_auth_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_user(uuid) TO anon;

-- Step 3: Create the trigger on auth.users to auto-create profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Backfill missing profiles for existing users who don't have one
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  id, 
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    split_part(email, '@', 1),
    'Unknown User'
  ) as full_name
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Note: Run this migration on your Supabase database to:
-- 1. Add a helper function to query auth.users safely
-- 2. Add the trigger so all new users automatically get a profile
-- 3. Backfill profiles for any existing users who don't have one

