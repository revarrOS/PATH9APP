# Edge Services Framework Tests

## Test Suite Overview

Tests verify that the Edge Services Framework correctly enforces policy requirements and orchestrates requests through the control plane.

## Prerequisites

- Two test users in auth.users:
  - User A: `00000000-0000-0000-0000-000000000001`
  - User B: `00000000-0000-0000-0000-000000000002`
- Supabase edge functions deployed (health, orchestrate)

## Test Cases

### Test 1: Health Endpoint (No Auth Required)

**Purpose:** Verify health endpoint is accessible without authentication

**Expected Result:**
- Status: 200 OK
- Response contains: status, service, timestamp, version

**cURL Command:**
```bash
curl -X GET \
  "${SUPABASE_URL}/functions/v1/health" \
  -H "Content-Type: application/json"
```

---

### Test 2: Missing Authentication

**Purpose:** Verify requests without auth token are rejected

**Expected Result:**
- Status: 401 Unauthorized
- Error code: `UNAUTHORIZED`
- Audit event: NOT logged (no user_id available)

**cURL Command:**
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/orchestrate" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000001",
    "journey_state": {},
    "consent_flags": {
      "data_processing": true,
      "analytics": false,
      "third_party_sharing": false
    },
    "request_id": "test-001"
  }'
```

---

### Test 3: Missing Request Envelope

**Purpose:** Verify requests without envelope are rejected

**Expected Result:**
- Status: 400 Bad Request
- Error code: `INVALID_ENVELOPE`
- Violations include: `MISSING_USER_ID`, `MISSING_JOURNEY_STATE`, etc.
- Audit event: `policy_block` with reason `invalid_envelope`

**cURL Command:**
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/orchestrate" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### Test 4: Partial Envelope (Missing Fields)

**Purpose:** Verify partial envelopes are rejected

**Expected Result:**
- Status: 400 Bad Request
- Error code: `INVALID_ENVELOPE`
- Violations list specific missing fields
- Audit event: `policy_block` with violations details

**cURL Command:**
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/orchestrate" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000001",
    "journey_state": {}
  }'
```

---

### Test 5: User ID Mismatch

**Purpose:** Verify envelope user_id must match authenticated user

**Expected Result:**
- Status: 403 Forbidden
- Error code: `USER_ID_MISMATCH`
- Violation: "Envelope user_id must match authenticated user"
- Audit event: `policy_block` with reason `user_id_mismatch`

**cURL Command:**
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/orchestrate" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000002",
    "journey_state": {"step": "start"},
    "consent_flags": {
      "data_processing": true,
      "analytics": false,
      "third_party_sharing": false
    },
    "request_id": "test-005"
  }'
```

---

### Test 6: Valid Request - Pass Through

**Purpose:** Verify valid requests pass all policy checks and return mock response

**Expected Result:**
- Status: 200 OK
- Response contains: success=true, data, request_id
- Audit events:
  - `policy_pass` with rate_limit_remaining
  - `orchestration_complete`
- Response header: `X-Rate-Limit-Remaining`

**cURL Command:**
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/orchestrate" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000001",
    "journey_state": {
      "step": "onboarding",
      "progress": 0.5
    },
    "consent_flags": {
      "data_processing": true,
      "analytics": true,
      "third_party_sharing": false
    },
    "request_id": "test-006"
  }'
```

---

### Test 7: Rate Limiting (100+ requests)

**Purpose:** Verify rate limiting blocks excessive requests from same user

**Expected Result:**
- First 100 requests: 200 OK
- Request 101+: 429 Too Many Requests
- Error code: `RATE_LIMIT_EXCEEDED`
- Audit event: `policy_block` with reason `rate_limit_exceeded`

**Test Strategy:**
Run test 6 in a loop 101 times within 60 seconds

---

### Test 8: User Isolation

**Purpose:** Verify User A and User B have separate rate limits and audit logs

**Expected Result:**
- User A requests do not affect User B rate limit
- User A cannot see User B audit events via RLS
- Each user has independent policy enforcement

---

## Audit Event Verification Queries

### Check Recent Audit Events
```sql
SELECT
  user_id,
  event_type,
  created_at,
  metadata->>'request_id' as request_id,
  metadata->>'reason' as reason
FROM audit_events
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

### Count Policy Blocks vs Passes
```sql
SELECT
  event_type,
  COUNT(*) as count
FROM audit_events
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND event_type IN ('policy_pass', 'policy_block')
GROUP BY event_type;
```

### Check User-Specific Events
```sql
SELECT
  event_type,
  metadata->>'request_id' as request_id,
  metadata->>'reason' as reason,
  created_at
FROM audit_events
WHERE user_id = '00000000-0000-0000-0000-000000000001'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## Success Criteria

- [ ] Health endpoint accessible without auth
- [ ] Requests without auth token are rejected (401)
- [ ] Requests without envelope are rejected (400)
- [ ] Partial envelopes are rejected with violation details
- [ ] User ID mismatch is blocked (403)
- [ ] Valid requests pass through successfully (200)
- [ ] Rate limiting enforces 100 requests/minute per user
- [ ] All policy violations are audited
- [ ] All successful orchestrations are audited
- [ ] Users cannot access other users' audit events
- [ ] No internal error details leaked in responses
- [ ] No payload content logged in audit events

---

## Notes

- Mock orchestration handler returns journey_state as-is (pass-through)
- No business logic or AI calls in orchestration handler
- Request envelope is opaque to orchestration layer
- Policy middleware is first-class concern
- Hard-fail on all violations (no silent fallback)
