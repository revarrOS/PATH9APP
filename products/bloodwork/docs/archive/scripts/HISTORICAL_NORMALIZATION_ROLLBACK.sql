-- ============================================================================
-- ROLLBACK SCRIPT FOR HISTORICAL DATA NORMALIZATION
-- ============================================================================
-- Date: 2026-02-01
-- Purpose: Revert scale corrections if something goes wrong
-- Use: Only execute this if you need to undo the normalization corrections
-- ============================================================================

-- WARNING: This will restore the BEFORE state with scale errors
-- Only use this if the correction script caused issues

BEGIN;

-- Step 1: Restore HGB (multiply by 10 to restore original incorrect values)
-- Affects: 5 tests that were corrected (HGB values now in 12-14 range)
UPDATE blood_markers
SET
  value = value * 10,
  updated_at = now()
WHERE marker_name = 'HGB'
  AND value >= 12
  AND value <= 14
  AND test_id IN (
    SELECT id FROM blood_tests
    WHERE test_date < '2025-12-01'
  );

-- Step 2: Restore MCHC (multiply by 10 to restore original incorrect values)
-- Affects: 5 tests that were corrected (MCHC values now in 32-34 range)
UPDATE blood_markers
SET
  value = value * 10,
  updated_at = now()
WHERE marker_name = 'MCHC'
  AND value >= 32
  AND value <= 36
  AND test_id IN (
    SELECT id FROM blood_tests
    WHERE test_date < '2025-12-01'
  );

-- Step 3: Restore RDW-CV (divide by 100 to restore original incorrect values)
-- Affects: 5 tests that were corrected (RDW-CV values now in 14-16 range)
UPDATE blood_markers
SET
  value = value / 100,
  updated_at = now()
WHERE marker_name = 'RDW-CV'
  AND value >= 14
  AND value <= 16
  AND test_id IN (
    SELECT id FROM blood_tests
    WHERE test_date < '2025-12-01'
  );

-- Step 4: Restore HCT for Dec 11 test (divide by 100 to restore decimal format)
-- Affects: 1 test (Dec 11, 2025)
UPDATE blood_markers
SET
  value = value / 100,
  updated_at = now()
WHERE marker_name = 'HCT'
  AND value >= 39
  AND value <= 40
  AND test_id IN (
    SELECT id FROM blood_tests
    WHERE test_date = '2025-12-11'
  );

-- Step 5: Restore Dec 11 MCHC to original erroneous value (27.6)
-- Affects: 1 test (Dec 11, 2025)
UPDATE blood_markers
SET
  value = 27.6,
  updated_at = now()
WHERE marker_name = 'MCHC'
  AND test_id IN (
    SELECT id FROM blood_tests
    WHERE test_date = '2025-12-11'
  );

COMMIT;

-- ============================================================================
-- VERIFICATION AFTER ROLLBACK
-- ============================================================================
-- Run this to verify rollback restored the original (incorrect) values

/*
SELECT
  bt.test_date,
  bm.marker_name,
  bm.value,
  CASE
    WHEN bm.marker_name = 'HGB' AND bm.value > 50 THEN '✅ ROLLED BACK (10× error restored)'
    WHEN bm.marker_name = 'MCHC' AND bm.value > 50 THEN '✅ ROLLED BACK (10× error restored)'
    WHEN bm.marker_name = 'RDW-CV' AND bm.value < 1 THEN '✅ ROLLED BACK (÷100 error restored)'
    WHEN bm.marker_name = 'HCT' AND bt.test_date = '2025-12-11' AND bm.value < 1 THEN '✅ ROLLED BACK'
    ELSE 'Not rolled back'
  END as rollback_status
FROM blood_tests bt
JOIN blood_markers bm ON bt.id = bm.test_id
WHERE bm.marker_name IN ('HGB', 'MCHC', 'RDW-CV', 'HCT')
ORDER BY bt.test_date DESC, bm.marker_name;
*/

-- ============================================================================
-- Note: This rollback script is provided for safety only
-- Ideally, you won't need to use it
-- ============================================================================
