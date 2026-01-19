-- This migration is optional and kept for future extensibility
-- Currently, quota tracking is handled on the frontend
-- This table can be used in the future for analytics or backend quota enforcement

-- Note: You can skip applying this migration if you don't need backend usage tracking
-- The Edge Function will work without this table

-- Uncomment below if you want to create the table for future use:

/*
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('eyebrows', 'eyes', 'nose', 'lips', 'jawline', 'face_shape')),
  analysis_count INTEGER DEFAULT 0 NOT NULL CHECK (analysis_count >= 0),
  last_reset_date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(user_id, region, last_reset_date)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_region
  ON usage_tracking(user_id, region, last_reset_date);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_usage_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usage_tracking_updated_at_trigger
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_tracking_updated_at();

COMMENT ON TABLE usage_tracking IS 'Optional: Tracks OpenRouter API usage per user per region for analytics';
*/
