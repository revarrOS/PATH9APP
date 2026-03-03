# LLM Adapter Documentation

## Overview

The LLM Adapter provides a secure, configurable interface to real language models (OpenAI and Anthropic) with comprehensive safety guards, audit logging, and error handling.

## Architecture

### Components

```
llm-adapter.ts          → Main adapter interface
├── llm-config.ts       → Configuration loading and validation
├── llm-guards.ts       → Safety guards and validations
├── llm-types.ts        → TypeScript interfaces
├── llm-openai.ts       → OpenAI integration
└── llm-anthropic.ts    → Anthropic integration
```

### Integration Flow

```
Request → Policy → Enforcement → Canon Retrieval
    ↓
LLM Guards Validation
    ↓
LLM Config Loading
    ↓
Provider Selection (OpenAI/Anthropic)
    ↓
API Call with Timeout & Retry
    ↓
Response or Error
    ↓
Audit Logging (NO prompts/responses)
```

## Configuration

### Environment Variables

```bash
# Provider Selection
LLM_PROVIDER=openai              # "openai" or "anthropic"

# API Keys
OPENAI_API_KEY=sk-...            # Required if provider=openai
ANTHROPIC_API_KEY=sk-ant-...     # Required if provider=anthropic

# Model Selection
OPENAI_MODEL=gpt-4o-mini         # Default: gpt-4o-mini
ANTHROPIC_MODEL=claude-3-5-haiku-20241022  # Default: claude-3-5-haiku-20241022

# Safety Configuration
LLM_TEMPERATURE=0.3              # Max: 0.3 (enforced)
LLM_MAX_TOKENS=2000              # Range: 100-4000
LLM_TIMEOUT_MS=30000             # Milliseconds
LLM_MAX_RETRIES=2                # Range: 0-5
```

### Safe Defaults

If environment variables are missing, the system uses:
- Provider: `openai`
- Model: `gpt-4o-mini` (OpenAI) or `claude-3-5-haiku-20241022` (Anthropic)
- Temperature: `0.3`
- Max tokens: `2000`
- Timeout: `30000ms` (30 seconds)
- Max retries: `2`

### Temperature Safety

**Critical:** Temperature is ALWAYS capped at 0.3, even if a higher value is configured. This ensures stable, deterministic outputs for production use.

```typescript
const temperature = Math.min(
  parseFloat(Deno.env.get("LLM_TEMPERATURE") || "0.3"),
  0.3  // MAX_ALLOWED_TEMPERATURE
);
```

## Hard Guards

The LLM adapter enforces three non-negotiable safety guards:

### Guard 1: Enforcement Must Pass

```typescript
if (!context.enforcement_passed) {
  return error: "ENFORCEMENT_NOT_PASSED"
}
```

The LLM will refuse all calls unless prompt enforcement has successfully validated the prompt structure.

### Guard 2: Prompt Order Validated

```typescript
expectedOrder = [
  "gemma-core-system-v3",
  "boundary-safety-v3",
  "state-template-v2",
  "knowledge-canon-v2"
]
```

Prompts must be in the exact required order. Any deviation causes the call to be rejected.

### Guard 3: Canon Appended Last

If canon context is included, it MUST be the final prompt in the array. This ensures:
- Core instructions are not overridden
- Canon is treated as reference material, not instructions
- Clear separation between system prompts and contextual knowledge

## Provider Implementations

### OpenAI

**API:** `https://api.openai.com/v1/chat/completions`

**Request Format:**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "system", "content": "prompt1"},
    {"role": "system", "content": "prompt2"},
    ...
  ],
  "temperature": 0.3,
  "max_tokens": 2000
}
```

**Features:**
- All prompts sent as system messages
- Token usage tracking (prompt_tokens, completion_tokens)
- Automatic retry with exponential backoff
- Timeout enforcement

### Anthropic

**API:** `https://api.anthropic.com/v1/messages`

**Request Format:**
```json
{
  "model": "claude-3-5-haiku-20241022",
  "system": ["prompt1", "prompt2", ...],
  "messages": [
    {"role": "user", "content": "Please respond based on the system context provided."}
  ],
  "temperature": 0.3,
  "max_tokens": 2000
}
```

**Features:**
- Prompts sent in system array
- Single user message to trigger response
- Token usage tracking (input_tokens, output_tokens)
- Automatic retry with exponential backoff
- Timeout enforcement

