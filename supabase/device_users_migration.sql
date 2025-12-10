-- =====================================================
-- Device-Based Authentication Migration - INCREMENTAL UPDATE
-- Run this in Supabase SQL Editor
-- =====================================================
--
-- NOTE: This migration is safe to run even if some parts already exist.
-- It uses IF NOT EXISTS and conditional checks to avoid errors.
--
-- =====================================================

-- =====================================================
-- STEP 1: Verify/Update profiles.email nullable status
-- =====================================================

-- profiles.email is already nullable in your schema - SKIP THIS STEP
-- Just add a comment for documentation
COMMENT ON COLUMN public.profiles.email IS 'Email address - NULL for anonymous users, unique for authenticated users';

-- =====================================================
-- STEP 2: Verify device_users table exists
-- =====================================================

-- Table already exists in your schema - SKIP CREATION
-- Just verify it has all required constraints

-- Add valid_oauth constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_oauth'
    AND conrelid = 'public.device_users'::regclass
  ) THEN
    ALTER TABLE public.device_users
    ADD CONSTRAINT valid_oauth CHECK (
      (oauth_provider IS NULL AND oauth_email IS NULL) OR
      (oauth_provider IS NOT NULL AND oauth_email IS NOT NULL)
    );
  END IF;
END $$;

-- Verify ON DELETE CASCADE for foreign key
DO $$
BEGIN
  -- Drop old FK if exists without CASCADE
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'device_users_supabase_user_id_fkey'
    AND confdeltype != 'c'  -- 'c' means CASCADE
  ) THEN
    ALTER TABLE public.device_users
    DROP CONSTRAINT device_users_supabase_user_id_fkey;

    ALTER TABLE public.device_users
    ADD CONSTRAINT device_users_supabase_user_id_fkey
    FOREIGN KEY (supabase_user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for faster queries (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_device_users_device_id
  ON public.device_users(device_id);

CREATE INDEX IF NOT EXISTS idx_device_users_supabase_user_id
  ON public.device_users(supabase_user_id);

CREATE INDEX IF NOT EXISTS idx_device_users_oauth_email
  ON public.device_users(oauth_email);

-- =====================================================
-- STEP 3: Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS if not already enabled
ALTER TABLE public.device_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (using IF NOT EXISTS pattern with DO blocks)

-- Policy: Users can view their own device records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'device_users'
    AND policyname = 'Users can view own device records'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own device records"
      ON public.device_users
      FOR SELECT
      USING (supabase_user_id = auth.uid())';
  END IF;
END $$;

-- Policy: Users can insert their own device records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'device_users'
    AND policyname = 'Users can insert own device records'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert own device records"
      ON public.device_users
      FOR INSERT
      WITH CHECK (supabase_user_id = auth.uid())';
  END IF;
END $$;

-- Policy: Users can update their own device records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'device_users'
    AND policyname = 'Users can update own device records'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own device records"
      ON public.device_users
      FOR UPDATE
      USING (supabase_user_id = auth.uid())
      WITH CHECK (supabase_user_id = auth.uid())';
  END IF;
END $$;

-- Add table comment
COMMENT ON TABLE public.device_users IS 'Maps device IDs to Supabase user accounts for device-based authentication';

-- =====================================================
-- STEP 4: Update profiles trigger (for anonymous users)
-- =====================================================

-- Create or replace function to auto-create profile for new users (including anonymous)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email, -- Will be NULL for anonymous users
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kullanıcı') -- Default Turkish name
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 5: Add RLS policy for anonymous users on profiles
-- =====================================================

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Anonymous users can create profile'
  ) THEN
    EXECUTE 'CREATE POLICY "Anonymous users can create profile"
      ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES (Run after migration)
-- =====================================================

-- Check device_users RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'device_users'
ORDER BY policyname;

-- Check profiles RLS policy for anonymous users
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles' AND policyname LIKE '%nonymous%'
ORDER BY policyname;

-- Check if trigger exists
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- =====================================================
-- MIGRATION COMPLETE! ✅
-- =====================================================
--
-- What was done:
-- 1. ✅ Verified profiles.email is nullable (already was)
-- 2. ✅ Verified device_users table exists (already did)
-- 3. ✅ Added missing constraints and indexes
-- 4. ✅ Created RLS policies for device_users
-- 5. ✅ Created/updated trigger for automatic profile creation
-- 6. ✅ Added RLS policy for anonymous users on profiles
--
-- Next steps:
-- 1. Enable "Allow anonymous sign-ins" in Supabase Dashboard
--    (Authentication → Settings → User Signups)
-- 2. Test the app with: npx expo start --clear
-- 3. Check logs for "Anonymous user created"
--
-- =====================================================
