-- Update profiles table for Premium/Free analysis tracking
-- Run this in Supabase SQL Editor

-- Add free analysis tracking columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS free_analysis_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS free_analysis_region TEXT DEFAULT NULL;

-- Comment on columns
COMMENT ON COLUMN profiles.free_analysis_used IS 'Whether the user has used their free analysis (spin wheel)';
COMMENT ON COLUMN profiles.free_analysis_region IS 'Which region was analyzed for free (eyebrows, eyes, nose, lips, jawline, face_shape)';
