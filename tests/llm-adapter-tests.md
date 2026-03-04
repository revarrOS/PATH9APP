# LLM Adapter Tests

## Test Suite Overview

Tests verify that the real LLM adapter correctly calls OpenAI/Anthropic, enforces safety guards, handles failures gracefully, and logs appropriately without exposing prompts or responses.

## Prerequisites

- LLM API keys configured in environment variables
- Edge function deployed with LLM adapter
- Test users authenticated
- Canon and enforcement systems operational

---

## Configuration Tests

### Test 1: LLM Provider Configuration

**Purpose:** Verify LLM provider can be switched via environment variable

**Setup:**
```bash
# Test OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-test-...
OPENAI_MODEL=gpt-4o-mini

# Test Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

**Expected Result:**
- Function uses the configured provider
- Audit logs show correct provider and model

---

### Test 2: Temperature Safety Limit

**Purpose:** Verify temperature cannot exceed 0.3

**Setup:**
```bash
LLM_TEMPERATURE=0.7
```

**Expected Result:**
- Temperature capped at 0.3
- Config validation passes
- Audit logs show temperature=0.3 (not 0.7)

---

### Test 3: Safe Defaults

**Purpose:** Verify safe defaults are used when env vars missing

**Setup:**
Remove optional LLM config from environment

**Expected Result:**
- Provider: openai
- Model: gpt-4o-mini (OpenAI) or claude-3-5-haiku-20241022 (Anthropic)
- Temperature: 0.3
- Max tokens: 2000
- Timeout: 30000ms
- Max retries: 2

---

## Hard Guard Tests

### Test 4: Enforcement Must Pass Before LLM

**Purpose:** Verify LLM refuses calls if enforcement_passed=false

**Test Strategy:**
Mock enforcement failure scenario (difficult to trigger in real flow since enforcement blocks early)

**Expected Result:**
- LLM adapter returns error
- Error code: ENFORCEMENT_NOT_PASSED
- Audit: llm_call_attempt followed by llm_call_failure
- Response: 500 LLM_CALL_FAILED

---

### Test 5: Prompt Order Validation

**Purpose:** Verify LLM validates prompt order before calling

**Test Strategy:**
Manually construct AssembledPrompts with incorrect order (test helper function)

**Expected Result:**
- Guard validation fails
- Error code: INVALID_PROMPT_ORDER
- LLM call refused

---

### Test 6: Canon Must Be Appended Last

**Purpose:** Verify canon context (if present) is always last prompt

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
  "request_id": "test-llm-001"
}
```

**Expected Result:**
- Canon retrieved and appended as 5th prompt
- Guard validates canon is last
- LLM call proceeds
- Audit: llm_call_success

---

## LLM Call Tests

### Test 7: Successful OpenAI Call

**Purpose:** Verify OpenAI integration works end-to-end

**Setup:**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY={valid_key}
```

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
  "request_id": "test-llm-openai-001"
}
```

**Expected Result:**
- Status: 200 OK
- Response contains LLM-generated text
- Audit events:
  - `llm_call_attempt` with provider=openai, model, temperature
  - `llm_call_success` with token counts
  - `orchestration_complete` with llm_provider and llm_model
- Response metadata includes:
  - model (actual model used)
  - provider: "openai"
  - prompt_tokens (number)
  - completion_tokens (number)
  - total_tokens (number)

---

### Test 8: Successful Anthropic Call

**Purpose:** Verify Anthropic integration works end-to-end

**Setup:**
```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY={valid_key}
```

**Request Body:**
Same as Test 7

**Expected Result:**
- Status: 200 OK
- Response contains LLM-generated text
- Audit shows provider=anthropic
- Token counts included in metadata

---

### Test 9: API Key Missing

**Purpose:** Verify graceful failure when API key not configured

**Setup:**
Remove OPENAI_API_KEY or ANTHROPIC_API_KEY from environment

**Expected Result:**
- LLM adapter returns error
- Error: "OPENAI_API_KEY not configured" or "ANTHROPIC_API_KEY not configured"
- Audit: llm_call_failure with error message
- Response: 500 LLM_CALL_FAILED
- NO actual API call made

---

### Test 10: Timeout Handling

**Purpose:** Verify LLM calls timeout appropriately

**Setup:**
```bash
LLM_TIMEOUT_MS=1000
```

**Expected Result:**
- If LLM takes > 1 second, request times out
- Audit: llm_call_failure
- Error indicates timeout
- Response: 500 LLM_CALL_FAILED

---

### Test 11: Retry Logic

**Purpose:** Verify retries work on transient failures

**Setup:**
```bash
LLM_MAX_RETRIES=2
```

**Test Strategy:**
Temporarily cause API failure (invalid model name, rate limit, etc.)

**Expected Result:**
- Adapter retries up to 2 times (3 total attempts)
- Exponential backoff between retries (1s, 2s)
- If all retries fail: llm_call_failure
- If retry succeeds: llm_call_success

