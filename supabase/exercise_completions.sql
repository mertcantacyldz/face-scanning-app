-- Exercise Completions Tracking Table
-- Stores day-based completion records for each exercise
-- One record per day per exercise (de-duplicated by user_id + exercise_id + completion_date)

CREATE TABLE IF NOT EXISTS exercise_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id TEXT NOT NULL,
  region_id TEXT NOT NULL,

  -- Date tracking (stored in UTC, but represents local day completion)
  completion_date DATE NOT NULL,
  month_year TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraint: one completion per day per exercise per user
  CONSTRAINT unique_user_exercise_day UNIQUE (user_id, exercise_id, completion_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_completions_user_id ON exercise_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_exercise_id ON exercise_completions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_month_year ON exercise_completions(month_year);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_user_month ON exercise_completions(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_exercise_completions_user_exercise ON exercise_completions(user_id, exercise_id);

-- Row Level Security (RLS)
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own exercise completions"
  ON exercise_completions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise completions"
  ON exercise_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise completions"
  ON exercise_completions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE exercise_completions IS 'Tracks daily exercise completions for monthly progress tracking';
COMMENT ON COLUMN exercise_completions.completion_date IS 'Calendar day (YYYY-MM-DD) when exercise was completed in user local timezone';
COMMENT ON COLUMN exercise_completions.month_year IS 'Format YYYY-MM for efficient monthly queries and grouping';
