-- Migration: Switch from boolean free analysis to counter-based system (3 limit)
-- Purpose: Allow users 3 free analyses for a SPECIFIC won region

-- 1. Modify PROFILES table
-- Drop old boolean used column if it exists or we want to reset
ALTER TABLE profiles 
DROP COLUMN IF EXISTS free_analysis_used;

-- Ensure we have count and region columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS free_analysis_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_analysis_region TEXT;

-- 2. Modify DEVICE_USERS table
ALTER TABLE device_users
DROP COLUMN IF EXISTS free_analysis_used;

ALTER TABLE device_users
ADD COLUMN IF NOT EXISTS free_analysis_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_analysis_region TEXT;

-- 3. Update comments
COMMENT ON COLUMN profiles.free_analysis_count IS 'Number of free analyses used by the user (Limit: 3)';
COMMENT ON COLUMN profiles.free_analysis_region IS 'The specific region won by the user (e.g. nose)';
COMMENT ON COLUMN device_users.free_analysis_count IS 'Number of free analyses used on this device (Limit: 3)';
COMMENT ON COLUMN device_users.free_analysis_region IS 'The specific region won on this device';
