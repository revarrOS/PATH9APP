# Knowledge Canon Tests

## Test Suite Overview

Tests verify that the Knowledge Canon system correctly retrieves relevant chunks based on journey_phase and topic hints, includes them in prompts, and logs retrieval without exposing content.

## Prerequisites

- Canon tables populated with sample data (canon_documents, canon_chunks)
- Edge function deployed with canon retrieval integration
- Test users authenticated

---

## Test Cases

### Test 1: Retrieval with Matching journey_phase

**Purpose:** Verify canon chunks are retrieved when journey_phase matches

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
  "request_id": "test-canon-001"
}
```

**Expected Result:**
- Status: 200 OK
- Response includes mock LLM output
- Audit events:
  - `retrieval_attempt` with journey_phase
  - `retrieval_success` with chunk_count > 0 and canon_version_ids
  - `enforcement_pass` with canon_included=true
  - `orchestration_complete` with canon_chunk_count > 0
- NO canon content in audit logs

---

### Test 2: Retrieval with No Matching Chunks

**Purpose:** Verify system proceeds without canon when no matches found

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "journey_state": {
    "journey_phase": "nonexistent_phase"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-canon-002"
}
```

**Expected Result:**
- Status: 200 OK
- Response includes mock LLM output
- Audit events:
  - `retrieval_attempt`
  - `retrieval_none` with reason="no_matching_chunks"
  - `enforcement_pass` with canon_included=false (or undefined)
  - `orchestration_complete` with canon_chunk_count=0
- Request proceeds successfully without canon

---

### Test 3: Retrieval with pillar Hint

**Purpose:** Verify pillar filtering in retrieval

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "journey_state": {
    "journey_phase": "active_journey",
    "pillar": "habit_formation"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-canon-003"
}
```

**Expected Result:**
- Status: 200 OK
- Retrieval returns habit_formation chunks only
- Audit `retrieval_success` includes canon_version_ids like ["habit_formation-1.0.0"]
- canon_chunk_count matches habit chunks (max 3)

---

### Test 4: Retrieval with topic_hint

**Purpose:** Verify topic hint improves relevance scoring

**Request Body:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000001",
  "journey_state": {
    "journey_phase": "onboarding",
    "topic_hint": "smart goals"
  },
  "consent_flags": {
    "data_processing": true,
    "analytics": false,
    "third_party_sharing": false
  },
  "request_id": "test-canon-004"
}
```

**Expected Result:**
- Status: 200 OK
- Retrieval prioritizes chunks with tags matching "smart" or "goals"
- Chunks about SMART framework returned with higher scores

---

### Test 5: Maximum Chunks Limit (3)

**Purpose:** Verify retrieval never returns more than 3 chunks

**Test Strategy:**
If journey_phase="onboarding" has more than 3 chunks in database, verify only 3 highest-scoring chunks are returned.

**Expected Result:**
- `retrieval_success` audit shows chunk_count ≤ 3
- Even if 10 chunks match, only top 3 returned

---

### Test 6: Low Confidence Filtering

**Purpose:** Verify chunks below confidence threshold are filtered out

**Test Strategy:**
Request with journey_phase and topic_hint that result in low relevance scores (< 0.5).

**Expected Result:**
- If no chunks score >= 0.5, return empty result
- Audit event: `retrieval_none` with reason="no_matching_chunks"
- Request proceeds without canon

---

### Test 7: Canon Context Formatting

**Purpose:** Verify retrieved chunks are formatted correctly for LLM

**Test Strategy:**
Make request that retrieves 2-3 chunks, inspect prompt assembly.

**Expected Format:**
```
KNOWLEDGE CANON CONTEXT

The following references from the knowledge canon may be relevant to this conversation:

[Canon Reference 1: goal_setting]
{chunk content}

---

[Canon Reference 2: goal_setting]
{chunk content}

END CANON CONTEXT
```

**Verification:**
- Canon context appears as 5th prompt in assembled prompts
- Format includes pillar identification
- Multiple chunks separated by "---"

---

### Test 8: Enforcement Still Enforces Prompts

**Purpose:** Verify enforcement still hard-fails on missing prompts even with canon

**Test Strategy:**
Temporarily break prompt registry (simulated), make request with valid canon retrieval.

**Expected Result:**
- Enforcement fails with `MISSING_PROMPT` violation
- Canon retrieval succeeded but doesn't bypass prompt enforcement
- Response: 400 ENFORCEMENT_FAILED

---

## Audit Event Verification

