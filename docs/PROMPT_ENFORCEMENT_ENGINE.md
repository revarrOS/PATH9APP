# Prompt Enforcement Engine Documentation

## Overview

The Prompt Enforcement Engine ensures all AI interactions use a complete, ordered, and validated set of prompts. It acts as a mandatory gate between policy validation and LLM calls, enforcing prompt completeness, state requirements, and assembly correctness.

**Key Principle:** No LLM call without complete prompt enforcement. Hard-fail on violations.

---

## Architecture

```
Request (with envelope + journey_state)
    ↓
Policy Middleware (Unit 2)
    ↓
[PASS] → Prompt Enforcement
         ├─ Load Registry (cached)
         ├─ Validate Prompts Complete
         ├─ Validate State Context
         ├─ Assemble Prompts (hydrate template)
         └─ Validate Prompt Order
    ↓
[PASS] → Mock LLM Adapter → Response
    ↓
[FAIL] → Audit Log → Error Response (400)
```

---

## Prompt Registry

### Registry Structure

The prompt registry contains 4 immutable prompts:

1. **Gemma Core System Prompt** (`gemma-core-system-v1`)
   - Defines Gemma's role and principles
   - Establishes conversational guidelines
   - Sets boundaries and capabilities

2. **Boundary & Safety Prompt** (`boundary-safety-v3`)
   - 8 explicit boundary categories (medical, crisis, emotional, spiritual, dependency, knowledge, consent, response control)
   - Comprehensive safety guidelines for all interaction scenarios
   - Privacy and data handling guidelines

3. **State Template** (`state-template-v2`)
   - Conversation state structure
   - User context placeholders
   - Hydrated with journey_state from envelope

4. **Knowledge Canon Usage Prompt** (`knowledge-canon-v2`)
   - Guidelines for using knowledge frameworks
   - When to apply structured approaches
   - Integration principles

### Prompt Format

Each prompt file has metadata and content:

```
VERSION: 1.0.0
ID: prompt-identifier-v1
CREATED: 2025-12-17
IMMUTABLE: true

---

[Prompt Content]
```

### Immutability

- Prompts are loaded once at function startup
- Cached in memory for subsequent requests
- Cannot be modified at runtime
- Version IDs enforced in metadata

### Storage

Prompts are embedded in the edge function code (`prompt-registry.ts`). They are NOT stored in:
- Database tables
- Config files loaded at runtime
- External services

**Reason:** Ensures prompt integrity and prevents runtime tampering.

---

## State Context

### Required Fields

Every request must include `journey_phase` in `journey_state`:

```typescript
{
  journey_state: {
    journey_phase: string;  // REQUIRED
    // optional fields...
  }
}
```

### Optional Fields

These fields are hydrated into the state template if present:

- `session_count` (number)
- `last_interaction_date` (string)
- `user_goals` (string)
- `focus_areas` (string)
- `recent_topics` (string)
- `pending_questions` (string)
- `conversation_tone` (string)

### Template Hydration

The state template uses Handlebars-style syntax:

```
Journey Phase: {{journey_phase}}
Session Count: {{session_count}}

{{#if user_goals}}
- Current Goals: {{user_goals}}
{{/if}}
```

**Hydration Process:**
1. Replace `{{variable}}` with state values or defaults
2. Process `{{#if field}}...{{/if}}` conditionals
3. Remove empty sections
4. Trim excess whitespace

**Example:**
```typescript
// Input state
{
  journey_phase: "onboarding",
  session_count: 1
}

// Hydrated output
Journey Phase: onboarding
Session Count: 1
Last Interaction: none

Instructions:
- Use this state to maintain continuity...
```

---

## Enforcement Rules

### 1. Prompt Registry Validation

Checks:
- All 4 prompts present
- Each prompt has valid metadata
- Prompts successfully parsed

**Failure:** `MISSING_PROMPT` violation

### 2. State Context Validation

Checks:
- `journey_state` is an object
- `journey_phase` field present and not null/undefined

**Failure:** `MISSING_STATE` or `MISSING_STATE_FIELD` violation

### 3. Prompt Assembly

Checks:
- Template hydration succeeds
- 4 prompts assembled

