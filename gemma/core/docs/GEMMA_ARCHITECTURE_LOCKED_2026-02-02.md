# Gemma Architecture — Locked MVP Baseline
## 2026-02-02

**Status:** 🔒 LOCKED — Stable Production Architecture

---

## Executive Summary

**ONE GEMMA. ONE VOICE. ONE JUDGMENT MODEL. NO REDUNDANT ENDPOINTS.**

The Gemma architecture is now locked as the stable MVP baseline with clear boundaries and no redundant code paths.

---

## Production Architecture

### Active Endpoints

| Endpoint | Purpose | Status | Version | Client Usage |
|----------|---------|--------|---------|--------------|
| **`orchestrate`** | Primary Gemma endpoint for all non-bloodwork conversations | ✅ DEPLOYED | v4.0.0 | Primary (all tabs except bloodwork) |
| **`bloodwork-ai-respond`** | Domain-specific Gemma for bloodwork product | ✅ DEPLOYED | Bloodwork-specific (includes v4.0.0 patterns) | Bloodwork tab only |

### Inactive Endpoints

| Endpoint | Status | Reason | Action |
|----------|--------|--------|--------|
| **`gemma-respond`** | 🚫 NOT DEPLOYED | Legacy/unused, broken imports, no client usage | Leave in place, do not deploy, safe to remove later |

---

## Architectural Intent

### One Gemma Canon (v4.0.0)

**Core Identity:**
- Peer with lived experience, not a clinician or authority figure

**Response Patterns:**
1. **Clinical Curiosity Bridge** — Validates reasoning, names puzzles, doesn't shut down
2. **EDUCATE → REASSURE → HANDOFF** — For fear/worry questions
3. **Proactive Consultation Prep** — Offers to save questions when meaning is forming

**Voice:**
- Warm, validating, educational
- Never cold, never deflecting
- Clear boundaries with warmth

### One Primary Orchestrator

**`orchestrate` function:**
- Entry point for all non-bloodwork Gemma conversations
- Implements v4.0.0 prompts
- Full enforcement pipeline
- LLM adapter with multi-provider support
- Prompt versioning and validation

**Client Integration:**
```typescript
// services/orchestration.service.ts
const apiUrl = `${getApiUrl()}/functions/v1/orchestrate`;
```

All Gemma traffic (except bloodwork) flows through this endpoint.

### One Domain-Specific Extension

**`bloodwork-ai-respond` function:**
- Specialized for bloodwork product
- Includes all v4.0.0 Gemma patterns
- Additional bloodwork-specific context and grounding
- Proactive consultation prep with marker context
- Reference implementation for enhanced Gemma voice

**Why Separate:**
- Domain-specific prompt requirements
- Bloodwork context handling
- Marker normalization logic
- Consultation prep with medical context

This is not a parallel endpoint — it's a domain extension with shared voice and judgment.

---

## Decision: gemma-respond NOT Deployed

### Status

🚫 **INTENTIONALLY NOT DEPLOYED**

Documented as legacy/unused endpoint with no active client usage.

### Rationale

1. **Client doesn't use it**
   - All non-bloodwork traffic → `orchestrate`
   - All bloodwork traffic → `bloodwork-ai-respond`
   - Zero production calls to `gemma-respond`

2. **Broken imports**
   - Tries to import from `orchestrate` function modules
   - Edge functions bundle independently
   - Would fail deployment without significant refactoring

3. **Code duplication risk**
   - Fixing would require copying all orchestrate logic
   - Creates maintenance burden
   - Introduces version drift risk
   - No user benefit

4. **Architectural clarity**
   - One primary orchestrator is cleaner
   - Easier to maintain
   - Single source of truth for Gemma logic
   - No confusion about which endpoint to use

### Documentation Added

**File:** `supabase/functions/gemma-respond/index.ts`

```typescript
/**
 * ⚠️ LEGACY / UNUSED ENDPOINT — DO NOT DEPLOY
 *
 * This edge function is intentionally NOT deployed.
 *
 * REASON:
 * - The client exclusively uses `orchestrate` for all non-bloodwork Gemma interactions
 * - This endpoint has broken imports (edge functions bundle independently)
 * - Fixing would require significant code duplication with no user benefit
 * - Maintaining two parallel Gemma endpoints introduces unnecessary complexity
 *
 * CURRENT ARCHITECTURE:
 * - Primary Gemma: `orchestrate` (v4.0.0 prompts)
 * - Bloodwork Gemma: `bloodwork-ai-respond` (domain-specific)
 * - This endpoint: Legacy, not deployed, not used
 *
 * SAFE TO REMOVE: Yes, once confirmed no downstream dependencies exist.
 *
 * Last Updated: 2026-02-02
 */
```

