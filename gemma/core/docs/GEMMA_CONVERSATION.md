# Gemma Single-Turn Conversation API

## Overview

The `/gemma/respond` endpoint provides a secure, single-turn conversation interface where users can send messages to Gemma and receive AI-generated responses. The endpoint maintains all safety guarantees from Units 1-5 while adding user message support.

## Endpoint

```
POST /functions/v1/gemma-respond
```

**Authentication:** Required (Bearer token)

**Content-Type:** `application/json`

## Request Format

### Request Body

```json
{
  "user_id": "string (UUID)",
  "user_message": "string (1-1000 chars, required)",
  "journey_state": {
    "journey_phase": "string (required)",
    "pillar": "string (optional)",
    "session_count": "number (optional)",
    ...
  },
  "consent_flags": {
    "data_processing": "boolean (required)",
    "analytics": "boolean (required)",
    "third_party_sharing": "boolean (required)"
  },
  "request_id": "string (required, unique)"
}
```

### Field Descriptions

**user_id** (string, required)
- UUID of authenticated user
- Must match auth token user_id
- Used for audit logging and policy enforcement

**user_message** (string, required)
- User's message to Gemma
- Length: 1-1000 characters (hard limit)
- Whitespace normalized automatically
- Empty/whitespace-only messages rejected
- NOT stored in database (in-memory only)

**journey_state** (object, required)
- Pass-through context for canon retrieval and state hydration
- NOT modified by endpoint
- `journey_phase` required for enforcement
- Other fields optional (pillar, session_count, user_goals, etc.)

**consent_flags** (object, required)
- `data_processing`: Must be true for processing
- `analytics`: Enables analytics logging
- `third_party_sharing`: LLM API usage consent

**request_id** (string, required)
- Unique identifier for request tracking
- Used in audit logs and error responses

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "response_text": "Hello! I'm Gemma, your personal development companion...",
    "llm_metadata": {
      "model": "gpt-4o-mini",
      "provider": "openai",
      "prompt_tokens": 1250,
      "completion_tokens": 180,
      "total_tokens": 1430,
      "timestamp": "2025-12-17T12:00:00.000Z"
    },
    "prompt_versions": [
      "gemma-core-system-v3",
      "boundary-safety-v3",
      "state-template-v2",
      "knowledge-canon-v2"
    ],
    "canon_included": true,
    "canon_chunk_count": 2,
    "processed_at": "2025-12-17T12:00:00.000Z"
  },
  "request_id": "req-123"
}
```

### Response Fields

**response_text** (string)
- LLM-generated response to user message
- Maintains Gemma persona (warm, curious, non-prescriptive)
- May reference canon concepts if canon included
- Directly addresses user's question/input

**llm_metadata** (object)
- `model`: Actual LLM model used
- `provider`: "openai" or "anthropic"
- `prompt_tokens`: Input token count
- `completion_tokens`: Output token count
- `total_tokens`: Sum of prompt + completion
- `timestamp`: ISO 8601 timestamp of LLM call

**prompt_versions** (array of strings)
- Version IDs of prompts used in this request
- 3 items if no canon, 4 items if canon included
- IDs only, NO content

**canon_included** (boolean)
- `true` if knowledge canon chunks were retrieved and included
- `false` if no canon chunks matched (0 chunks)

**canon_chunk_count** (number)
- 0 if no canon retrieved
- 1-3 if canon chunks included

**processed_at** (string)
- ISO 8601 timestamp of response generation

### Error Response (4xx, 5xx)

```json
{
  "error": "user_message must not exceed 1000 characters (got 1050)",
  "code": "MESSAGE_TOO_LONG",
  "request_id": "req-123",
  "violations": []
}
```

**Error Codes:**

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_JSON` | 400 | Request body is not valid JSON |
| `INVALID_ENVELOPE` | 400 | Request envelope validation failed |
| `INVALID_MESSAGE_TYPE` | 400 | user_message is not a string |
| `EMPTY_MESSAGE` | 400 | user_message is empty or whitespace-only |
| `MESSAGE_TOO_LONG` | 400 | user_message exceeds 1000 characters |
| `AUTH_REQUIRED` | 401 | Missing or invalid authentication |
| `USER_ID_MISMATCH` | 403 | user_id doesn't match auth token |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests (max 10/min) |
| `ENFORCEMENT_FAILED` | 400 | Prompt enforcement validation failed |
| `LLM_CALL_FAILED` | 500 | LLM API call failed |

