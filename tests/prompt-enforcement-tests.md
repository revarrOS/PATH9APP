# Prompt Enforcement Engine Tests

## Test Suite Overview

Tests verify that the Prompt Enforcement Engine correctly loads prompts, enforces ordering, validates state, and blocks invalid requests before reaching the mock LLM.

## Prerequisites

- Orchestrate edge function deployed with enforcement layer
- Two test users authenticated
- Prompt registry loaded at startup

---

## Test Cases

### Test 1: Missing journey_phase in State

**Purpose:** Verify enforcement blocks requests without required state fields

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "journey_state": {
    "session_count": 1
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-enf-001"
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error code: `ENFORCEMENT_FAILED`
- Violations include: `MISSING_STATE_FIELD` with field="journey_phase"
- Audit event: `enforcement_block` with violations details
- NO prompt_version_ids logged (enforcement failed before assembly)

**cURL Command:**
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/orchestrate" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000001",
    "journey_state": {
      "session_count": 1
    },
    "consent_flags": {
      "data_processing": true,
      "analytics": false,
      "third_party_sharing": false
    },
    "request_id": "test-enf-001"
  }'
```

---

### Test 2: Empty journey_state Object

**Purpose:** Verify enforcement requires journey_phase field

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "journey_state": {},
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-enf-002"
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error code: `ENFORCEMENT_FAILED`
- Violation: `MISSING_STATE_FIELD` with field="journey_phase"
- Audit event: `enforcement_block`

---

### Test 3: Valid Request with Minimal State

**Purpose:** Verify valid requests pass enforcement and reach mock LLM

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "journey_state": {
    "journey_phase": "onboarding"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-enf-003"
}
```

**Expected Result:**
- Status: 200 OK
- Response contains: success=true, data.response (from mock LLM)
- Response data includes: llm_metadata with model="mock-gemma-v1", prompt_count=4
- Audit events:
  - `policy_pass`
  - `enforcement_pass` with prompt_version_ids array (4 IDs)
  - `orchestration_complete` with prompt_versions
- Prompt versions logged:
  - gemma-core-system-v3
  - boundary-safety-v3
  - state-template-v2
  - knowledge-canon-v2

**cURL Command:**
```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/orchestrate" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000001",
    "journey_state": {
      "journey_phase": "onboarding"
    },
    "consent_flags": {
      "data_processing": true,
      "analytics": false,
      "third_party_sharing": false
    },
    "request_id": "test-enf-003"
  }'
```

---

### Test 4: Valid Request with Full State Context

**Purpose:** Verify state template hydration with all optional fields

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "journey_state": {
    "journey_phase": "active_journey",
    "session_count": 5,
    "last_interaction_date": "2025-12-15",
    "user_goals": "Improve time management and focus",
    "focus_areas": "Work-life balance",
    "recent_topics": "Goal setting, habit formation",
    "pending_questions": "How to track progress?",
    "conversation_tone": "supportive"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": true,
    "third_party_sharing": false
  },
  "request_id": "test-enf-004"
}
```

**Expected Result:**
- Status: 200 OK
- Response includes mock LLM response
- Audit event `enforcement_pass` includes state_hydrated=true
- All state fields processed through template hydration
- NO state values logged in audit (only metadata about hydration)

---

### Test 5: Prompt Order Validation

**Purpose:** Verify enforcement checks prompt order (internal test)

**Test Strategy:**
This is verified through code inspection and function startup logs. The prompt registry must load in order:
1. Core System Prompt
2. Boundary & Safety Prompt
3. State Template
4. Knowledge Canon Usage Prompt

**Verification:**
- Check edge function logs for "Prompt registry loaded successfully"
- Verify enforcement_pass audit events include all 4 prompt version IDs in correct order
- Any deviation from order would trigger `INCORRECT_PROMPT_ORDER` violation

---

### Test 6: Prompt Registry Startup Failure

**Purpose:** Verify hard-fail if prompts cannot be loaded

**Test Strategy:**
This would occur if prompt parsing fails (e.g., malformed metadata).

**Expected Behavior:**
- Edge function fails to initialize
- CRITICAL error logged: "Failed to load prompt registry"
- Function becomes unavailable until fixed

**Note:** This is a deployment-time check, not a runtime test.

---

### Test 7: Mock LLM Response Structure

**Purpose:** Verify mock LLM returns expected structure

**Expected Response Data:**
```json
{
  "success": true,
  "data": {
    "response": "Hello! I'm Gemma, and I'm here to support you on your personal development journey.\n\nI understand you're at the \"journey exploration\" phase. What would you like to focus on today?",
    "journey_state": { ... },
    "processed_at": "2025-12-17T...",
    "llm_metadata": {
      "model": "mock-gemma-v1",
      "prompt_count": 4,
      "timestamp": "2025-12-17T..."
    }
  },
  "request_id": "test-enf-..."
}
```

**Verification:**
- llm_metadata.model = "mock-gemma-v1"
- llm_metadata.prompt_count = 4
- data.response is a string (stub response)
- NO actual LLM call made

---

## Audit Event Verification

### Check Enforcement Events
```sql
SELECT
  user_id,
  event_type,
  created_at,
  metadata->>'request_id' as request_id,
  metadata->>'reason' as reason,
  metadata->'prompt_version_ids' as prompt_versions,
  metadata->>'state_hydrated' as state_hydrated
