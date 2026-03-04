-- AI Quota Enforcement Database Verification Script
-- Run this against your Supabase database to verify the system is correctly configured

\echo '================================================'
\echo 'AI QUOTA ENFORCEMENT DATABASE VERIFICATION'
\echo '================================================'
\echo ''

-- Test 1: Verify check_usage_limit() function exists and returns boolean
\echo '--- Test 1: Function Signature ---'
SELECT
  p.proname AS function_name,
  pg_catalog.pg_get_function_result(p.oid) AS return_type,
  pg_catalog.pg_get_function_arguments(p.oid) AS arguments
FROM pg_catalog.pg_proc p
WHERE p.proname = 'check_usage_limit';

\echo ''

-- Test 2: Verify subscription_tiers table has correct evaluation tier
\echo '--- Test 2: Evaluation Tier Configuration ---'
SELECT
  tier_id,
  tier_name,
  limits->>'ai_interactions_evaluation' AS ai_limit,
  limits
FROM subscription_tiers
WHERE tier_id = 'free_evaluation';

\echo ''

-- Test 3: Verify increment_usage() function exists
\echo '--- Test 3: Increment Usage Function ---'
SELECT
  p.proname AS function_name,
  pg_catalog.pg_get_function_result(p.oid) AS return_type
FROM pg_catalog.pg_proc p
WHERE p.proname = 'increment_usage';

\echo ''

-- Test 4: Sample test of check_usage_limit() with a test user
\echo '--- Test 4: Sample RPC Test (requires test user) ---'
\echo 'To test with a specific user, run:'
\echo 'SELECT check_usage_limit(''YOUR_USER_ID''::uuid, ''ai_interactions_evaluation'');'
\echo ''

-- Test 5: Verify usage_tracking table structure
\echo '--- Test 5: Usage Tracking Table Structure ---'
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'usage_tracking'
  AND column_name IN ('user_id', 'feature_key', 'usage_count', 'period_start')
ORDER BY ordinal_position;

\echo ''

-- Test 6: Check RLS policies on usage_tracking
\echo '--- Test 6: Row-Level Security Policies ---'
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'usage_tracking';

\echo ''

-- Test 7: Sample query to show current usage for a user (replace USER_ID)
\echo '--- Test 7: Sample Usage Query ---'
\echo 'To check usage for a specific user, run:'
\echo 'SELECT feature_key, usage_count, period_start'
\echo 'FROM usage_tracking'
\echo 'WHERE user_id = ''YOUR_USER_ID''::uuid'
\echo '  AND feature_key = ''ai_interactions_evaluation'';'
\echo ''

-- Test 8: Verify check_usage_limit() logic with different scenarios
\echo '--- Test 8: Function Logic Test Cases ---'
\echo ''
\echo 'Test Scenario A: User with 0/15 usage'
\echo 'Expected: check_usage_limit() returns TRUE'
\echo ''
\echo 'Test Scenario B: User with 12/15 usage'
\echo 'Expected: check_usage_limit() returns TRUE (12 < 15)'
\echo ''
\echo 'Test Scenario C: User with 15/15 usage'
\echo 'Expected: check_usage_limit() returns FALSE (15 >= 15)'
\echo ''
\echo 'Test Scenario D: User with 16/15 usage (over limit)'
\echo 'Expected: check_usage_limit() returns FALSE (16 >= 15)'
\echo ''

-- Test 9: Verify function behavior with edge cases
\echo '--- Test 9: Edge Case Verification ---'
\echo ''
\echo 'Edge Case 1: User has no subscription'
\echo 'Expected: check_usage_limit() returns FALSE (fail-closed)'
\echo ''
\echo 'Edge Case 2: User has no usage_tracking row'
\echo 'Expected: check_usage_limit() treats as 0 usage, returns TRUE if under limit'
\echo ''
\echo 'Edge Case 3: Invalid feature_key'
\echo 'Expected: check_usage_limit() returns FALSE (no limit configured)'
\echo ''

-- Test 10: Verify increment_usage() creates tracking row if missing
\echo '--- Test 10: Increment Usage Behavior ---'
\echo 'To test increment_usage(), run:'
\echo 'SELECT increment_usage(''YOUR_USER_ID''::uuid, ''ai_interactions_evaluation'');'
\echo ''

\echo '================================================'
\echo 'VERIFICATION COMPLETE'
\echo '================================================'
\echo ''
\echo 'Next Steps:'
\echo '1. Replace YOUR_USER_ID with an actual test user UUID'
\echo '2. Run the sample queries to verify quota enforcement'
\echo '3. Test with usage counts: 0, 12, 15, 16'
\echo '4. Verify client and server enforcement in integration tests'
\echo ''
