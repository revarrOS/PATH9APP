# AI Quota Enforcement Integration Test Guide

## Overview

This guide provides step-by-step instructions for manually testing the AI quota enforcement system across all three domains (Bloodwork, Condition, Nutrition).

---

## Prerequisites

1. **Test User Account**
   - Fresh user account on `free_evaluation` tier
   - User ID and access token available

2. **Database Access**
   - Ability to run SQL queries against Supabase database
   - Permission to update `usage_tracking` table

3. **Client Access**
   - Expo app running locally or on device
   - Network tab open in browser (for web) or React Native Debugger

4. **Tools**
   - `curl` or Postman for direct API testing
   - `psql` or Supabase Studio for database queries

---

## Test Scenario A: Fresh User (0/15)

### Setup

```sql
-- Reset usage to 0 for test user
DELETE FROM usage_tracking
WHERE user_id = 'YOUR_USER_ID'
  AND feature_key = 'ai_interactions_evaluation';
```

### Test Steps

#### 1. Verify Initial State (Database)

```sql
-- Should return no rows (or usage_count = 0)
SELECT feature_key, usage_count
FROM usage_tracking
WHERE user_id = 'YOUR_USER_ID'
  AND feature_key = 'ai_interactions_evaluation';
```

#### 2. Check Quota Function (Database)

```sql
-- Should return TRUE (under limit)
SELECT check_usage_limit('YOUR_USER_ID'::uuid, 'ai_interactions_evaluation');
```

#### 3. Test Client UI

**Bloodwork Chat:**
1. Open app → Medical → Bloodwork → Chat
2. Verify banner shows "0 of 15 AI interactions used"
3. Verify banner color is neutral (not warning)
4. Type a message: "What is hemoglobin?"
5. Verify send button is enabled
6. Click send

**Expected Behavior:**
- ✅ Message sends successfully
- ✅ AI responds with helpful information
- ✅ Banner updates to "1 of 15 AI interactions used"
- ✅ No upgrade modal appears

#### 4. Verify Usage Increment (Database)

```sql
-- Should return usage_count = 1
SELECT usage_count
FROM usage_tracking
WHERE user_id = 'YOUR_USER_ID'
  AND feature_key = 'ai_interactions_evaluation';
```

#### 5. Repeat for Other Domains

**Condition Chat:**
1. Navigate to Medical → Condition → Chat
2. Send message: "What does staging mean?"
3. Verify usage increments to 2

**Nutrition Chat:**
1. Navigate to Nutrition → Chat
2. Send message: "What foods help with fatigue?"
3. Verify usage increments to 3

### Pass Criteria

- ✅ Initial usage is 0
- ✅ check_usage_limit() returns TRUE
- ✅ All three AI chats accept messages
- ✅ Each message increments usage by 1
- ✅ Banner updates in real-time
- ✅ No errors or upgrade prompts

---

## Test Scenario B: Warning Threshold (12/15)

### Setup

```sql
-- Set usage to 12
INSERT INTO usage_tracking (user_id, feature_key, usage_count, period_start)
VALUES (
  'YOUR_USER_ID',
  'ai_interactions_evaluation',
  12,
  date_trunc('month', now())
)
ON CONFLICT (user_id, feature_key, period_start)
DO UPDATE SET usage_count = 12;
```

### Test Steps

#### 1. Verify Database State

```sql
-- Should return TRUE (12 < 15)
SELECT check_usage_limit('YOUR_USER_ID'::uuid, 'ai_interactions_evaluation');
```

#### 2. Test Client UI

**Bloodwork Chat:**
1. Open chat interface
2. Verify banner shows "12 of 15 AI interactions used"
3. Verify banner color is **amber/warning** (>80% threshold)
4. Verify "Upgrade to unlock unlimited AI" message visible
5. Type and send a message
6. Verify AI responds normally
7. Verify banner updates to "13 of 15"

#### 3. Progress Bar Verification

- Banner should show progress bar
- Bar should be ~87% filled (13/15)
- Color should be amber/warning

### Pass Criteria

- ✅ check_usage_limit() returns TRUE
- ✅ Warning banner visible with correct color
- ✅ AI still functions normally
- ✅ Usage increments correctly
- ✅ No blocking behavior

---

## Test Scenario C: Hard Limit - Client Block (15/15)

### Setup