---

### Test 12: API Error Handling

**Purpose:** Verify API errors are handled gracefully

**Test Strategy:**
Use invalid model name or trigger API error

**Expected Result:**
- Adapter catches error
- Audit: llm_call_failure with error message
- Error message includes API error details
- Response: 500 LLM_CALL_FAILED
- Request does NOT crash

---

## Audit Logging Tests

### Test 13: Verify LLM Audit Events

**Purpose:** Verify all LLM events are logged correctly

**SQL Query:**
```sql
SELECT
  event_type,
  metadata->>'provider' as provider,
  metadata->>'model' as model,
  metadata->>'temperature' as temperature,
  metadata->>'prompt_count' as prompt_count,
  metadata->>'prompt_tokens' as prompt_tokens,
  metadata->>'completion_tokens' as completion_tokens,
  metadata->>'total_tokens' as total_tokens,
  metadata->>'error' as error
FROM audit_events
WHERE event_type IN ('llm_call_attempt', 'llm_call_success', 'llm_call_failure')
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

**Expected Fields:**

**llm_call_attempt:**
- provider (openai/anthropic)
- model (string)
- temperature (number)
- max_tokens (number)
- prompt_count (number)

**llm_call_success:**
- provider
- model
- prompt_tokens (number)
- completion_tokens (number)
- total_tokens (number)

**llm_call_failure:**
- provider
- model
- error (string)

---

### Test 14: NO Prompts in Audit Logs

**Purpose:** CRITICAL - Verify prompts are NEVER logged

**SQL Query:**
```sql
SELECT
  event_type,
  metadata
FROM audit_events
WHERE created_at > NOW() - INTERVAL '1 hour';
```

**Critical Check:**
Audit metadata must NEVER contain:
- Prompt text/content
- Core system prompt
- Boundary safety prompt
- State template content
- Knowledge canon prompt
- Canon chunks content
- User messages
- LLM responses/completions

**Only allowed:**
- prompt_count (number of prompts)
- prompt_versions (IDs only)
- token counts
- model names
- error messages (generic, no prompt content)

---

### Test 15: NO Responses in Audit Logs

**Purpose:** CRITICAL - Verify LLM responses are NEVER logged

**Expected:**
- Audit logs contain NO LLM response text
- Client receives response, but audit does not
- Only metadata logged (tokens, model, provider)

---

## Stability Tests

### Test 16: Deterministic Output (Same Input)

**Purpose:** Verify same request produces stable output with low temperature

**Test Strategy:**
Send identical request 3 times with temperature=0.3

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "journey_state": {
    "journey_phase": "onboarding",
    "session_count": 1
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-stability-{1,2,3}"
}
```

**Expected Result:**
- All 3 responses are similar (not identical, but consistent)
- Temperature=0.3 ensures low variance
- Token counts within reasonable range
- Responses follow same structure and tone

---

### Test 17: Canon Affects Output

**Purpose:** Verify canon context influences LLM response

**Test A - Without Canon:**
```json
"journey_state": {
  "journey_phase": "nonexistent_phase"
}
```

**Test B - With Canon:**
```json
"journey_state": {
  "journey_phase": "onboarding",
  "pillar": "goal_setting"
}
```

**Expected Result:**
- Test A: No canon chunks retrieved, generic response
- Test B: Canon chunks retrieved, response references goal-setting concepts
- Audit logs show different canon_chunk_count (0 vs >0)

---

## Safety & Enforcement Tests

### Test 18: Enforcement Still Hard-Fails

