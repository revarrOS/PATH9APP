# Gemma Single-Turn Conversation Tests

## Test Suite Overview

Tests verify that the `/gemma/respond` endpoint accepts user messages, runs through the complete infrastructure, and returns responses while maintaining all safety guarantees.

## Prerequisites

- LLM API keys configured
- All edge functions deployed (gemma-respond + orchestrate dependencies)
- Test users authenticated
- Canon, enforcement, and policy systems operational

---

## Authentication Tests

### Test 1: Reject Unauthenticated Requests

**Purpose:** Verify endpoint requires authentication

**Request:** POST to `/gemma/respond` without Authorization header

**Expected Result:**
- Status: 401 Unauthorized
- Error code: AUTH_REQUIRED
- NO audit events logged (request rejected early)

---

### Test 2: Valid Authentication Accepted

**Purpose:** Verify authenticated requests are accepted

**Request:** POST with valid Authorization header + complete request body

**Expected Result:**
- Request passes authentication
- Audit: policy_pass event logged
- Processing continues

---

## Message Validation Tests

### Test 3: Reject Missing user_message

**Purpose:** Verify user_message is required

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
  "request_id": "test-msg-001"
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error code: INVALID_USER_MESSAGE or INVALID_MESSAGE_TYPE
- NO processing occurs
- NO audit events logged for message

---

### Test 4: Reject Empty user_message

