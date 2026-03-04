# Edge Services Framework - Control Plane Documentation

## Overview

The Edge Services Framework provides a mandatory control plane that all requests must pass through. It enforces strict policy validation, authentication, rate limiting, and audit logging before allowing requests to proceed to orchestration.

**Key Principle:** Every request is validated. Hard-fail on violations. No silent fallbacks.

---

## Architecture

```
Client Request
    ↓
Request Envelope Construction
    ↓
Edge Function (Supabase)
    ↓
Policy Middleware
    ├─ Auth Validation
    ├─ Envelope Validation
    ├─ User ID Match Check
    └─ Rate Limiting
    ↓
[PASS] → Orchestration Handler (Mock) → Audit Log → Response
    ↓
[FAIL] → Audit Log → Error Response
```

---

## Request Envelope

Every request must include a complete envelope with these fields:

```typescript
interface RequestEnvelope {
  user_id: string;                    // From authenticated session
  journey_state: Record<string, unknown>;  // Opaque, pass-through
  consent_flags: {
    data_processing: boolean;
    analytics: boolean;
    third_party_sharing: boolean;
  };
  request_id: string;                 // Unique identifier (UUID format)
}
```

### Envelope Rules

1. **user_id**: Must match authenticated user (from JWT token)
2. **journey_state**: Opaque object, passed through untouched
3. **consent_flags**: All three flags must be present and boolean
4. **request_id**: Required for tracing and audit correlation

**Missing or invalid fields → 400 Bad Request + audit log**

---

## Policy Middleware

### 1. Authentication (Required)

- **Endpoint:** All except `/health`
- **Method:** JWT validation via Supabase auth.getUser()
- **Failure:** 401 Unauthorized

### 2. Envelope Validation

Checks:
- Envelope object exists
- All required fields present
- Field types correct
- Consent flags are booleans

**Failure:** 400 Bad Request with violation details

### 3. User ID Match

Validates `envelope.user_id === auth.uid()`

**Failure:** 403 Forbidden + audit log (`policy_block`)

### 4. Rate Limiting

- **Limit:** 100 requests per 60 seconds per user
- **Scope:** Per authenticated user_id
- **Storage:** In-memory (resets on function cold start)

**Failure:** 429 Too Many Requests + audit log (`policy_block`)

---

## Error Handling

### Standard Error Shape

```typescript
interface StandardError {
  error: string;           // Human-readable message
  code: string;            // Machine-readable code
  request_id?: string;     // From envelope (if available)
  violations?: PolicyViolation[];  // For validation errors
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `INVALID_JSON` | 400 | Request body is not valid JSON |
| `INVALID_ENVELOPE` | 400 | Envelope validation failed |
| `USER_ID_MISMATCH` | 403 | Envelope user_id != auth user_id |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests from user |
| `METHOD_NOT_ALLOWED` | 405 | Wrong HTTP method |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Policy Violations

For validation errors, the response includes specific violations:

```typescript
interface PolicyViolation {
  code: string;      // e.g., "MISSING_USER_ID"
  message: string;   // Human-readable description
  field?: string;    // Which field failed
}
```

**Example:**
```json
{
  "error": "Request envelope validation failed",
  "code": "INVALID_ENVELOPE",
  "request_id": "abc123",
  "violations": [
    {
      "code": "MISSING_USER_ID",
      "message": "user_id is required in request envelope",
      "field": "user_id"
    }
  ]
}
```

---

## Audit Logging

### What Gets Logged

Every policy decision is audited to the `audit_events` table:

**Event Types:**
- `policy_pass` - Request passed all checks
- `policy_block` - Request blocked by policy
- `orchestration_complete` - Orchestration finished

**Logged Fields:**
- `user_id` - From authenticated session
- `event_type` - Type of event
- `created_at` - Timestamp (automatic)
- `metadata` - Contains:
  - `request_id` - From envelope
  - `timestamp` - ISO string
  - `reason` - Why blocked (for `policy_block`)
  - `violations` - Validation failures (for `policy_block`)
  - `rate_limit_remaining` - For `policy_pass`

### What is NOT Logged

- Request payload content
- Journey state details
- User data from envelope
- Internal error details

**Reason:** Privacy and security. Audit log is for policy enforcement tracking only.

---

## Orchestration Handler

### Current Behavior (Mock)

The orchestration handler is intentionally minimal:

```typescript
{
  success: true,
  data: {
    message: "Orchestration handler executed successfully",
    journey_state: body.journey_state,  // Pass-through
    processed_at: new Date().toISOString()
  },
  request_id: envelope.request_id
}
```

### Out of Scope (Non-Negotiable)

- No AI/LLM calls
- No Gemma logic
- No journey decisions
- No feature logic
- No business logic

**Purpose:** This is a control plane framework, not a feature implementation.

---

## Client Usage

### Using orchestrationService

```typescript
import { orchestrationService } from '@/services';