## User Message Validation

### Length Constraints

- **Minimum:** 1 character (after normalization)
- **Maximum:** 1000 characters (after normalization)

### Normalization

Excessive whitespace is automatically normalized:

```
Input:  "Hello    there   how   are   you?"
Output: "Hello there how are you?"
```

Multiple spaces/tabs/newlines collapsed to single space, then trimmed.

### Rejection Criteria

Messages are rejected if:
1. Not a string type
2. Empty string
3. Whitespace-only (empty after normalization)
4. Length < 1 or > 1000 characters (after normalization)

## Request Examples

### Basic Message (No Canon)

```bash
curl -X POST https://{project}.supabase.co/functions/v1/gemma-respond \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_message": "Hello Gemma, what can you help me with?",
    "journey_state": {
      "journey_phase": "onboarding"
    },
    "consent_flags": {
      "data_processing": true,
      "analytics": false,
      "third_party_sharing": false
    },
    "request_id": "req-001"
  }'
```

### Message with Canon Context

```bash
curl -X POST https://{project}.supabase.co/functions/v1/gemma-respond \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_message": "I want to build a daily meditation habit. Where should I start?",
    "journey_state": {
      "journey_phase": "active_journey",
      "pillar": "habit_formation",
      "session_count": 5,
      "user_goals": "Build consistent habits",
      "focus_areas": "morning routine"
    },
    "consent_flags": {
      "data_processing": true,
      "analytics": true,
      "third_party_sharing": false
    },
    "request_id": "req-002"
  }'
```

## Processing Pipeline

```
Request Received
    ↓
1. Validate JSON + Envelope
    ↓
2. Validate user_message (1-1000 chars, normalize)
    ↓
3. Authenticate User (Bearer token)
    ↓
4. Check Rate Limit (10 req/min)
    ↓
5. Validate user_id Match
    ↓
6. Audit: policy_pass
    ↓
7. Audit: gemma_message_received (length only)
    ↓
8. Load Prompt Registry
    ↓
9. Retrieve Canon Chunks (0-3 based on journey_state)
    ↓
10. Enforce Prompts (4 core + optional canon)
    ↓
11. Audit: enforcement_pass
    ↓
12. Audit: llm_call_attempt
    ↓
13. Call LLM with system prompts + user message
    ↓
14. Audit: llm_call_success
    ↓
15. Audit: gemma_response_sent (metadata only)
    ↓
16. Return Response
```

## Audit Events

### New Events

**gemma_message_received**
```json
{
  "event_type": "gemma_message_received",
  "user_id": "...",
  "request_id": "...",
  "metadata": {
    "message_length": 65
  }
}
```
- Logged when user message is validated
- Contains message length ONLY, NOT content

**gemma_response_sent**
```json
{
  "event_type": "gemma_response_sent",
  "user_id": "...",
  "request_id": "...",
  "metadata": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "prompt_tokens": 1250,
    "completion_tokens": 180,
    "total_tokens": 1430,
    "response_length": 450
  }
}
```
- Logged when response is successfully sent
- Contains metadata and response length ONLY, NOT content

**gemma_response_blocked**
```json
{
  "event_type": "gemma_response_blocked",
  "user_id": "...",
  "request_id": "...",
  "metadata": {
    "reason": "enforcement_failed",
    "violation_count": 2
  }
}
```
- Logged when response is blocked (enforcement/LLM failure)
- Reasons: `enforcement_failed`, `llm_call_failed`, `prompt_registry_load_failed`

### Updated Events

