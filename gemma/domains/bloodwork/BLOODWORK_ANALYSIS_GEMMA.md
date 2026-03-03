# Bloodwork Analysis (Gemma AI)

**Status**: Active
**Date Created**: 2026-02-01
**Feature**: AI-assisted bloodwork conversation support
**LLM Provider**: Claude (via Orchestrate)

---

## What This Feature Is

Bloodwork Analysis introduces Gemma AI into the Bloodwork Management product to support calm, human conversations about bloodwork data. This feature helps users:

- Review their blood test numbers and trends in plain language
- Understand what specific markers generally represent (encyclopedic knowledge)
- Prepare questions for their clinician
- See how their values have changed over time

## What This Feature Is NOT

This feature explicitly does NOT:

- ❌ Diagnose or interpret medical meaning
- ❌ Predict health outcomes or disease progression
- ❌ Raise alerts, flags, or warnings about values
- ❌ Compare user values to "normal" or "healthy" individuals
- ❌ Suggest treatments, supplements, medications, or lifestyle changes
- ❌ Simulate treatment effects
- ❌ Store conversation history in the database
- ❌ Maintain memory across sessions
- ❌ Provide medical advice of any kind

---

## Architecture

### Data Flow

```
User (BloodworkChat.tsx)
  ↓ [POST] ephemeral conversation history + current message
Edge Function (bloodwork-ai-respond)
  ↓ Authenticate user (JWT)
  ↓ Fetch bloodwork entries (read-only, RLS-safe, last 12 months)
  ↓ Apply safety layer 1: Intent detection
  ↓ Build bloodwork context
  ↓ Apply bloodwork-specific system prompt
  ↓ [POST to /orchestrate]
Orchestrate
  ↓ Apply prompt enforcement
  ↓ Call LLM adapter (Claude)
  ↓ Return response
Edge Function
  ↓ Apply safety layer 2: Response validation
  ↓ Return to client OR safe fallback
Client
  ↓ Append to ephemeral conversation array
  ↓ Render message
```

### Component Locations

**UI Components** (Product-contained):
- `/app/(tabs)/medical/bloodwork/analysis/index.tsx` - Route/screen
- `/products/bloodwork/components/BloodworkChat.tsx` - Chat UI component

**AI Logic** (Product-contained):
- `/products/bloodwork/ai/bloodwork-boundaries.ts` - Safety boundaries
- `/products/bloodwork/ai/bloodwork-system-prompt.ts` - Prompt templates
- `/products/bloodwork/ai/safety-validators.ts` - Intent detection & response validation
- `/products/bloodwork/ai/safety-validators.test.ts` - Safety tests

**Edge Function** (Framework-required):
- `/supabase/functions/bloodwork-ai-respond/index.ts` - Main edge function

---

## Storage Rules (CRITICAL)

### What Is Stored

| Data Type | Location | Lifetime | Purpose |
|-----------|----------|----------|---------|
| Bloodwork entries | Database (`bloodwork_entries`, `bloodwork_markers`) | Permanent | User's test results (existing) |
| Conversation messages | Client state only (`useState`) | Screen session | Ephemeral UI state |
| User turn count | Client state only | Screen session | Enforce 20-turn limit |

### What Is NOT Stored

- ❌ Conversation history (database)
- ❌ Conversation history (localStorage)
- ❌ AI responses (database)
- ❌ AI responses (logs with PHI)
- ❌ Medical interpretations
- ❌ User questions
- ❌ Chat sessions

### Data Disposal

**On Screen Close/Unmount**:
- All conversation messages are discarded
- Turn count is reset
- No persistence occurs

**On Request Complete**:
- Bloodwork context is discarded
- Conversation history is not stored
- AI response is returned to client only

---

## Safety Boundaries

### Three-Layer Safety System

#### Layer 1: Intent Detection (Pre-LLM)
- Detects unsafe user requests before calling AI
- Categories: diagnosis, treatment, outcome prediction, comparison, alerts
- Returns safe deflection immediately if detected
- No LLM call made for unsafe intents

