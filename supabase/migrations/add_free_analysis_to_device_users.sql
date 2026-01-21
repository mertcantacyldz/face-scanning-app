-- Migration: Add free_analysis columns to device_users table
-- Purpose: Track free analysis usage at device level (not just user level)
-- This prevents users from getting multiple free analyses by creating new accounts
-- or when session expires and new anonymous user is created

-- Add columns to device_users table
ALTER TABLE device_users
ADD COLUMN IF NOT EXISTS free_analysis_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS free_analysis_region TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_users_free_analysis
  ON device_users(device_id, free_analysis_used);

-- Add comment for documentation
COMMENT ON COLUMN device_users.free_analysis_used IS 'Whether the free analysis has been used on this device';
COMMENT ON COLUMN device_users.free_analysis_region IS 'The region that was analyzed with the free analysis';