**llm_call_attempt** now includes:
```json
{
  "metadata": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.3,
    "max_tokens": 2000,
    "prompt_count": 5,
    "user_message_length": 65
  }
}
```

## Privacy Guarantees

### What is NEVER Stored

- ❌ User message content (NOT in database)
- ❌ LLM response content (NOT in database)
- ❌ Conversation history (NOT in database)
- ❌ Message relationships (NO parent/child)

### What is NEVER Logged

- ❌ User message text (NOT in audit logs)
- ❌ LLM response text (NOT in audit logs)
- ❌ Prompt content (NOT in audit logs)
- ❌ Canon content (NOT in audit logs)

### What IS Logged (Metadata Only)

- ✅ Message length (integer)
- ✅ Response length (integer)
- ✅ Token counts (integers)
- ✅ Provider/model names (strings)
- ✅ Prompt version IDs (strings)
- ✅ Error messages (generic, no content)

## Single-Turn Only

### No Conversation Memory

Each request is completely independent:
- NO conversation_id or session_id
- NO reference to previous messages
- NO conversation history stored
- LLM has NO memory of prior turns

**Example:**
```
User: "My name is Alice"
Response: "Hello! Nice to meet you..."

(5 seconds later)

User: "What is my name?"
Response: "I don't have access to previous messages..."
```

This is by design - single-turn conversation only.

### journey_state is Pass-Through

- journey_state is used for canon retrieval and state hydration
- journey_state is NOT modified by the endpoint
- Client is responsible for updating journey_state
- NO session_count increment or journey phase transitions

## Canon Integration

### Canon Retrieval

- 0-3 chunks retrieved based on journey_state
- Matches on journey_phase, pillar, focus_areas, keywords
- Canon formatted and appended as 5th prompt
- Canon is optional (0 chunks is valid)

### Response Behavior

**With Canon (canon_included: true):**
- Response references canon concepts
- Example: "As mentioned in habit formation principles, the 2-minute rule..."
- More specific and informed

**Without Canon (canon_included: false):**
- Response uses core system prompts only
- More general guidance
- Still maintains Gemma persona

## Rate Limiting

**Limit:** 10 requests per minute per user

**Behavior:**
- 11th request within 1 minute: 429 Rate Limit Exceeded
- Audit: policy_block (reason: rate_limit_exceeded)
- Client should implement retry with backoff

## Error Handling

### Client-Side Errors (4xx)

**400 Bad Request:**
- Invalid JSON
- Invalid envelope
- Invalid user_message (empty, too long, wrong type)
- Enforcement failed

**401 Unauthorized:**
- Missing Authorization header
- Invalid/expired token

**403 Forbidden:**
- user_id mismatch (token user ≠ request user_id)

**429 Rate Limited:**
- Too many requests (> 10/min)

### Server-Side Errors (5xx)

**500 Internal Server Error:**
- LLM API call failed
- Prompt registry load failed
- Unexpected error

All errors return explicit error code and message.

## Best Practices

### Message Formatting

**Do:**
- Be specific and clear
- Keep under 1000 characters
- Use natural language
- Ask one question at a time

**Don't:**
- Send empty messages
- Include excessive whitespace
- Expect memory of previous messages
- Send multiple questions in one message

### journey_state Usage

**Do:**
- Provide accurate journey_phase
- Include pillar for topic-specific guidance
- Update session_count client-side
- Add focus_areas for targeted canon retrieval

**Don't:**
- Expect endpoint to update journey_state
- Leave journey_state empty (enforcement will fail)
- Mix incompatible fields (e.g., onboarding + pillar)

### Error Recovery

**Message Too Long:**
- Trim to 1000 characters
- Split into multiple requests (if needed)

**Rate Limited:**
- Wait 60 seconds
- Implement exponential backoff

**Enforcement Failed:**
- Check journey_state has required fields
- Verify journey_phase is valid

## Security

### Authentication

- Bearer token required in Authorization header
- Token must be valid and not expired
- user_id in request must match token user_id

### Data Protection

- User messages processed in-memory only
- NO persistent storage of messages or responses
- Audit logs contain metadata only (no content)
- All processing server-side (no client-side LLM calls)