**Failure:** `ASSEMBLY_FAILED` or `INCOMPLETE_PROMPTS` violation

### 4. Prompt Order Validation

Checks:
- Prompts in exact order:
  1. gemma-core-system-v3
  2. boundary-safety-v3
  3. state-template-v2 (hydrated)
  4. knowledge-canon-v2

**Failure:** `INCORRECT_PROMPT_ORDER` violation

### 5. Assembly Metadata Validation

Checks:
- `state_hydrated` flag is true
- Correct number of prompts
- All metadata present

**Failure:** `STATE_NOT_HYDRATED` violation

---

## Mock LLM Adapter

### Purpose

Provides a stub response without calling real LLM APIs.

### Response Structure

```typescript
{
  success: true,
  response: "Hello! I'm Gemma, and I'm here to support you...",
  metadata: {
    model: "mock-gemma-v1",
    prompt_count: 4,
    timestamp: "2025-12-17T10:30:00.000Z"
  }
}
```

### Stub Response

The mock always returns a hardcoded greeting message. It does NOT:
- Call external APIs
- Process prompt content
- Generate dynamic responses
- Use actual AI models

**Reason:** Build Unit 3 focuses on enforcement infrastructure, not LLM integration.

---

## Error Handling

### Enforcement Error Response

```json
{
  "error": "Prompt enforcement failed",
  "code": "ENFORCEMENT_FAILED",
  "request_id": "abc123",
  "violations": [
    {
      "code": "MISSING_STATE_FIELD",
      "message": "Required state field missing: journey_phase",
      "field": "journey_phase"
    }
  ]
}
```

### Enforcement Violation Codes

| Code | Description |
|------|-------------|
| `MISSING_STATE` | State context not provided or invalid |
| `MISSING_STATE_FIELD` | Required field missing from state |
| `MISSING_PROMPT` | Prompt missing from registry |
| `INCOMPLETE_PROMPTS` | Not all 4 prompts assembled |
| `INCORRECT_PROMPT_ORDER` | Prompts not in required order |
| `STATE_NOT_HYDRATED` | Template hydration failed |
| `ASSEMBLY_FAILED` | Error during prompt assembly |

---

## Audit Logging

### Enforcement Pass

```json
{
  "event_type": "enforcement_pass",
  "user_id": "...",
  "metadata": {
    "request_id": "abc123",
    "timestamp": "...",
    "prompt_version_ids": [
      "gemma-core-system-v3",
      "boundary-safety-v3",
      "state-template-v2",
      "knowledge-canon-v2"
    ],
    "state_hydrated": true
  }
}
```

### Enforcement Block

```json
{
  "event_type": "enforcement_block",
  "user_id": "...",
  "metadata": {
    "request_id": "abc123",
    "timestamp": "...",
    "reason": "prompt_enforcement_failed",
    "violations": [
      {
        "code": "MISSING_STATE_FIELD",
        "message": "Required state field missing: journey_phase",
        "field": "journey_phase"
      }
    ]
  }
}
```

### What is NOT Logged

**Privacy Protection:**
- NO prompt content/text
- NO assembled prompt strings
- NO state template values
- NO user journey state details
- NO LLM responses

**Only Logged:**
- Prompt version IDs (e.g., "gemma-core-system-v1")
- State hydration flag (boolean)
- Violation codes and messages
- Request metadata

---

## Integration with Orchestration

### Updated Flow (Build Unit 2 + 3)

```
1. Request with envelope
   ↓
2. Policy validation (auth, envelope, user_id, rate limit)
   → audit: policy_pass
   ↓
3. Initialize prompt registry (once, cached)
   ↓
4. Extract journey_state from envelope
   ↓
5. Enforce prompts (validate + assemble)
   → [PASS] audit: enforcement_pass
   → [FAIL] audit: enforcement_block, return 400
   ↓
6. Call mock LLM with assembled prompts
   ↓
7. Build response with LLM output
   → audit: orchestration_complete
   ↓
8. Return response with data
```

### Response Changes

**Before Build Unit 3:**
```json
{
  "success": true,
  "data": {
    "message": "Orchestration handler executed successfully",
    "journey_state": { ... },
    "processed_at": "..."
  },
  "request_id": "..."
}
```

