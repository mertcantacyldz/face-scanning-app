-- Run this in your Supabase SQL Editor to add the required column for AI consent tracking

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS ai_consent_given BOOLEAN DEFAULT FALSE;

-- Optional: Comment on the column for documentation
COMMENT ON COLUMN profiles.ai_consent_given IS 'Tracks whether the user has consented to AI data processing for face analysis.';