### API Key Protection

- LLM API keys stored server-side only
- NEVER exposed to client
- Used securely in edge function

## Performance

**Expected Latency:**
- Message validation: < 1ms
- Policy validation: 10-50ms
- Canon retrieval: 50-100ms
- Enforcement: < 5ms
- LLM call: 2-5 seconds
- **Total: 2-6 seconds**

**Optimization:**
- Prompt registry cached (loaded once)
- Policy uses DB indexes
- Canon limited to 3 chunks
- Temperature 0.3 for faster inference

## Monitoring

### Health Check

Query audit events to monitor:

```sql
SELECT
  event_type,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) as avg_gap_seconds
FROM audit_events
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND event_type LIKE 'gemma_%'
GROUP BY event_type;
```

### Token Usage

Monitor LLM costs:

```sql
SELECT
  metadata->>'model' as model,
  SUM((metadata->>'prompt_tokens')::int) as total_prompt_tokens,
  SUM((metadata->>'completion_tokens')::int) as total_completion_tokens,
  COUNT(*) as request_count
FROM audit_events
WHERE event_type = 'gemma_response_sent'
  AND created_at > NOW() - INTERVAL '1 day'
GROUP BY metadata->>'model';
```

### Error Rate

Track failures:

```sql
SELECT
  metadata->>'reason' as failure_reason,
  COUNT(*) as count
FROM audit_events
WHERE event_type = 'gemma_response_blocked'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY metadata->>'reason';
```

## Troubleshooting

### "user_message is required"

- Check request body includes "user_message" field
- Verify spelling (exact match)

### "user_message must not exceed 1000 characters"

- Trim message to 1000 chars
- Remember: length checked AFTER whitespace normalization

### "Rate limit exceeded"

- Wait 60 seconds before next request
- Implement retry logic with exponential backoff

### "Prompt enforcement failed"

- Check journey_state has "journey_phase" field
- Verify journey_phase is a non-empty string

### "LLM call failed"

- Check LLM API key is configured (server-side)
- Verify network connectivity (server → OpenAI/Anthropic)
- Check audit logs for specific error

### Response doesn't address my question

- Make question more specific
- Check if canon is included (may need different journey_state)
- Verify journey_state provides relevant context

### Response seems generic

- Likely no canon retrieved (canon_included: false)
- Add pillar and focus_areas to journey_state
- Ensure journey_phase matches canon topics

## Future Enhancements (Out of Scope)

The following features are intentionally NOT included:

- Multi-turn conversation support
- Conversation history storage
- Message persistence
- Session management
- Conversation ID tracking
- Memory between turns
- Journey state updates
- Journey decision logic
- Conversation UI components

These may be added in future units if needed.

## Integration Examples

### JavaScript/TypeScript

```typescript
async function askGemma(
  userMessage: string,
  journeyState: Record<string, unknown>,
  userToken: string
): Promise<string> {
  const response = await fetch(
    'https://{project}.supabase.co/functions/v1/gemma-respond',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: getUserId(userToken),
        user_message: userMessage,
        journey_state: journeyState,
        consent_flags: {
          data_processing: true,
          analytics: true,
          third_party_sharing: false,
        },
        request_id: generateRequestId(),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${error.code}: ${error.error}`);
  }

  const data = await response.json();
  return data.data.response_text;
}
```

### React Hook

```typescript
function useGemmaChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await askGemma(
        message,
        getJourneyState(),
        getUserToken()
      );
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
}
```

## Summary

The `/gemma/respond` endpoint provides:
- ✅ Single-turn conversation with Gemma
- ✅ User message support (1-1000 chars)
- ✅ Complete integration with all prior units
- ✅ Canon-informed responses when relevant
- ✅ Full audit trail (metadata only)
- ✅ NO message storage or memory
- ✅ All safety guarantees maintained

For more details, see:
- `BUILD_UNIT_6_SUMMARY.md` - Implementation details
- `tests/gemma-conversation-tests.md` - Test cases
