-- =====================================================
-- Onboarding Feature Migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add onboarding columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add constraint for gender values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'valid_gender'
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT valid_gender CHECK (
      gender IS NULL OR gender IN ('female', 'male', 'other')
    );
  END IF;
END $$;

-- Create index for onboarding queries (performance)
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed
  ON public.profiles(onboarding_completed);

-- Add comments
COMMENT ON COLUMN public.profiles.gender IS 'User gender: female, male, other, or NULL';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed initial onboarding flow';

-- =====================================================
-- Update existing profiles to reflect onboarding status
-- =====================================================

-- Users with non-default names have implicitly "completed" onboarding
UPDATE public.profiles
SET onboarding_completed = TRUE
WHERE full_name != 'Kullanıcı' AND full_name IS NOT NULL;

-- Anonymous users with default name need onboarding
UPDATE public.profiles
SET onboarding_completed = FALSE
WHERE full_name = 'Kullanıcı' OR full_name IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed THEN 1 END) as completed,
  COUNT(CASE WHEN NOT onboarding_completed THEN 1 END) as needs_onboarding
FROM public.profiles;
