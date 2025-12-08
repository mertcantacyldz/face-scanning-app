-- Update profiles table for Premium/Free analysis tracking
-- Run this in Supabase SQL Editor

-- Add free analysis tracking columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS free_analysis_used BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS free_analysis_region TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS revenuecat_customer_id TEXT DEFAULT NULL;

-- Comment on columns
COMMENT ON COLUMN profiles.free_analysis_used IS 'Whether the user has used their free analysis (spin wheel)';
COMMENT ON COLUMN profiles.free_analysis_region IS 'Which region was analyzed for free (eyebrows, eyes, nose, lips, jawline, face_shape)';
COMMENT ON COLUMN profiles.is_premium IS 'Premium status (from RevenueCat webhook or admin override)';
COMMENT ON COLUMN profiles.premium_expires_at IS 'Premium subscription expiration date';
COMMENT ON COLUMN profiles.revenuecat_customer_id IS 'RevenueCat customer ID for webhook sync';