### Check Retrieval Events
```sql
SELECT
  user_id,
  event_type,
  created_at,
  metadata->>'request_id' as request_id,
  metadata->>'chunk_count' as chunk_count,
  metadata->'canon_version_ids' as canon_versions
FROM audit_events
WHERE event_type IN ('retrieval_attempt', 'retrieval_success', 'retrieval_none')
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

### Verify NO Canon Content Logged
```sql
SELECT
  event_type,
  metadata
FROM audit_events
WHERE event_type IN ('retrieval_success', 'enforcement_pass', 'orchestration_complete')
  AND created_at > NOW() - INTERVAL '5 minutes';
```

**Critical Check:** Ensure metadata does NOT contain:
- Canon chunk content/text
- Full document content
- Specific chunk text

**Only allowed in metadata:**
- canon_version_ids (e.g., ["goal_setting-1.0.0"])
- chunk_count (number)
- canon_included (boolean)
- journey_phase (from context)

---

### Count Retrieval Success vs None
```sql
SELECT
  CASE
    WHEN event_type = 'retrieval_success' THEN 'success'
    WHEN event_type = 'retrieval_none' THEN 'none'
  END as result,
  COUNT(*) as count
FROM audit_events
WHERE event_type IN ('retrieval_success', 'retrieval_none')
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY result;
```

---

## Database Verification

### Check Canon Tables
```sql
SELECT
  schemaname,
  tablename,
  rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'canon_%'
ORDER BY tablename;
```

**Expected:**
- canon_documents (RLS enabled)
- canon_chunks (RLS enabled)

### Check Canon Documents
```sql
SELECT
  id,
  title,
  pillar,
  journey_phase,
  version
FROM canon_documents
ORDER BY created_at;
```

**Expected:** At least 2 documents with different pillars and journey_phases

### Check Canon Chunks
```sql
SELECT
  id,
  document_id,
  chunk_index,
  pillar,
  journey_phase,
  tags,
  version
FROM canon_chunks
ORDER BY document_id, chunk_index;
```

**Expected:** Multiple chunks per document, sequential chunk_index, tags populated

### Verify RLS Policies
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'canon_%';
```

**Expected:**
- Authenticated users can SELECT canon_documents
- Authenticated users can SELECT canon_chunks
- Service role can manage (ALL) both tables
- No INSERT/UPDATE/DELETE for regular users

---

## Success Criteria

- [x] Canon tables created with RLS enabled
- [x] Sample canon documents and chunks populated
- [x] Retrieval returns 0-3 chunks based on relevance
- [x] Low-confidence chunks filtered out (score < 0.5)
- [x] Retrieval logged with chunk_count and canon_version_ids
- [x] NO canon content in audit logs
- [x] Canon context formatted correctly for LLM
- [x] Enforcement still hard-fails on missing prompts
- [x] Requests proceed without canon when no matches found
- [x] journey_phase filtering works
- [x] pillar filtering works
- [x] topic_hint affects relevance scoring
- [x] Maximum 3 chunks returned
- [x] Deterministic retrieval (same input = same output)

---

## Out of Scope Verification

Confirm these are NOT present:

- [ ] User-generated content in canon
- [ ] LLM calls during retrieval
- [ ] Embeddings or vector search (tags and metadata only)
- [ ] Auto-expansion of canon content
- [ ] UI for canon management
- [ ] Canon versioning workflows
- [ ] Dynamic canon loading at runtime

---

## Edge Cases

### Edge Case 1: Empty journey_state
```json
"journey_state": {}
```
**Expected:** Enforcement fails with `MISSING_STATE_FIELD` (journey_phase required)

### Edge Case 2: Multiple pillars match
If journey_phase="onboarding" and pillar not specified, may return chunks from multiple pillars.
**Expected:** Up to 3 chunks, highest scoring regardless of pillar

### Edge Case 3: Canon retrieval fails (database error)
**Expected:**
- Retrieval returns empty result (fail gracefully)
- Audit: `retrieval_none` or error logged
- Request proceeds without canon (enforcement and orchestration continue)

---

## Notes

- Canon is read-only for users (SELECT only via RLS)
- Canon chunks are pre-processed and tagged at ingestion time
- Retrieval uses simple relevance scoring (not embeddings)
- Relevance formula:
  - journey_phase match: +0.5
  - pillar match: +0.3
  - topic_hint tag match: +0.2
- Confidence threshold: 0.5
- Canon version IDs format: "{pillar}-{version}"
- Canon context appears as additional prompt section (after the 4 core prompts)
- Enforcement validates core 4 prompts regardless of canon presence