**Purpose:** Verify prompt enforcement still blocks requests

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
  "request_id": "test-enforcement-001"
}
```

**Expected Result:**
- Enforcement fails (journey_phase required)
- LLM call NEVER attempted
- Audit: enforcement_block (NOT llm_call_attempt)
- Response: 400 ENFORCEMENT_FAILED
- Safety unchanged from Unit 3

---

### Test 19: Policy Still Gates Access

**Purpose:** Verify policy validation runs before LLM

**Request Body:**
```json
{
  "user_id": "wrong_user_id",
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
- Policy validation fails (user_id mismatch)
- LLM call NEVER attempted
- Audit: policy_block (NOT llm_call_attempt)
- Response: 403 USER_ID_MISMATCH

---

## Error Path Tests

### Test 20: Complete Error Flow

**Purpose:** Verify explicit error paths are audited

**Test Scenarios:**

**A. Config Error:**
- Invalid temperature (> 0.3 after override attempt)
- Result: LLM_CALL_FAILED, audit shows config error

**B. Guard Error:**
- Prompt order invalid
- Result: LLM_CALL_FAILED, audit shows guard violation

**C. API Error:**
- Invalid API key
- Result: LLM_CALL_FAILED, audit shows auth error

**D. Timeout Error:**
- LLM timeout exceeded
- Result: LLM_CALL_FAILED, audit shows timeout

**E. Network Error:**
- API unreachable
- Result: LLM_CALL_FAILED, audit shows network error

**All Error Paths Must:**
- Return explicit error response
- Log llm_call_failure audit event
- NOT crash or hang
- NOT expose sensitive details to client

---

## Token Usage Verification

### Test 21: Token Counts Logged

**Purpose:** Verify token usage is tracked accurately

**SQL Query:**
```sql
SELECT
  metadata->>'model' as model,
  SUM((metadata->>'prompt_tokens')::int) as total_prompt_tokens,
  SUM((metadata->>'completion_tokens')::int) as total_completion_tokens,
  SUM((metadata->>'total_tokens')::int) as total_tokens,
  COUNT(*) as successful_calls
FROM audit_events
WHERE event_type = 'llm_call_success'
  AND created_at > NOW() - INTERVAL '1 day'
GROUP BY metadata->>'model';
```

**Expected Result:**
- Token counts present for all successful calls
- Totals are reasonable
- Can track usage by model
- Can monitor costs

---

## Integration Tests

### Test 22: End-to-End with All Units

**Purpose:** Verify complete flow with all 5 units integrated

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "journey_state": {
    "journey_phase": "active_journey",
    "pillar": "habit_formation",
    "session_count": 5,
    "user_goals": "Build consistent exercise habit",
    "focus_areas": "morning routine"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": true,
    "third_party_sharing": false
  },
  "request_id": "test-e2e-001"
}
```

**Complete Audit Trail:**
1. `policy_pass` - User authenticated, rate limit OK
2. `retrieval_attempt` - Canon retrieval started
3. `retrieval_success` - 2-3 habit_formation chunks retrieved
4. `enforcement_pass` - All prompts validated, canon included
5. `llm_call_attempt` - LLM call initiated with config
6. `llm_call_success` - LLM returned response with token counts
7. `orchestration_complete` - Full metadata logged

**Response:**
- Status: 200 OK
- Contains LLM-generated text about habit formation
- References canon concepts (habit loop, 2-minute rule, etc.)
- Maintains Gemma persona (warm, curious, non-prescriptive)
- Metadata includes all providers, models, tokens

**Safety Verified:**
- NO prompts in audit
- NO responses in audit
- NO canon content in audit
- Only version IDs and token counts logged

---

## Success Criteria

- [x] OpenAI adapter works with real API
- [x] Anthropic adapter works with real API
- [x] Temperature capped at 0.3
- [x] Timeouts enforced
- [x] Retries work with exponential backoff
- [x] Hard guards refuse calls when:
  - [x] enforcement_passed=false
  - [x] prompt_order_valid=false
  - [x] canon_appended_last=false
- [x] LLM calls audited:
  - [x] llm_call_attempt logged
  - [x] llm_call_success logged with tokens
  - [x] llm_call_failure logged with error
- [x] NEVER log prompts in audit
- [x] NEVER log responses in audit
- [x] API errors handled gracefully
- [x] Missing API keys handled gracefully
- [x] Same request produces stable output
- [x] Safety/enforcement unchanged
- [x] Policy still gates access
- [x] Canon affects LLM output
- [x] Token counts tracked accurately
- [x] All failure paths explicit and audited

---

## Out of Scope Verification

Confirm these are NOT present:

- [ ] Streaming responses
- [ ] Function calling / tool use
- [ ] User free-text input (journey_state only)
- [ ] Journey decision logic in LLM
- [ ] Memory writes from LLM
- [ ] UI components
- [ ] Dynamic temperature adjustment
- [ ] Fine-tuning or prompt injection
- [ ] Multi-turn conversation memory

---

## Environment Variables Reference

```bash
# Required
LLM_PROVIDER=openai                    # or "anthropic"
OPENAI_API_KEY=sk-...                  # Required if provider=openai
ANTHROPIC_API_KEY=sk-ant-...           # Required if provider=anthropic

# Model Selection
OPENAI_MODEL=gpt-4o-mini               # Default: gpt-4o-mini
ANTHROPIC_MODEL=claude-3-5-haiku-20241022  # Default: claude-3-5-haiku-20241022

# Safety Limits (with safe defaults)
LLM_TEMPERATURE=0.3                    # Max: 0.3, Default: 0.3
LLM_MAX_TOKENS=2000                    # Default: 2000
LLM_TIMEOUT_MS=30000                   # Default: 30000 (30 seconds)
LLM_MAX_RETRIES=2                      # Default: 2
```

---

## Notes

- Real LLM calls may take 2-10 seconds depending on provider and load
- Token counts vary based on prompt length and response length
- Temperature 0.3 provides good balance of consistency and naturalness
- Retries add latency but improve reliability
- Always test with actual API keys in secure environment
- Monitor token usage to control costs
- Audit logs enable debugging without exposing sensitive content
- Guards ensure safety even if other validations fail
- Provider switching requires no code changes (just env vars)