## Timeout & Retry Logic

### Timeout

Each API call has a configurable timeout (default 30 seconds):

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

const response = await fetch(url, {
  signal: controller.signal,
  ...
});
```

If the timeout is exceeded:
- Request is aborted
- Error is caught and logged
- Retry logic may attempt again

### Retry Logic

Failed calls are retried with exponential backoff:

```typescript
for (let attempt = 0; attempt <= max_retries; attempt++) {
  try {
    // Attempt API call
    return success;
  } catch (error) {
    if (attempt < max_retries) {
      // Wait 1s, 2s, 3s... before retry
      await delay(1000 * (attempt + 1));
    }
  }
}
return failure;
```

**Retry Scenarios:**
- Network errors
- Temporary API failures (500, 503)
- Timeouts
- Rate limit errors (if provider returns retry-able error)

**No Retry Scenarios:**
- Authentication errors (401, 403)
- Invalid request errors (400)
- Guard violations
- Configuration errors

## Audit Logging

### Events Logged

**1. llm_call_attempt**
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "temperature": 0.3,
  "max_tokens": 2000,
  "prompt_count": 5
}
```

Logged immediately before LLM call.

**2. llm_call_success**
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "prompt_tokens": 1250,
  "completion_tokens": 180,
  "total_tokens": 1430
}
```

Logged on successful LLM response.

**3. llm_call_failure**
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "error": "Request timeout exceeded"
}
```

Logged on any failure (timeout, API error, guard violation).

### What is NEVER Logged

**CRITICAL:** The following are NEVER written to audit logs:

- ❌ Prompt text or content
- ❌ Core system prompt
- ❌ Boundary safety prompt
- ❌ State template content
- ❌ Knowledge canon content
- ❌ Canon chunks
- ❌ User message content
- ❌ LLM response text

**Only metadata is logged:**
- ✅ Provider name
- ✅ Model name
- ✅ Configuration values (temperature, max_tokens)
- ✅ Token counts
- ✅ Prompt count (number of prompts)
- ✅ Error messages (generic, no prompt content)
- ✅ Timestamp

## Error Handling

### Error Types

**Configuration Errors**
```typescript
{
  success: false,
  error: "Temperature 0.7 exceeds maximum 0.3"
}
```

**Guard Violations**
```typescript
{
  success: false,
  error: "ENFORCEMENT_NOT_PASSED: enforcement must pass before calling LLM"
}
```

**API Errors**
```typescript
{
  success: false,
  error: "OpenAI API error: 401 - Invalid API key"
}
```

**Timeout Errors**
```typescript
{
  success: false,
  error: "Request timeout exceeded"
}
```

**Missing API Key**
```typescript
{
  success: false,
  error: "OPENAI_API_KEY not configured"
}
```

### Error Flow

```
Error Occurs
    ↓
Catch Exception
    ↓
Log llm_call_failure
    ↓
Return Error Response
    ↓
Return 500 LLM_CALL_FAILED to Client
```

All errors result in:
1. Explicit error message
2. Audit log entry
3. Graceful response to client
4. NO crash or hang

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "response": "Hello! I'm Gemma...",
    "journey_state": {...},
    "processed_at": "2025-12-17T12:00:00Z",
    "llm_metadata": {
      "model": "gpt-4o-mini",
      "provider": "openai",
      "prompt_tokens": 1250,
      "completion_tokens": 180,
      "total_tokens": 1430,
      "timestamp": "2025-12-17T12:00:00Z"
    }
  },
  "request_id": "req-123"
}
```

### Failure Response

```json
{
  "error": "LLM call failed",
  "code": "LLM_CALL_FAILED",
  "request_id": "req-123"
}
```

## Token Usage Tracking

Token counts are tracked for cost monitoring and optimization:

```sql
SELECT
  metadata->>'model' as model,
  SUM((metadata->>'prompt_tokens')::int) as total_prompt_tokens,
  SUM((metadata->>'completion_tokens')::int) as total_completion_tokens,
  COUNT(*) as total_calls
FROM audit_events
WHERE event_type = 'llm_call_success'
  AND created_at > NOW() - INTERVAL '1 day'
