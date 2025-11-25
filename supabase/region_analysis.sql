-- Region Analysis Table
-- Stores AI analysis results for each face region

CREATE TABLE IF NOT EXISTS region_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  face_analysis_id UUID REFERENCES face_analysis(id) ON DELETE CASCADE,
  region_id TEXT NOT NULL, -- 'eyebrows', 'eyes', 'nose', 'lips', 'jawline', 'face_shape'
  raw_response JSONB NOT NULL, -- Full AI response for display
  metrics JSONB NOT NULL, -- Extracted metrics for comparison
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_region_analysis_user_id ON region_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_region_analysis_region_id ON region_analysis(region_id);
CREATE INDEX IF NOT EXISTS idx_region_analysis_created_at ON region_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_region_analysis_user_region ON region_analysis(user_id, region_id);

-- Row Level Security (RLS)
ALTER TABLE region_analysis ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own analysis
CREATE POLICY "Users can view own region analysis"
  ON region_analysis
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analysis
CREATE POLICY "Users can insert own region analysis"
  ON region_analysis
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own analysis
CREATE POLICY "Users can delete own region analysis"
  ON region_analysis
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comment on table
COMMENT ON TABLE region_analysis IS 'Stores AI analysis results for each face region with full response and extracted metrics';
COMMENT ON COLUMN region_analysis.raw_response IS 'Complete AI JSON response for displaying to user';
COMMENT ON COLUMN region_analysis.metrics IS 'Extracted metrics for progress comparison (region-specific structure)';