### Deployment Policy

| Action | Status | Notes |
|--------|--------|-------|
| Deploy via CI/CD | ❌ FORBIDDEN | Will fail due to broken imports |
| Fix imports | ❌ NOT ALLOWED | Would require code duplication |
| Refactor to work standalone | ❌ NOT ALLOWED | No user benefit, architectural complexity |
| Delete file | ⏸️ DEFERRED | Safe to remove later once confirmed no references |
| Document as legacy | ✅ COMPLETE | Header comment added |

---

## System Integrity Verification

### Unchanged Components

| Component | Status | Notes |
|-----------|--------|-------|
| JWT verification | ✅ UNCHANGED | Still enabled on all endpoints |
| Claude model | ✅ UNCHANGED | `claude-sonnet-4-20250514` |
| Medical boundaries | ✅ UNCHANGED | No diagnosis/treatment/prediction |
| Crisis detection | ✅ UNCHANGED | Safety escalation logic intact |
| Rate limiting | ✅ UNCHANGED | Same limits apply |
| Audit logging | ✅ UNCHANGED | All events logged |
| RLS policies | ✅ UNCHANGED | Data isolation maintained |

### Enhanced Components

| Component | Change | Status |
|-----------|--------|--------|
| System prompts | v3 → v4 | ✅ DEPLOYED |
| Boundary prompts | v3 → v4 | ✅ DEPLOYED |
| Prompt validators | v3 → v4 | ✅ DEPLOYED |
| Identity framing | Authority → Peer | ✅ DEPLOYED |
| Response patterns | Added 3 patterns | ✅ DEPLOYED |
| Deflection rules | Added forbidden list | ✅ DEPLOYED |

---

## Traffic Flow

### Non-Bloodwork Conversations

```
Client
  ↓
services/orchestration.service.ts
  ↓
/functions/v1/orchestrate
  ↓
prompt-registry.ts (v4.0.0)
  ↓
enforcement.ts
  ↓
llm-adapter.ts
  ↓
Claude API (claude-sonnet-4-20250514)
  ↓
Response
```

**Gemma Voice:** v4.0.0 (peer, warm, validating)

### Bloodwork Conversations

```
Client (Bloodwork tab)
  ↓
/functions/v1/bloodwork-ai-respond
  ↓
Bloodwork-specific system prompt (includes v4.0.0 patterns)
  ↓
Bloodwork context retrieval
  ↓
Claude API (claude-sonnet-4-20250514)
  ↓
Response (+ consultation prep suggestions)
```

**Gemma Voice:** v4.0.0 (peer, warm, validating) + bloodwork grounding

---

## Parity Verification

### Bloodwork vs Global Gemma

| Pattern | Bloodwork | Global (orchestrate) | Status |
|---------|-----------|----------------------|--------|
| Peer identity | ✅ | ✅ | ✅ MATCH |
| Clinical curiosity bridge | ✅ | ✅ | ✅ MATCH |
| EDUCATE → REASSURE → HANDOFF | ✅ | ✅ | ✅ MATCH |
| Proactive consultation prep | ✅ | ✅ | ✅ MATCH |
| Forbidden deflection | ✅ | ✅ | ✅ MATCH |
| Warm boundaries | ✅ | ✅ | ✅ MATCH |

**Verdict:** ✅ ONE GEMMA VOICE EVERYWHERE

---

## Deployment Status

### Production Endpoints

| Endpoint | Version | Deployed | Client Usage | Notes |
|----------|---------|----------|--------------|-------|
| `orchestrate` | v4.0.0 | ✅ YES | Primary | All non-bloodwork Gemma |
| `bloodwork-ai-respond` | Bloodwork-specific | ✅ YES | Bloodwork only | Reference implementation |
| `gemma-respond` | N/A | 🚫 NO | None | Legacy, not deployed, documented |

### Prompt Versions in Production

