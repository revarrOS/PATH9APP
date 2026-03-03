-- ============================================================================
-- ONE-TIME HISTORICAL DATA NORMALIZATION SCRIPT
-- ============================================================================
-- Date: 2026-02-01
-- Purpose: Correct scale errors in blood test data entered before
--          SMART normalization was implemented
-- Scope: Single user's 6 historical tests (leaves Jan 16, 2026 untouched)
-- Status: READY FOR EXECUTION
-- ============================================================================

-- BEFORE STATE SUMMARY:
-- - 5 tests (May-Nov 2025): HGB, MCHC have 10× error, RDW-CV has ÷100 error
-- - 1 test (Dec 11, 2025): HCT has ÷100 error, MCHC needs recalculation
-- - 1 test (Jan 16, 2026): Already correct, DO NOT TOUCH

-- ============================================================================
-- CORRECTION SCRIPT (wrapped in transaction)
-- ============================================================================

BEGIN;

-- Step 1: Correct HGB (Hemoglobin) - Divide by 10 where > 50 g/dL
-- Affects: 5 tests from May-Nov 2025
UPDATE blood_markers
SET
  value = value / 10,
  updated_at = now()
WHERE marker_name = 'HGB'
  AND value > 50
  AND test_id IN (
    SELECT id FROM blood_tests
    WHERE test_date < '2025-12-01'
  );

-- Step 2: Correct MCHC (Mean Corpuscular Hb Concentration) - Divide by 10 where > 50 g/dL
-- Affects: 5 tests from May-Nov 2025
UPDATE blood_markers
SET
  value = value / 10,
  updated_at = now()
WHERE marker_name = 'MCHC'
  AND value > 50
  AND test_id IN (
    SELECT id FROM blood_tests
    WHERE test_date < '2025-12-01'
  );

-- Step 3: Correct RDW-CV (Red Cell Distribution Width) - Multiply by 100 where < 1%
-- Affects: 5 tests from May-Nov 2025
UPDATE blood_markers
SET
  value = value * 100,
  updated_at = now()
WHERE marker_name = 'RDW-CV'
  AND value < 1
  AND test_id IN (
    SELECT id FROM blood_tests
    WHERE test_date < '2025-12-01'
  );

-- Step 4: Correct HCT (Hematocrit) for Dec 11 test - Multiply by 100 where < 1%
-- Affects: 1 test (Dec 11, 2025)
UPDATE blood_markers
SET
  value = value * 100,
  updated_at = now()
WHERE marker_name = 'HCT'
  AND value < 1
  AND test_id IN (
    SELECT id FROM blood_tests
    WHERE test_date = '2025-12-11'
  );

-- Step 5: Recalculate MCHC for Dec 11 test using corrected HGB and HCT
-- MCHC = (HGB / HCT) × 100
-- Affects: 1 test (Dec 11, 2025)
UPDATE blood_markers bm_mchc
SET
  value = (
    SELECT (bm_hgb.value / (bm_hct.value / 100))
    FROM blood_markers bm_hgb
    JOIN blood_markers bm_hct ON bm_hgb.test_id = bm_hct.test_id
    WHERE bm_hgb.test_id = bm_mchc.test_id
      AND bm_hgb.marker_name = 'HGB'
      AND bm_hct.marker_name = 'HCT'
  ),
  updated_at = now()
WHERE bm_mchc.marker_name = 'MCHC'
  AND bm_mchc.test_id IN (
    SELECT id FROM blood_tests
    WHERE test_date = '2025-12-11'
  );

-- ============================================================================
-- VERIFICATION QUERY - Run after commit to verify corrections
-- ============================================================================
-- This query will show all corrected values and confirm no anomalies remain
-- Run this separately after committing the transaction

/*
SELECT
  bt.test_date,
  bm.marker_name,
  bm.value,
  bm.unit,
  CASE
    WHEN bm.marker_name = 'HGB' AND (bm.value < 10 OR bm.value > 20) THEN '⚠️ OUT OF RANGE'
    WHEN bm.marker_name = 'MCHC' AND (bm.value < 30 OR bm.value > 37) THEN '⚠️ OUT OF RANGE'
    WHEN bm.marker_name = 'RDW-CV' AND (bm.value < 10 OR bm.value > 20) THEN '⚠️ OUT OF RANGE'
    WHEN bm.marker_name = 'HCT' AND (bm.value < 30 OR bm.value > 55) THEN '⚠️ OUT OF RANGE'
    ELSE '✅ OK'
  END as status
FROM blood_tests bt
JOIN blood_markers bm ON bt.id = bm.test_id
WHERE bm.marker_name IN ('HGB', 'MCHC', 'RDW-CV', 'HCT')
ORDER BY bt.test_date DESC, bm.marker_name;
*/

-- ============================================================================
-- CROSS-MARKER VALIDATION - Verify MCHC = (HGB / HCT) × 100
-- ============================================================================
-- This query validates that the relationship holds after correction

/*
SELECT
  bt.test_date,
  hgb.value as hgb,
  hct.value as hct,
  mchc.value as mchc_stored,
  ROUND((hgb.value / (hct.value / 100))::numeric, 1) as mchc_calculated,
  CASE
    WHEN ABS(mchc.value - (hgb.value / (hct.value / 100))) < 0.5 THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END as validation
FROM blood_tests bt
JOIN blood_markers hgb ON bt.id = hgb.test_id AND hgb.marker_name = 'HGB'
JOIN blood_markers hct ON bt.id = hct.test_id AND hct.marker_name = 'HCT'
JOIN blood_markers mchc ON bt.id = mchc.test_id AND mchc.marker_name = 'MCHC'
ORDER BY bt.test_date DESC;
*/

COMMIT;

-- ============================================================================
-- CHANGES SUMMARY (for verification):
-- ============================================================================
-- HGB corrections: 5 records (÷10)
-- MCHC corrections: 6 records (5 ÷10, 1 recalculated)
-- RDW-CV corrections: 5 records (×100)
-- HCT corrections: 1 record (×100)
-- Total affected: 17 marker values across 6 tests
-- Untouched: Jan 16, 2026 test (already correct)
-- ============================================================================
