-- =====================================================
-- Add device_id to face_analysis table
-- This allows users to access their analysis history
-- even when switching devices or creating new anonymous users
-- =====================================================

-- Step 1: Add device_id column
ALTER TABLE face_analysis
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Step 2: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_face_analysis_device_id
  ON face_analysis(device_id);

-- Step 3: Backfill device_id from user metadata
-- (For existing records where user created analysis with device_id in metadata)
UPDATE face_analysis fa
SET device_id = (
  SELECT raw_user_meta_data->>'device_id'
  FROM auth.users
  WHERE id = fa.user_id
)
WHERE device_id IS NULL
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = fa.user_id
    AND raw_user_meta_data->>'device_id' IS NOT NULL
  );

-- Step 4: Add comment for documentation
COMMENT ON COLUMN face_analysis.device_id IS
  'Device ID from which this analysis was performed. Allows cross-user access to analysis history when device switches anonymous users.';

-- =====================================================
-- Verification Query
-- =====================================================

-- Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'face_analysis'
  AND column_name = 'device_id';

-- Check how many records have device_id
SELECT
  COUNT(*) as total_records,
  COUNT(device_id) as records_with_device_id,
  COUNT(*) - COUNT(device_id) as records_without_device_id
FROM face_analysis;

-- =====================================================
-- DONE! ✅
-- =====================================================