// Option 1: Create envelope and orchestrate separately
const envelope = await orchestrationService.createEnvelope(
  { step: 'onboarding', progress: 0.5 },
  { data_processing: true, analytics: false, third_party_sharing: false }
);

const response = await orchestrationService.orchestrate(envelope);

if (response.success) {
  console.log('Data:', response.data);
} else {
  console.error('Error:', response.error);
}

// Option 2: Single request (convenience method)
const response = await orchestrationService.request(
  { step: 'onboarding', progress: 0.5 }
);
```

### Response Handling

```typescript
interface OrchestrationResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: StandardError;
  request_id: string;
}

if (response.success) {
  // Handle success
  const { data } = response;
} else {
  // Handle error
  const { error } = response;

  switch (error.code) {
    case 'UNAUTHORIZED':
      // Redirect to login
      break;
    case 'RATE_LIMIT_EXCEEDED':
      // Show rate limit message
      break;
    case 'INVALID_ENVELOPE':
      // Log violations for debugging
      console.error(error.violations);
      break;
    default:
      // Generic error
  }
}
```

---

## Edge Functions

### Deployed Functions

1. **health** (`/functions/v1/health`)
   - Method: GET
   - Auth: Not required
   - Purpose: Service health check
   - Response: Status, service name, timestamp, version

2. **orchestrate** (`/functions/v1/orchestrate`)
   - Method: POST
   - Auth: Required (JWT)
   - Purpose: Main orchestration endpoint
   - Body: RequestEnvelope
   - Response: OrchestrationResponse

3. **api-gateway** (`/functions/v1/api-gateway`)
   - Method: GET
   - Auth: Required (JWT)
   - Purpose: Legacy endpoint (to be deprecated)

---

## Rate Limiting Details

### Configuration

- **Window:** 60 seconds (60000ms)
- **Max Requests:** 100 per window per user
- **Storage:** In-memory Map (per function instance)
- **Reset:** Automatic after window expires

### Response Headers

Successful requests include:
```
X-Rate-Limit-Remaining: 99
```

### Limitations

- Rate limit state is per function instance
- Cold starts reset the counter
- Not distributed across multiple instances
- For production, consider Redis/external store

---

## Security Guarantees

1. **Authentication Required:** All orchestration requests must be authenticated
2. **User Isolation:** Users can only make requests with their own user_id
3. **Audit Trail:** All policy decisions are logged
4. **No Data Leakage:** Internal errors don't expose details
5. **RLS Protection:** Audit events enforce row-level security
6. **Hard Failures:** Policy violations stop processing immediately

---

## Testing

See `tests/edge-services-tests.md` for comprehensive test cases covering:

- Health endpoint accessibility
- Authentication enforcement
- Envelope validation
- User ID mismatch detection
- Rate limiting
- Audit logging verification
- User isolation

---

## Future Enhancements (Not in Scope)

These are explicitly out of scope for Build Unit 2:

- Distributed rate limiting
- Advanced consent management
- Journey state processing
- AI/LLM integration
- Business logic in orchestration
- Additional database tables
- Feature implementations

**Build Unit 2 Goal:** Establish the control plane. Features come later.

---

## Files

### Client-Side
- `types/request-envelope.ts` - TypeScript types
- `services/orchestration.service.ts` - Client service
- `services/index.ts` - Service exports

### Server-Side (Edge Functions)
- `supabase/functions/health/index.ts` - Health check
- `supabase/functions/orchestrate/index.ts` - Main orchestration
- `supabase/functions/orchestrate/policy.ts` - Policy middleware
- `supabase/functions/_shared/policy.ts` - Shared policy module (reference)

### Documentation
- `docs/EDGE_SERVICES_FRAMEWORK.md` - This file
- `tests/edge-services-tests.md` - Test cases

---

## Summary

The Edge Services Framework is a **policy-first** control plane that ensures:

1. Every request is authenticated
2. Every request has a valid envelope
3. Every request is rate-limited
4. Every policy decision is audited
5. No silent failures or bypasses

This foundation enables safe, traceable, and controlled processing of all future requests.