**After Build Unit 3:**
```json
{
  "success": true,
  "data": {
    "response": "Hello! I'm Gemma...",  // From mock LLM
    "journey_state": { ... },
    "processed_at": "...",
    "llm_metadata": {
      "model": "mock-gemma-v1",
      "prompt_count": 4,
      "timestamp": "..."
    }
  },
  "request_id": "..."
}
```

---

## Client Usage

### Example: Valid Request

```typescript
import { orchestrationService } from '@/services';

const response = await orchestrationService.request(
  {
    journey_phase: 'onboarding',
    session_count: 1,
    user_goals: 'Improve productivity'
  }
);

if (response.success) {
  console.log('LLM Response:', response.data.response);
  console.log('Model:', response.data.llm_metadata.model);
  console.log('Prompt Count:', response.data.llm_metadata.prompt_count);
} else {
  // Handle enforcement failure
  if (response.error.code === 'ENFORCEMENT_FAILED') {
    console.error('Enforcement violations:', response.error.violations);
  }
}
```

### Example: Handling Enforcement Errors

```typescript
const response = await orchestrationService.request({
  // Missing journey_phase - will fail enforcement
  session_count: 1
});

if (!response.success && response.error.code === 'ENFORCEMENT_FAILED') {
  response.error.violations?.forEach(violation => {
    console.error(`[${violation.code}] ${violation.message}`);
    if (violation.field) {
      console.error(`  Field: ${violation.field}`);
    }
  });
}
```

---

## Files

### Client-Side
- `types/prompts.ts` - TypeScript types for prompts and enforcement

### Server-Side (Edge Function)
- `supabase/functions/orchestrate/types.ts` - Shared types
- `supabase/functions/orchestrate/prompt-registry.ts` - Prompt loading and parsing
- `supabase/functions/orchestrate/prompt-assembly.ts` - Template hydration and assembly
- `supabase/functions/orchestrate/enforcement.ts` - Validation and enforcement logic
- `supabase/functions/orchestrate/mock-llm.ts` - Mock LLM adapter
- `supabase/functions/orchestrate/index.ts` - Main orchestration (updated)

### Prompts (Reference)
- `config/prompts/gemma-core-system.txt`
- `config/prompts/boundary-safety.txt`
- `config/prompts/state-template.txt`
- `config/prompts/knowledge-canon-usage.txt`

### Documentation
- `docs/PROMPT_ENFORCEMENT_ENGINE.md` - This file
- `tests/prompt-enforcement-tests.md` - Test cases

---

## Security Guarantees

1. **Prompt Integrity:** Prompts loaded once at startup, immutable at runtime
2. **Completeness:** All 4 prompts required, hard-fail if any missing
3. **Order Enforcement:** Prompts must be in exact order
4. **State Validation:** Required fields enforced before assembly
5. **Audit Trail:** All enforcement decisions logged (pass and block)
6. **No Content Leakage:** Prompt text never logged to audit_events
7. **Deterministic:** Same state produces same hydrated template

---

## Out of Scope (Build Unit 3)

These are explicitly NOT included:

- Real LLM API calls (OpenAI, Anthropic, Google)
- User message text in requests
- Knowledge retrieval or RAG
- Journey decision logic
- Response processing or formatting
- Conversation history storage
- Prompt versioning workflows
- Dynamic prompt loading
- A/B testing of prompts

**Focus:** Infrastructure for enforcing prompt completeness and order.

---

## Future Enhancements (Not in Scope)

- Real LLM integration (Build Unit 4+)
- User message processing
- Conversation context management
- Prompt version upgrades
- Dynamic prompt selection based on journey phase
- Multi-turn conversation support
- Response streaming

---

## Summary

The Prompt Enforcement Engine ensures:

1. All 4 prompts are present and valid
2. Prompts are in the correct order
3. State context has required fields
4. Templates are hydrated with journey state
5. No LLM call without complete enforcement
6. All enforcement decisions are audited
7. No prompt content is leaked in logs

This foundation enables controlled, traceable, and safe AI interactions in future build units.