FROM audit_events
WHERE event_type IN ('enforcement_pass', 'enforcement_block')
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

### Verify NO Prompt Content Logged
```sql
SELECT
  event_type,
  metadata
FROM audit_events
WHERE event_type IN ('enforcement_pass', 'enforcement_block', 'orchestration_complete')
  AND created_at > NOW() - INTERVAL '5 minutes';
```

**Critical Check:** Ensure metadata does NOT contain:
- Prompt text/content
- Assembled prompt strings
- State template values
- User journey state details

**Only allowed in metadata:**
- prompt_version_ids (array of IDs like "gemma-core-system-v1")
- state_hydrated (boolean)
- request_id
- timestamp
- reason (for blocks)
- violations (codes only, no content)

---

### Count Enforcement Pass vs Block
```sql
SELECT
  event_type,
  COUNT(*) as count
FROM audit_events
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND event_type IN ('enforcement_pass', 'enforcement_block')
GROUP BY event_type;
```

---

## Request Flow Verification

### Complete Flow for Valid Request
```
1. POST /orchestrate with envelope
   ↓
2. Policy validation (auth, envelope, user_id, rate limit)
   → audit: policy_pass
   ↓
3. Load prompt registry (cached after first load)
   ↓
4. Extract journey_state from envelope
   ↓
5. Enforce prompts (validate registry, state, assembly, order)
   → audit: enforcement_pass (with prompt_version_ids)
   ↓
6. Call mock LLM with assembled prompts
   ↓
7. Return response with mock LLM output
   → audit: orchestration_complete (with prompt_versions)
   ↓
8. Response: 200 OK with data
```

### Complete Flow for Enforcement Failure
```
1. POST /orchestrate with envelope (missing journey_phase)
   ↓
2. Policy validation passes
   → audit: policy_pass
   ↓
3. Load prompt registry
   ↓
4. Extract journey_state from envelope
   ↓
5. Enforce prompts → FAIL (missing required state field)
   → audit: enforcement_block (with violations)
   ↓
6. Return error: 400 ENFORCEMENT_FAILED
   ↓
7. NO LLM call made
```

---

## Success Criteria

- [x] Requests without journey_phase are blocked (400)
- [x] Requests with empty journey_state are blocked (400)
- [x] Valid requests with minimal state pass enforcement
- [x] Valid requests with full state pass enforcement
- [x] Enforcement failures are audited with violations
- [x] Enforcement passes are audited with prompt_version_ids
- [x] Mock LLM returns stub response (no real LLM call)
- [x] Prompt registry loads at startup
- [x] Prompt order is validated
- [x] All 4 prompts are assembled in correct order
- [x] State template is hydrated with journey_state
- [x] NO prompt content logged in audit_events
- [x] NO state values logged in audit_events
- [x] Only prompt version IDs logged
- [x] Prompt registry is immutable at runtime
- [x] Hard-fail on missing prompts (deployment failure)

---

## Out of Scope Verification

Confirm these are NOT present:

- [ ] Real LLM API calls (OpenAI, Anthropic, etc.)
- [ ] User message text in request
- [ ] Knowledge retrieval calls
- [ ] Journey decision logic
- [ ] Feature implementations
- [ ] UI components
- [ ] Database tables for prompts (prompts are in code)

---

## Edge Cases

### Edge Case 1: null journey_phase
```json
"journey_state": {
  "journey_phase": null
}
```
**Expected:** 400 ENFORCEMENT_FAILED (null is not valid)

### Edge Case 2: journey_phase is number
```json
"journey_state": {
  "journey_phase": 123
}
```
**Expected:** Accepts any type (pass-through), but enforcement validates presence only

### Edge Case 3: Extra state fields
```json
"journey_state": {
  "journey_phase": "onboarding",
  "custom_field": "custom_value"
}
```
**Expected:** Pass (extra fields allowed, treated as pass-through)

---

## Notes

- Prompt registry is loaded once at function startup and cached
- Prompts are immutable (VERSION and ID enforced in registry)
- State template uses Handlebars-style syntax for hydration
- Mock LLM response is hardcoded stub (no variability)
- NO external API calls in this build unit
- Enforcement is mandatory gate before any LLM interaction
- All enforcement decisions are audited (pass and block)