```sql
-- Set usage to 15 (at limit)
UPDATE usage_tracking
SET usage_count = 15
WHERE user_id = 'YOUR_USER_ID'
  AND feature_key = 'ai_interactions_evaluation';
```

### Test Steps

#### 1. Verify Database State

```sql
-- Should return FALSE (15 >= 15, NOT less than)
SELECT check_usage_limit('YOUR_USER_ID'::uuid, 'ai_interactions_evaluation');
```

#### 2. Test Client Blocking Behavior

**Bloodwork Chat:**
1. Open chat interface
2. Verify banner shows "15 of 15 AI interactions used"
3. Verify banner color is red/error or max state
4. Type a message in input field
5. Click send button

**Expected Behavior:**
- ✅ Input field allows typing (not disabled)
- ✅ On send click, **upgrade modal appears IMMEDIATELY**
- ✅ **NO API call is made** (verify in network tab)
- ✅ Message is NOT added to conversation

#### 3. Upgrade Modal Verification

**Modal should display:**
- Title: "Upgrade to Continue"
- Message: "You've used 15 of 15 evaluation AI interactions"
- Button: "View Plans" or similar
- Close button (X)

**Actions:**
- Click "View Plans" → should navigate to pricing page
- Click close (X) → modal dismisses, no API call made

#### 4. Network Tab Verification

**Open browser dev tools or React Native Debugger:**
1. Monitor network requests
2. Click send in AI chat
3. Verify NO request to `/functions/v1/bloodwork-ai-respond`
4. Verify NO request to `/functions/v1/orchestrate`

### Pass Criteria

- ✅ check_usage_limit() returns FALSE
- ✅ Client shows "15 of 15" in banner
- ✅ Send button triggers upgrade modal
- ✅ NO API calls made when blocked
- ✅ Upgrade modal displays correct message
- ✅ Modal navigation works

---

## Test Scenario D: Hard Limit - Server Block (15/15)

### Setup

Same as Scenario C (usage at 15/15)

### Test Steps

#### 1. Direct API Call (Bypassing Client)

**Using curl:**

```bash
# Replace with your actual values
SUPABASE_URL="https://your-project.supabase.co"
TOKEN="your-jwt-token"

# Test bloodwork endpoint
curl -X POST "$SUPABASE_URL/functions/v1/bloodwork-ai-respond" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentMessage": "Bypass attempt"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Response:**
```json
{
  "error": "AI interaction limit reached",
  "code": "EVAL_LIMIT_REACHED"
}
```

**Expected HTTP Status:** `402 Payment Required`

#### 2. Test All Three Endpoints

**Condition:**
```bash
curl -X POST "$SUPABASE_URL/functions/v1/condition-ai-respond" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentMessage": "Test"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

**Nutrition:**
```bash
curl -X POST "$SUPABASE_URL/functions/v1/nutrition-ai-respond" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentMessage": "Test"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

#### 3. Verify No Usage Increment

```sql
-- Should still be 15 (no increment on rejected requests)
SELECT usage_count
FROM usage_tracking
WHERE user_id = 'YOUR_USER_ID'
  AND feature_key = 'ai_interactions_evaluation';
```

### Pass Criteria

- ✅ All three endpoints return 402
- ✅ Response contains `code: "EVAL_LIMIT_REACHED"`
- ✅ No AI response in body
- ✅ Usage count remains 15 (no increment)
- ✅ Consistent behavior across all domains

---

## Test Scenario E: Fail-Closed Behavior

### Purpose
Verify system denies access when RPC call fails (network issue, database error, etc.)

### Test Steps

#### 1. Simulate RPC Failure (Advanced)

**Option A: Temporary database modification**
```sql
-- Temporarily break the function (backup first!)
-- DO NOT RUN IN PRODUCTION
ALTER FUNCTION check_usage_limit RENAME TO check_usage_limit_backup;
```

**Option B: Use invalid feature key**
```bash
# This should trigger the NULL limit path
curl -X POST "$SUPABASE_URL/functions/v1/bloodwork-ai-respond" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentMessage": "Test with broken RPC"}'
```

#### 2. Verify Code Behavior (Code Review)

**Server code at lines 88-98:**
```typescript
const { data: limitCheck, error: limitError } = await supabaseClient.rpc('check_usage_limit', {
  p_user_id: user.id,
  p_feature_key: 'ai_interactions_evaluation'
});