**Purpose:** Verify empty messages are rejected

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "user_message": "",
  "journey_state": {
    "journey_phase": "onboarding"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-msg-002"
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error code: EMPTY_MESSAGE
- NO processing occurs

---

### Test 5: Reject Whitespace-Only user_message

**Purpose:** Verify whitespace-only messages are rejected

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "user_message": "   \n\t   ",
  "journey_state": {
    "journey_phase": "onboarding"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-msg-003"
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error code: EMPTY_MESSAGE
- Whitespace normalized, then detected as empty

---

### Test 6: Normalize Excessive Whitespace

**Purpose:** Verify excessive whitespace is normalized

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "user_message": "Hello    there   how   are   you?",
  "journey_state": {
    "journey_phase": "onboarding"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-msg-004"
}
```

**Expected Result:**
- Message normalized to: "Hello there how are you?"
- Status: 200 OK
- Processing continues with normalized message
- Audit: gemma_message_received with message_length (normalized)

---

### Test 7: Reject Message Too Long

**Purpose:** Verify messages over 1000 chars are rejected

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "user_message": "{1001+ character string}",
  "journey_state": {
    "journey_phase": "onboarding"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-msg-005"
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error code: MESSAGE_TOO_LONG
- Error message includes actual length
- NO processing occurs

---

### Test 8: Accept Maximum Length Message

**Purpose:** Verify 1000-character messages are accepted

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "user_message": "{exactly 1000 characters}",
  "journey_state": {
    "journey_phase": "onboarding"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-msg-006"
}
```

**Expected Result:**
- Status: 200 OK
- Processing continues
- Audit: gemma_message_received with message_length=1000

---

## Processing Flow Tests

### Test 9: Complete Flow with User Message

**Purpose:** Verify complete end-to-end flow works with user message

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "user_message": "I want to build a daily meditation habit. Where should I start?",
  "journey_state": {
    "journey_phase": "active_journey",
    "pillar": "habit_formation",
    "session_count": 3
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": true,
    "third_party_sharing": false
  },
  "request_id": "test-flow-001"
}
```

**Expected Audit Trail:**
1. `policy_pass` - Auth + rate limit OK
2. `gemma_message_received` - Message validated (message_length only)
3. `retrieval_attempt` - Canon retrieval started
4. `retrieval_success` - habit_formation chunks retrieved
5. `enforcement_pass` - Prompts validated
6. `llm_call_attempt` - LLM call started (includes user_message_length)
7. `llm_call_success` - LLM returned response with tokens
8. `gemma_response_sent` - Response sent (provider/model/tokens/response_length)

**Response Contract:**
```json
{
  "success": true,
  "data": {
    "response_text": "...",
    "llm_metadata": {
      "model": "gpt-4o-mini",
      "provider": "openai",
      "prompt_tokens": 1300,
      "completion_tokens": 200,
      "total_tokens": 1500,
      "timestamp": "2025-12-17T12:00:00Z"
    },
    "prompt_versions": [
      "gemma-core-system-v3",
      "boundary-safety-v3",
      "state-template-v2",
      "knowledge-canon-v2"
    ],
    "canon_included": true,
    "canon_chunk_count": 2,
    "processed_at": "2025-12-17T12:00:00Z"
  },
  "request_id": "test-flow-001"
}
```

**Response Verification:**
- response_text contains LLM-generated text about meditation habits
- References canon concepts (e.g., 2-minute rule, habit loop)
- Maintains Gemma persona (warm, curious, non-prescriptive)
- Responds to user's specific question

---

### Test 10: Flow Without Canon (0 Chunks)

**Purpose:** Verify flow works when canon retrieval returns 0 chunks

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "user_message": "Hello, I'm just getting started. What is this app about?",
  "journey_state": {
    "journey_phase": "unknown_phase"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-flow-002"
}
```

**Expected Result:**
- Status: 200 OK
- Audit: `retrieval_none` (no matching canon)
- Canon NOT appended to prompts
- Response contract shows:
  - `canon_included: false`
  - `canon_chunk_count: 0`
  - `prompt_versions` has 3 items (no knowledge-canon-v2)
- LLM still responds (uses core system prompts only)

---

### Test 11: Flow With 1-3 Canon Chunks

**Purpose:** Verify flow works with varying canon chunk counts

**Test A - 1 chunk:**
```json
{
  "journey_state": {
    "journey_phase": "onboarding",
    "pillar": "goal_setting"
  }
}
```

**Test B - 2-3 chunks:**
```json
{
  "journey_state": {
    "journey_phase": "active_journey",
    "pillar": "habit_formation",
    "focus_areas": "morning routine"
  }
}
```

**Expected Result:**
- Canon chunks retrieved (1-3)
- Canon formatted and appended as 5th prompt
- Response shows:
  - `canon_included: true`
  - `canon_chunk_count: 1` (or 2, 3)
  - Prompt count = 5 in llm_call_attempt
- Response references canon concepts

---

## Safety & Enforcement Tests

### Test 12: Enforcement Still Hard-Fails

**Purpose:** Verify prompt enforcement blocks invalid journey_state

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "user_message": "Hello there!",
  "journey_state": {},
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-enforcement-001"
}
```

**Expected Result:**
- Status: 400 Bad Request
- Error code: ENFORCEMENT_FAILED
- Audit: enforcement_block
- Audit: gemma_response_blocked (reason: enforcement_failed)
- NO llm_call_attempt
- NO gemma_response_sent

---

### Test 13: Policy Still Gates Access

**Purpose:** Verify policy validation runs before message processing

**Request Body:**
```json
{
  "user_id": "wrong_user_id",
  "user_message": "Hello!",
  "journey_state": {
    "journey_phase": "onboarding"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-policy-001"
}
```

**Expected Result:**
- Status: 403 Forbidden
- Error code: USER_ID_MISMATCH
- Audit: policy_block (reason: user_id_mismatch)
- NO gemma_message_received
- NO processing occurs

---

### Test 14: Rate Limit Still Enforced

**Purpose:** Verify rate limits apply to conversation endpoint

**Test Strategy:** Send 11+ requests rapidly from same user

**Expected Result:**
- First 10 requests: 200 OK
- 11th request: 429 Rate Limit Exceeded
- Audit: policy_block (reason: rate_limit_exceeded)
- NO message processing for rate-limited requests

---

## Audit Logging Tests

### Test 15: Verify gemma_message_received Audit

**Purpose:** Verify message receipt is logged with metadata only

**SQL Query:**
```sql
SELECT
  event_type,
  metadata->>'message_length' as message_length,
  metadata
FROM audit_events
WHERE event_type = 'gemma_message_received'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

**Expected Fields:**
- `message_length` (integer, normalized length)

**CRITICAL - Must NOT contain:**
- ❌ `user_message` text
- ❌ `message_content`
- ❌ Any user input content

---

### Test 16: Verify gemma_response_sent Audit

**Purpose:** Verify response sending is logged with metadata only

**SQL Query:**
```sql
SELECT
  event_type,
  metadata->>'provider' as provider,
  metadata->>'model' as model,
  metadata->>'prompt_tokens' as prompt_tokens,
  metadata->>'completion_tokens' as completion_tokens,
  metadata->>'total_tokens' as total_tokens,
  metadata->>'response_length' as response_length,
  metadata
FROM audit_events
WHERE event_type = 'gemma_response_sent'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

**Expected Fields:**
- `provider` (openai/anthropic)
- `model` (string)
- `prompt_tokens` (integer)
- `completion_tokens` (integer)
- `total_tokens` (integer)
- `response_length` (integer, character count)

**CRITICAL - Must NOT contain:**
- ❌ `response_text`
- ❌ `llm_response`
- ❌ Any LLM output content

---

### Test 17: Verify gemma_response_blocked Audit

**Purpose:** Verify blocked responses are logged with reason

**Test Strategy:** Trigger enforcement failure

**SQL Query:**
```sql
SELECT
  event_type,
  metadata->>'reason' as reason,
  metadata->>'violation_count' as violation_count,
  metadata
FROM audit_events
WHERE event_type = 'gemma_response_blocked'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

**Expected Reasons:**
- `enforcement_failed` (with violation_count)
- `llm_call_failed` (with error message)
- `prompt_registry_load_failed` (with error)

**Expected Fields:**
- `reason` (string)
- Additional context (violation_count, error message)

---

### Test 18: Verify NO User Message Content in Audit

**Purpose:** CRITICAL - Verify user messages are NEVER logged

**SQL Query:**
```sql
SELECT
  event_type,
  metadata,
  metadata::text
FROM audit_events
WHERE created_at > NOW() - INTERVAL '1 hour';
```

**Critical Check:**
- NO user message text anywhere in audit logs
- Search metadata text for test message phrases
- Confirm ONLY message_length logged

**Verification:**
```sql
-- Should return 0 rows
SELECT * FROM audit_events
WHERE metadata::text LIKE '%meditation habit%'
  OR metadata::text LIKE '%getting started%'
  OR metadata::text LIKE '%{any test message phrase}%';
```

---

### Test 19: Verify NO Response Text in Audit

**Purpose:** CRITICAL - Verify LLM responses are NEVER logged

**Expected:**
- Audit logs contain response_length (integer)
- NO response_text field
- NO llm_response field
- NO actual response content

---

### Test 20: Verify user_message_length in llm_call_attempt

**Purpose:** Verify user message length is logged in LLM attempt

**SQL Query:**
```sql
SELECT
  metadata->>'user_message_length' as user_message_length,
  metadata->>'prompt_count' as prompt_count
FROM audit_events
WHERE event_type = 'llm_call_attempt'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

**Expected:**
- `user_message_length` present (normalized length)
- `prompt_count` = 4 or 5 (depending on canon)
- NO actual message content

---

## Response Contract Tests

### Test 21: Verify Response Structure

**Purpose:** Verify response matches exact contract

**Request:** Valid request with user message

**Expected Response Structure:**
```json
{
  "success": true,
  "data": {
    "response_text": string,
    "llm_metadata": {
      "model": string,
      "provider": string,
      "prompt_tokens": number,
      "completion_tokens": number,
      "total_tokens": number,
      "timestamp": string (ISO 8601)
    },
    "prompt_versions": [string],
    "canon_included": boolean,
    "canon_chunk_count": number,
    "processed_at": string (ISO 8601)
  },
  "request_id": string
}
```

**Validation:**
- All required fields present
- Types correct
- prompt_versions array has 3-4 items
- canon_included matches canon_chunk_count (true if > 0)
- Timestamps are valid ISO 8601

---

### Test 22: Verify prompt_versions Array

**Purpose:** Verify prompt version IDs are returned

**Without Canon:**
```json
{
  "prompt_versions": [
    "gemma-core-system-v3",
    "boundary-safety-v3",
    "state-template-v2"
  ]
}
```

**With Canon:**
```json
{
  "prompt_versions": [
    "gemma-core-system-v1",
    "boundary-safety-v1",
    "state-template-v2",
    "knowledge-canon-v2"
  ]
}
```

**Expected:**
- Array length matches canon_included
- IDs are version strings (not content)

---

## No Storage Tests

### Test 23: Verify Messages NOT Stored in Database

**Purpose:** CRITICAL - Verify user messages are NOT saved

**SQL Queries:**
```sql
-- Check if any messages table exists
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE '%message%';

-- Check if any conversation/chat tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('messages', 'conversations', 'chat_history', 'turns');

-- Check profiles table for message storage
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles'
  AND (column_name LIKE '%message%' OR column_name LIKE '%conversation%');
```

**Expected:**
- NO messages/conversations tables
- NO message columns in any table
- Messages are processed and discarded (not stored)

---

### Test 24: Verify NO Long-Term Memory

**Purpose:** Verify no conversation history is maintained

**Test Strategy:** Send 2 messages in sequence with same user

**Message 1:**
```json
{
  "user_message": "My name is Alice and I love running.",
  "journey_state": {"journey_phase": "onboarding"},
  ...
}
```

**Message 2 (immediately after):**
```json
{
  "user_message": "What is my name?",
  "journey_state": {"journey_phase": "onboarding"},
  ...
}
```

**Expected Result:**
- Message 2 response does NOT know user's name
- LLM has NO memory of Message 1
- Each request is completely independent
- Confirms single-turn (no multi-turn) conversation

---

## Error Path Tests

### Test 25: Complete Error Audit Trail

**Purpose:** Verify all error paths are audited correctly

**Test Scenarios:**

**A. Message Validation Error:**
- Request with message > 1000 chars
- Result: 400 error, NO audit events (rejected before policy)

**B. Enforcement Error:**
- Request with invalid journey_state
- Result: 400 error, audit: enforcement_block + gemma_response_blocked

**C. LLM Error:**
- Invalid API key
- Result: 500 error, audit: llm_call_failure + gemma_response_blocked

**All Error Paths Must:**
- Return explicit error code
- Log gemma_response_blocked (when processing started)
- Include reason in audit
- NOT crash or hang

---

## Integration Tests

### Test 26: Complete 6-Unit Integration

**Purpose:** Verify all 6 units work together

**Request:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "user_message": "I struggle with procrastination when starting new tasks. Any advice?",
  "journey_state": {
    "journey_phase": "active_journey",
    "pillar": "overcoming_resistance",
    "session_count": 8,
    "user_goals": "Overcome procrastination",
    "focus_areas": "task initiation"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": true,
    "third_party_sharing": false
  },
  "request_id": "test-integration-001"
}
```

**Complete Audit Trail (Units 1-6):**
1. `policy_pass` - Unit 2: Policy & Audit
2. `gemma_message_received` - Unit 6: Conversation
3. `retrieval_attempt` - Unit 4: Knowledge Canon
4. `retrieval_success` - Unit 4: 2-3 overcoming_resistance chunks
5. `enforcement_pass` - Unit 3: Prompt Enforcement
6. `llm_call_attempt` - Unit 5: LLM Adapter
7. `llm_call_success` - Unit 5: Real LLM response
8. `gemma_response_sent` - Unit 6: Response metadata

**Response Verification:**
- response_text addresses procrastination/resistance
- References canon concepts (resistance is natural, 2-minute rule)
- Maintains Gemma persona
- Specific to user's context (task initiation)
- All metadata correct (tokens, versions, canon count)

---

## Out of Scope Verification

### Test 27: Confirm NO Multi-Turn Support

**Expected:**
- NO conversation_id or session_id in request
- NO reference to previous messages
- Each request completely independent
- NO conversation table in database

---

### Test 28: Confirm NO Memory Writes

**Expected:**
- NO memory tables
- NO conversation history stored
- NO message saving to DB
- Requests are stateless (except journey_state pass-through)

---

### Test 29: Confirm journey_state is Pass-Through Only

**Purpose:** Verify journey_state is NOT modified by endpoint

**Request:** Send journey_state with session_count: 5

**Expected:**
- journey_state used for canon retrieval
- journey_state used for state template
- journey_state NOT updated/modified
- NO increment logic for session_count
- NO journey decisions made

---

## Success Criteria

- [x] Endpoint rejects unauthenticated requests
- [x] Endpoint rejects missing/invalid user_message
- [x] Message validation: 1-1000 chars enforced
- [x] Empty/whitespace-only messages rejected
- [x] Excessive whitespace normalized
- [x] Works with canon 0 chunks
- [x] Works with canon 1-3 chunks
- [x] Enforcement still hard-fails on invalid state
- [x] Policy still gates access (auth, rate limit, user_id)
- [x] Audit events logged:
  - [x] gemma_message_received (message_length only)
  - [x] gemma_response_sent (metadata + response_length only)
  - [x] gemma_response_blocked (reason + context)
- [x] NEVER logs user message content
- [x] NEVER logs LLM response content
- [x] Token counts recorded on success
- [x] Response contract matches spec exactly
- [x] Messages NOT stored in database
- [x] NO conversation history maintained
- [x] NO long-term memory
- [x] journey_state is pass-through only
- [x] All error paths audited

---

## Notes

- User messages are validated, normalized, and passed to LLM
- Messages are NEVER stored (in-memory only during request)
- Each request is completely independent (no conversation state)
- All safety guarantees from Units 1-5 remain intact
- Canon retrieval, enforcement, and LLM flow unchanged
- Only addition is user message validation and new audit events
- Temperature remains 0.3 for stable responses
- Response contract is explicit and complete

---

## Environment Variables

No new environment variables required. Uses existing LLM configuration from Unit 5.

---

## Future Enhancements (Out of Scope)

- Multi-turn conversation support
- Conversation history storage
- Message persistence
- Journey decision logic based on conversation
- Memory writes from conversation
- Session management
- Conversation UI components