GROUP BY metadata->>'model';
```

## Switching Providers

To switch from OpenAI to Anthropic (or vice versa):

1. Update environment variable:
```bash
LLM_PROVIDER=anthropic
```

2. Ensure API key is configured:
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

3. Optionally specify model:
```bash
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
```

4. Restart edge function

No code changes required.

## Testing

See `tests/llm-adapter-tests.md` for comprehensive test cases covering:
- Configuration validation
- Hard guard enforcement
- OpenAI integration
- Anthropic integration
- Timeout and retry logic
- Audit logging
- Error handling
- Token tracking
- End-to-end integration

## Security Considerations

### API Key Security

- API keys stored in environment variables
- Never exposed in responses or logs
- Validated before making API calls
- Separate keys for OpenAI and Anthropic

### Prompt Injection Prevention

- Guards validate prompt structure
- Prompt order enforced
- Canon context clearly separated
- No user free-text input to prompts (journey_state only)

### Rate Limiting

- Policy layer enforces rate limits (Unit 2)
- Additional provider-level rate limiting may apply
- Retry logic respects rate limit responses

### Audit Trail

- All LLM calls audited
- Token usage tracked
- Errors logged with context
- No sensitive content in logs

## Performance

### Typical Latency

- OpenAI (gpt-4o-mini): 2-5 seconds
- Anthropic (claude-3-5-haiku): 2-4 seconds
- Includes network, API processing, and retry logic

### Optimization Tips

1. **Model Selection:** Use smaller, faster models for production
2. **Max Tokens:** Set appropriately (2000 is reasonable)
3. **Temperature:** 0.3 provides good consistency
4. **Timeout:** 30s allows for occasional slow responses
5. **Retries:** 2 retries balance reliability and latency

## Stability

With temperature=0.3, the same input produces:
- Consistent tone and structure
- Similar content and recommendations
- Predictable length
- Minor variations in phrasing

This is ideal for production systems where reliability and consistency matter more than creative diversity.

## Integration with Other Units

### Unit 1: Edge Services Framework
LLM adapter runs as part of the orchestrate edge function.

### Unit 2: Policy & Audit Isolation
Policy validation runs BEFORE LLM call. All LLM events audited.

### Unit 3: Prompt Enforcement Engine
Enforcement MUST pass before LLM call. Prompt order validated by guards.

### Unit 4: Knowledge Canon
Canon chunks (if retrieved) appended as final prompt. Position validated by guards.

### Unit 5: LLM Adapter
Coordinates all prior units, calls real LLM, returns response.

## Acceptance Verification

✅ Same request produces stable output (temperature=0.3)
✅ Safety/enforcement unchanged (guards enforced)
✅ Failure paths explicit and audited (all errors logged)
✅ No prompts in audit logs (only metadata)
✅ No responses in audit logs (only token counts)
✅ Temperature capped at 0.3 (enforced in config)
✅ Timeouts enforced (30s default)
✅ Retries work (exponential backoff)
✅ OpenAI integration functional
✅ Anthropic integration functional
✅ Provider switching via env var

## Troubleshooting

### LLM call always fails

1. Check API key is configured: `echo $OPENAI_API_KEY`
2. Verify provider matches key: `LLM_PROVIDER=openai` requires `OPENAI_API_KEY`
3. Check audit logs for specific error: `SELECT * FROM audit_events WHERE event_type='llm_call_failure'`
4. Test API key with curl to verify it works

### Responses are inconsistent

1. Verify temperature is 0.3: Check audit log `llm_call_attempt` event
2. Check if prompts are changing (e.g., dynamic state)
3. Review journey_state differences between requests

### Timeout errors

1. Increase timeout: `LLM_TIMEOUT_MS=60000`
2. Check network connectivity to provider
3. Try different model (may be faster)
4. Check provider status page

### High token usage

1. Review prompt count: Should be 4-5 (5 if canon included)
2. Check state template: Avoid verbose context in journey_state
3. Reduce max_tokens if responses too long
4. Monitor via audit logs: `SELECT SUM((metadata->>'total_tokens')::int) FROM audit_events WHERE event_type='llm_call_success'`

## Future Enhancements (Out of Scope)

- Streaming responses
- Function calling / tool use
- Multi-turn conversation memory
- Dynamic temperature adjustment
- Fine-tuning integration
- Custom model hosting
- Embedding generation
- Image input support