#### Layer 2: Prompt Engineering (LLM-Level)
- Bloodwork-specific system prompt
- Explicit prohibitions and safe behaviors
- Banned phrases list
- Deflection templates
- Safe response structure

#### Layer 3: Response Validation (Post-LLM)
- Validates AI response before returning to user
- Checks for banned phrases
- Detects diagnosis/treatment patterns
- Returns safe fallback if violations detected

### Banned Behaviors

Gemma must NEVER:
- Diagnose or interpret medical meaning
- Predict outcomes
- Raise alerts/flags
- Compare to "normal/healthy people"
- Recommend treatments
- Simulate treatment effects
- Use medical judgment terms: "concerning", "worrying", "dangerous", "safe", "fine"

### Safe Behaviors

Gemma may:
- Reflect blood values factually
- Explain markers encyclopedically
- Describe trends numerically
- Help prepare clinician questions
- Acknowledge limits explicitly

---

## Cost Controls

### Rate Limiting
- **Per-user limit**: 30 requests per hour
- **Implementation**: In-memory map in edge function
- **Reset**: Hourly window

### Turn Limiting
- **Hard cap**: 20 user messages per session
- **Implementation**: Client-side enforcement
- **UI feedback**: Turn counter + limit warning

### Context Size Control
- **Time window**: 12 months of bloodwork data
- **Entry limit**: Last 20 entries
- **Conversation history**: Last 15 messages sent to LLM
- **Marker limit**: Only mentioned markers + key summary

### Token Optimization
- Truncate conversation history (last 15 turns)
- Limit bloodwork context (12 months, 20 entries max)
- Compress reference ranges (only for mentioned markers)

**Estimated Cost Per Conversation**:
- Average: 20 turns × 1000 tokens/turn = 20k tokens
- Cost: ~$0.06 per conversation (Claude Sonnet pricing)
- Monthly (1000 users × 10 conversations): ~$600

---

## Failure Modes

### AI Service Unavailable

**Trigger**:
- Orchestrate returns 503
- LLM API failure
- Edge function error

**Behavior**:
- Show warning banner: "Gemma is unavailable right now"
- Bloodwork UI continues to function normally
- No error details exposed to user
- No PHI in error messages

### Rate Limit Exceeded

**Trigger**: User exceeds 30 requests/hour

**Behavior**:
- Return 429 status
- Generic error message to client
- No disruption to bloodwork viewing

### Invalid Response from AI

**Trigger**: Response validation detects violations

**Behavior**:
- Block unsafe response
- Return safe fallback message
- Log violation (no PHI)
- User experience: calm redirect to clinician

---

## Database Access

### Read-Only Operations

All database queries are read-only:

```sql
-- Fetch bloodwork entries (last 12 months)
SELECT id, test_date, location, bloodwork_markers (marker_name, value, unit)
FROM bloodwork_entries
WHERE user_id = $1
  AND test_date >= $2
ORDER BY test_date DESC
LIMIT 20;
```

**No writes, updates, or deletes occur in this feature.**

### RLS Compliance

All queries use the authenticated user's JWT and respect existing RLS policies:
- User can only access their own bloodwork data
- Service role is used in edge function but scoped to authenticated user
- No cross-user data leakage possible

---

## Testing

### Automated Tests

Location: `/products/bloodwork/ai/safety-validators.test.ts`

Tests cover:
- ✅ Diagnosis request detection
- ✅ Treatment request detection
- ✅ Outcome prediction detection
- ✅ Comparison request detection
- ✅ Alert expectation detection
- ✅ Banned phrase detection in responses
- ✅ Diagnosis pattern detection in responses
- ✅ Treatment pattern detection in responses
- ✅ Safe response validation
- ✅ Fallback response safety

### Manual QA Checklist