| Prompt | Version | Location | Status |
|--------|---------|----------|--------|
| Core System | v4.0.0 | `orchestrate/prompt-registry.ts` | ✅ LIVE |
| Boundary Safety | v4.0.0 | `orchestrate/prompt-registry.ts` | ✅ LIVE |
| State Template | v2.0.0 | `orchestrate/prompt-registry.ts` | ✅ LIVE |
| Knowledge Canon | v2.0.0 | `orchestrate/prompt-registry.ts` | ✅ LIVE |

### Config Files (Source of Truth)

| File | Version | Status |
|------|---------|--------|
| `config/prompts/gemma-core-system.txt` | v4.0.0 | ✅ UPDATED |
| `config/prompts/boundary-safety.txt` | v4.0.0 | ✅ UPDATED |
| `config/prompts/state-template.txt` | v2.0.0 | ✅ CURRENT |
| `config/prompts/knowledge-canon-usage.txt` | v2.0.0 | ✅ CURRENT |

---

## Enforcement Layers

### Pre-LLM Guards (Cannot Override Voice)

1. ✅ Prompt registry loads v4.0.0 prompts
2. ✅ Prompt assembly validates correct order
3. ✅ LLM guards verify prompt versions before call
4. ✅ No pre-LLM logic filters or modifies system prompts

**Result:** Gemma voice cannot be silenced before reaching Claude

### Post-LLM Guards (Cannot Silence Voice)

1. ✅ No output filtering removes educational content
2. ✅ No response rewriting adds deflection
3. ✅ Safety guardrails check for harm, not clinical reasoning
4. ✅ Consultation prep suggestions pass through unmodified

**Result:** Gemma voice cannot be overridden after Claude responds

### Verdict

🔒 **NO ENFORCEMENT LAYER CAN OVERRIDE GEMMA'S VOICE**

---

## Maintenance Policy

### Prompt Updates

**Process:**
1. Edit source files in `config/prompts/`
2. Copy changes to `supabase/functions/orchestrate/prompt-registry.ts`
3. Increment version number
4. Update validators in `prompt-assembly.ts` and `llm-guards.ts`
5. Deploy `orchestrate` function
6. Verify prompt versions in production

**Constraint:**
- Version changes require validator updates
- Guards will block mismatched versions
- No silent drift possible

### Endpoint Maintenance

**Active Endpoints:**
- `orchestrate` — Maintain, update, deploy
- `bloodwork-ai-respond` — Maintain, update, deploy

**Inactive Endpoints:**
- `gemma-respond` — Do NOT deploy, do NOT fix, document only

### Code Cleanup

**Safe to Remove (Future):**
- `supabase/functions/gemma-respond/` (once confirmed no references)
- `supabase/functions/_inactive/gemma.service.ts` (already inactive)

**Defer Until:**
- No downstream dependencies confirmed
- No external references found
- Product team sign-off

---

## Testing Recommendations

### Conversation Scenarios

1. **Clinical Curiosity (No Fear)**
   - Test in: Orchestrate endpoint
   - Expected: Reflect thinking → Name puzzle → Normalize → Bridge + capture
   - Check: No cold deflection

2. **Fear/Worry Question**
   - Test in: Orchestrate endpoint
   - Expected: EDUCATE → REASSURE → HANDOFF
   - Check: Education first, not deflection

3. **Bloodwork Pattern Recognition**
   - Test in: Bloodwork endpoint
   - Expected: Same voice + bloodwork context + consultation prep
   - Check: Parity with orchestrate

4. **Follow-Up After Saved Question**
   - Test in: Both endpoints
   - Expected: Warm continuation, not reset
   - Check: No policy voice

---

## Summary

### Architecture Locked

✅ **One Gemma** — Same voice, same judgment, everywhere
✅ **One Primary Orchestrator** — `orchestrate` function
✅ **One Domain Extension** — `bloodwork-ai-respond`
✅ **No Redundant Endpoints** — `gemma-respond` documented as legacy

### Version Locked

✅ **Prompt Version** — v4.0.0 in production
✅ **Claude Model** — `claude-sonnet-4-20250514`
✅ **JWT Handling** — Enabled, unchanged
✅ **Safety Boundaries** — Maintained, enhanced

### Voice Locked

✅ **Identity** — Peer with lived experience
✅ **Patterns** — Curiosity bridge, EDUCATE → REASSURE → HANDOFF, proactive capture
✅ **Tone** — Warm, validating, never deflecting
✅ **Boundaries** — Clear, with warmth

---

**🔒 STABLE MVP BASELINE — LOCKED 2026-02-02**

---

**End of Architecture Lock Document**