if (limitError || !limitCheck) {  // ← Fail-closed logic
  return new Response(
    JSON.stringify({ error: "AI interaction limit reached", code: "EVAL_LIMIT_REACHED" }),
    { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

**Analysis:**
- `limitError !== null` → Deny (402)
- `limitCheck === null` → Deny (402) via `!limitCheck`
- `limitCheck === false` → Deny (402)
- `limitCheck === true` → Allow

#### 3. Restore Function (if modified)
```sql
ALTER FUNCTION check_usage_limit_backup RENAME TO check_usage_limit;
```

### Pass Criteria

- ✅ RPC error triggers 402 response (fail-closed)
- ✅ NULL result triggers 402 response (fail-closed)
- ✅ No accidental "allow" on error
- ✅ Code review confirms all error paths deny access

---

## Regression Testing

### After Implementation, Verify:

#### 1. Existing Functionality Unchanged

**Auth Flow:**
- ✅ Sign up still works
- ✅ Login still works
- ✅ JWT validation unchanged

**AI Response Quality:**
- ✅ Bloodwork AI responds correctly
- ✅ Condition AI responds correctly
- ✅ Nutrition AI responds correctly
- ✅ Response format unchanged

**Orchestrate Integration:**
- ✅ Orchestrate still receives correct payload
- ✅ Domain routing works
- ✅ Model selection unchanged

#### 2. No Unintended Drift

**Database:**
- ✅ No changes to `check_usage_limit()` return values beyond quota enforcement
- ✅ No changes to tier limits structure

**Edge Functions:**
- ✅ CORS headers unchanged
- ✅ Error messages consistent
- ✅ Response structure unchanged

---

## Performance Testing

### Load Test (Optional)

**Scenario:** 100 concurrent users at limit

```bash
# Install Apache Bench or similar tool
# Test with 100 concurrent requests

ab -n 100 -c 10 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -p payload.json \
  "$SUPABASE_URL/functions/v1/bloodwork-ai-respond"
```

**Expected:**
- All requests return 402 consistently
- No requests bypass quota
- No database deadlocks

---

## Troubleshooting

### Issue: check_usage_limit() returns NULL

**Diagnosis:**
```sql
-- Check if user has active subscription
SELECT us.user_id, us.status, st.tier_id, st.limits
FROM user_subscriptions us
JOIN subscription_tiers st ON us.tier_id = st.tier_id
WHERE us.user_id = 'YOUR_USER_ID';
```

**Fix:** Ensure user has `free_evaluation` tier assigned.

---

### Issue: Usage not incrementing

**Diagnosis:**
```sql
-- Check increment_usage function
SELECT increment_usage('YOUR_USER_ID'::uuid, 'ai_interactions_evaluation');

-- Verify result
SELECT usage_count FROM usage_tracking
WHERE user_id = 'YOUR_USER_ID' AND feature_key = 'ai_interactions_evaluation';
```

**Fix:** Check client code calls `incrementUsage()` after successful AI response.

---

### Issue: Client shows wrong usage count

**Diagnosis:**
- Check network tab for `checkFeature()` response
- Verify `useSubscription` hook is fetching correctly

**Fix:** Refresh subscription state or reload app.

---

## Summary Checklist

### Before Deployment

- [ ] All database migrations applied
- [ ] check_usage_limit() function tested
- [ ] increment_usage() function tested
- [ ] All three edge functions deployed
- [ ] Client components updated

### Test Scenarios

- [ ] Scenario A: Fresh user (0/15) ✅
- [ ] Scenario B: Warning (12/15) ✅
- [ ] Scenario C: Client block (15/15) ✅
- [ ] Scenario D: Server block (15/15) ✅
- [ ] Scenario E: Fail-closed behavior ✅

### Regression Tests

- [ ] Auth flow unchanged
- [ ] AI response quality unchanged
- [ ] Orchestrate integration unchanged
- [ ] No unintended drift

### Documentation

- [ ] Test results documented
- [ ] Known issues logged
- [ ] Runbooks updated

---

## Contact

For questions or issues during testing, refer to:
- `AI_USAGE_ENFORCEMENT_AUDIT.md` - Comprehensive audit report
- `test-ai-quota-enforcement.sh` - Automated test script
- `verify-ai-quota-database.sql` - Database verification queries