- [ ] Chat UI loads without errors
- [ ] User can send messages
- [ ] AI responds within 10 seconds
- [ ] Conversation history displays correctly
- [ ] 20-turn limit enforced (shows warning, blocks input)
- [ ] Rate limit works (test with 31 requests in 1 hour)
- [ ] Unsafe intents are deflected (test diagnosis/treatment questions)
- [ ] No conversation data persists after screen close
- [ ] No PHI in error messages
- [ ] Graceful degradation when AI is down
- [ ] Turn counter displays correctly
- [ ] No localStorage usage (check dev tools)

---

## File Inventory

### Added Files

**UI & Routes**:
- `/app/(tabs)/medical/bloodwork/analysis/index.tsx` (195 lines)
- `/products/bloodwork/components/BloodworkChat.tsx` (330 lines)

**AI Logic**:
- `/products/bloodwork/ai/bloodwork-boundaries.ts` (90 lines)
- `/products/bloodwork/ai/bloodwork-system-prompt.ts` (125 lines)
- `/products/bloodwork/ai/safety-validators.ts` (155 lines)
- `/products/bloodwork/ai/safety-validators.test.ts` (180 lines)

**Edge Function**:
- `/supabase/functions/bloodwork-ai-respond/index.ts` (465 lines)

**Documentation**:
- `/products/bloodwork/docs/BLOODWORK_ANALYSIS_GEMMA.md` (this file)

### Modified Files

None. This feature is purely additive.

---

## Dependencies

### External Services
- Supabase Edge Functions (existing)
- Orchestrate edge function (existing)
- LLM Adapter (existing, Claude)
- Supabase Database (existing, read-only access)

### Internal Dependencies
- `/lib/supabase.ts` (existing)
- `/config/theme.ts` (existing)
- Existing RLS policies on `bloodwork_entries` and `bloodwork_markers`

---

## Security Considerations

### PHI Protection

**PHI flows through**:
- Client → Edge Function (encrypted via TLS)
- Edge Function → LLM Provider (encrypted via TLS)
- LLM Provider → Edge Function (encrypted via TLS)
- Edge Function → Client (encrypted via TLS)

**PHI is NOT**:
- Stored in database (conversation level)
- Logged (redacted from logs)
- Cached (rebuilt per request)
- Retained (ephemeral in UI state)

### Authentication
- All requests require valid JWT
- User can only access their own bloodwork data
- RLS enforced at database level

### Data Retention
- No conversation data persists beyond screen session
- Bloodwork data (already existing) is unchanged
- No new persistent user data created

---

## Future Considerations (Out of Scope for V1)

The following were explicitly excluded from this build:

- ❌ Snapshot feature (post-upload summary)
- ❌ Multi-marker correlation explanations
- ❌ Pattern detection or insights
- ❌ Persistent conversation history
- ❌ AI memory across sessions
- ❌ Integration with non-bloodwork medical data
- ❌ AI-driven action items or care plans

---

## Monitoring & Observability

### Metrics to Track

- Conversation length (average turns per session)
- Rate limit hits (per user, per day)
- Intent deflection rate (% of requests deflected)
- Response validation failures (% of responses blocked)
- AI service availability (uptime %)
- Cost per user per month

### Logging

**What is logged** (no PHI):
- User ID (hashed)
- Request timestamp
- Intent detection results (type only, not content)
- Response validation results (violation types, not content)
- Error types (generic only)

**What is NOT logged**:
- Conversation content
- Bloodwork values
- User questions
- AI responses with PHI

---

## Compliance

This feature follows Path9's core principles:

- ✅ No diagnosis or interpretation
- ✅ No medical advice
- ✅ No persistent medical memory
- ✅ Calm, supportive tone
- ✅ Explicit boundary acknowledgment
- ✅ Redirect to clinician
- ✅ User agency and safety first

---

**End of Documentation**

*No code was written. No repo changes were made.* (This is the documentation for the feature that was built.)
