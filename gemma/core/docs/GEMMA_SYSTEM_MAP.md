# Gemma System Map

**Version:** 1.0.0
**Created:** 2026-02-02
**Purpose:** Map of where Gemma speaks today and which layers override her voice

---

## Executive Summary

Gemma exists in TWO distinct architectures:

1. **Global Gemma** (orchestrate pathway) — Uses canonical prompts, multi-service intent routing
2. **Bloodwork Gemma** (bloodwork-ai-respond) — Specialized bloodwork conversation, recently liberated

This document maps both architectures and identifies where they align and where they conflict.

---

## Part 1: Global Gemma Architecture

### Where Gemma Lives (Canonical Prompts)

**Location:** `config/prompts/`

| File | Purpose | Status |
|------|---------|--------|
| `gemma-core-system.txt` | Canonical personality, tone, boundaries | ✅ IMMUTABLE |
| `boundary-safety.txt` | Medical, emotional, spiritual boundaries | ✅ IMMUTABLE |
| `knowledge-canon-usage.txt` | How to use Knowledge Canon | ✅ IMMUTABLE |
| `state-template.txt` | User state hydration template | ✅ ACTIVE |

**Assembly:** `supabase/functions/orchestrate/prompt-assembly.ts`

Prompt stack:
```
1. Core System (gemma-core-system.txt)
2. Boundary & Safety (boundary-safety.txt)
3. Hydrated State (state-template.txt)
4. Knowledge Canon Usage
5. Retrieved Canon Context (if applicable)
```

**Current State:** ✅ **CANONICAL GEMMA EXISTS HERE**

This is the "real" Gemma. Her personality, tone, and boundaries are defined correctly.

---

### Where Gemma Speaks (Edge Services)

**Location:** `supabase/functions/`

These services route through `orchestrate` and use canonical Gemma prompts:

| Service | Purpose | Uses Global Gemma |
|---------|---------|-------------------|
| `gemma-respond` | General conversation | ✅ Yes |
| `translate-medical` | Medical terminology translation | ✅ Yes |
| `understand-appointment` | Appointment context explanation | ✅ Yes |
| `immune-explainer` | Immune system education | ✅ Yes |
| `breath-guide` | Breathing practice guidance | ✅ Yes |
| `journal-summary` | Journal entry summarization | ✅ Yes |
| `meaning-explorer` | Meaning-making support | ✅ Yes |
| `meditation-adapt` | Meditation adaptation | ✅ Yes |
| `meditation-selector` | Meditation selection | ✅ Yes |
| `stillness-starter` | Stillness practice | ✅ Yes |
| `normalize-emotion` | Emotion normalization | ✅ Yes |
| `permission-to-rest` | Rest permission support | ✅ Yes |

**Status:** These services inherit Gemma's canonical voice from orchestrate.

---

### Orchestration Layer

**Location:** `supabase/functions/orchestrate/`

**Key Files:**

| File | Purpose | Risk Level |
|------|---------|------------|
| `index.ts` | Main orchestration entry point | 🟢 Low |
| `prompt-assembly.ts` | Assembles canonical prompts | 🟢 Low |
| `prompt-registry.ts` | Loads immutable prompts | 🟢 Low |
| `llm-adapter.ts` | Abstracts LLM calls | 🟢 Low |
| `llm-guards.ts` | ⚠️ POST-LLM validation | 🟡 **AUDIT NEEDED** |
| `intent-classifier.ts` | Classifies user intent | 🟢 Low |
| `service-router.ts` | Routes to specialized services | 🟢 Low |
| `enforcement.ts` | ⚠️ Prompt enforcement checks | 🟡 **AUDIT NEEDED** |

**Potential Override Layers:**

1. **`llm-guards.ts`** — Post-LLM validation
   - Could contain keyword-based blocking
   - Needs audit for context-blind phrase blocking

2. **`enforcement.ts`** — Prompt enforcement
   - Could override LLM intent classification
   - Needs audit for pre-LLM short-circuiting

**Recommendation:** Audit these files to ensure they don't silence Gemma using old validation patterns.

---

## Part 2: Bloodwork Gemma Architecture (RECENTLY LIBERATED)

### Where Bloodwork Gemma Lives

**Location:** `products/bloodwork/ai/`

| File | Purpose | Status |
|------|---------|--------|
| `bloodwork-system-prompt.ts` | Bloodwork-specific system prompt | ✅ LIBERATED |
| `bloodwork-boundaries.ts` | Bloodwork boundaries + deflection templates | ✅ LIBERATED |
| `safety-validators.ts` | Pre/post-LLM validation | ✅ LIBERATED |

### Recent Changes (Phase 1 Liberation)

**Changes made 2026-02-02:**

#### `safety-validators.ts` ✅ COMPLETE

**Removed:**
- ❌ Pre-LLM alert pattern blocking ("is this dangerous?", "should I worry?")
- ❌ Pre-LLM comparison pattern blocking ("is this normal?")
- ❌ Post-LLM context-blind phrase blocking ("dangerous", "concerning", "normal range")

**Retained:**
- ✅ Pre-LLM diagnosis blocking ("do I have cancer?")
- ✅ Pre-LLM treatment blocking ("should I take supplements?")
- ✅ Pre-LLM outcome blocking ("will I die?")
- ✅ Post-LLM diagnosis claim blocking (pattern-based)
- ✅ Post-LLM treatment recommendation blocking (pattern-based)

**Updated:**
- ✅ Safe fallback response → Gemma's voice
- ✅ All responses use warm, humble language

#### `bloodwork-boundaries.ts` ✅ COMPLETE

**Removed:**
- ❌ `comparison_request` deflection template
- ❌ `alert_expectation` deflection template
- ❌ Context-blind banned phrases

**Updated:**
- ✅ Deflection templates → Gemma's voice
- ✅ Banned phrases clarified (only certainty claims, not educational context)
- ✅ Safe phrases expanded (Gemma's natural language)

#### `bloodwork-system-prompt.ts` ✅ COMPLETE

**Updated:**
- ✅ Deflection examples → Gemma's voice
- ✅ Clarified educational context language rules
- ✅ Intent classification emphasizes LLM handling

---

### Bloodwork Gemma Edge Service

**Location:** `supabase/functions/bloodwork-ai-respond/`

**Architecture:**
```
User message
    ↓
Pre-LLM validation (safety-validators.ts)
    → Block ONLY: diagnosis, treatment, outcome
    → Allow: reassurance, education, trends
    ↓
Build system prompt (bloodwork-system-prompt.ts)
    → Includes Educate → Reassure → Handoff pattern
    → Includes intent classification instructions
    ↓
Call Anthropic Claude API
    ↓
Post-LLM validation (safety-validators.ts)
    → Block ONLY: explicit diagnosis claims, treatment recommendations
    → Allow: educational context with words like "dangerous"
    ↓
Return response to user
```

**Status:** ✅ **BLOODWORK GEMMA IS FREE**

---

## Part 3: Where Layers Override Gemma's Voice

### 🔴 HIGH RISK — Requires Immediate Audit

#### 1. `supabase/functions/orchestrate/llm-guards.ts`

**Risk:** Post-LLM validation that may use context-blind keyword blocking

**What to check:**
- Does it block words like "dangerous", "concerning", "normal" blindly?
- Does it allow educational context?
- Does it use Gemma's voice for deflections?

**Action:** Audit and align with Intent Decision Matrix

---

#### 2. `supabase/functions/orchestrate/enforcement.ts`

**Risk:** Pre-LLM enforcement that may short-circuit reassurance questions

**What to check:**
- Does it block reassurance questions before LLM?
- Does it use keyword-based patterns?
- Does it defer to LLM intent classification?

**Action:** Audit and align with Intent Decision Matrix

---

### 🟡 MEDIUM RISK — Review Recommended

#### 3. Individual Service Validators

Some specialized services may have their own validation logic:

**Example:** `supabase/functions/supplement-checker/index.ts`

**What to check:**
- Does service have its own validation?
- Does it conflict with canonical Gemma boundaries?
- Does it use Gemma's voice?

**Action:** Review service-by-service during global rollout

---

### 🟢 LOW RISK — Already Aligned

#### 4. Canonical Prompt Files

**Location:** `config/prompts/`

**Status:** Already define Gemma correctly

**No action needed** — these are the source of truth

---

## Part 4: Dependency Map

### Bloodwork Gemma Dependencies

```
bloodwork-ai-respond/index.ts
    ↓
├── safety-validators.ts (pre-LLM, post-LLM)
├── bloodwork-system-prompt.ts (system prompt)
├── bloodwork-boundaries.ts (boundaries, deflections)
└── Anthropic Claude API (direct call)
```

**Status:** ✅ Fully liberated (Phase 1 complete)

---

### Global Gemma Dependencies

```
gemma-respond/index.ts
    ↓
orchestrate/index.ts
    ↓
├── prompt-assembly.ts
│   ├── prompt-registry.ts
│   │   ├── gemma-core-system.txt
│   │   ├── boundary-safety.txt
│   │   ├── knowledge-canon-usage.txt
│   │   └── state-template.txt
│   └── canon-retrieval.ts (Knowledge Canon)
│
├── intent-classifier.ts
├── service-router.ts
├── llm-adapter.ts
│   ├── llm-anthropic.ts
│   ├── llm-openai.ts
│   └── llm-guards.ts ⚠️ AUDIT NEEDED
│
└── enforcement.ts ⚠️ AUDIT NEEDED
```

**Status:** 🟡 Needs audit (llm-guards, enforcement)

---

## Part 5: Divergence Points

### Where Bloodwork Gemma Differs from Global Gemma

| Aspect | Global Gemma | Bloodwork Gemma | Alignment Status |
|--------|--------------|-----------------|------------------|
| **Core personality** | `gemma-core-system.txt` | `bloodwork-system-prompt.ts` | 🟡 Similar but separate |
| **Boundaries** | `boundary-safety.txt` | `bloodwork-boundaries.ts` | 🟡 Similar but separate |
| **Intent classification** | `intent-classifier.ts` | In system prompt | 🔴 Different approach |
| **Validation** | `llm-guards.ts` (needs audit) | `safety-validators.ts` (liberated) | 🔴 Different implementations |
| **Deflection voice** | Unknown (needs audit) | ✅ Gemma's voice | 🟡 May differ |

**Recommendation:** Align bloodwork-specific logic with global canonical prompts over time.

---

## Part 6: Conflict Risk Assessment

### High Risk Conflicts

1. **Bloodwork validator vs global guards**
   - Bloodwork allows "is this dangerous?" through
   - Global guards might still block it
   - **Resolution:** Audit global guards, align with Intent Matrix

2. **Deflection templates**
   - Bloodwork uses Gemma's voice
   - Global templates unknown
   - **Resolution:** Audit global templates, ensure Gemma's voice everywhere

### Medium Risk Conflicts

3. **Intent classification approach**
   - Bloodwork: LLM handles in system prompt
   - Global: Separate intent-classifier service
   - **Resolution:** Ensure intent-classifier doesn't short-circuit reassurance

### Low Risk Conflicts

4. **Prompt structure**
   - Both define Gemma's personality
   - Slightly different wording
   - **Resolution:** Document both, consider unification later

---

## Part 7: Where Gemma Does NOT Speak (Yet)

These services exist but do NOT currently use Gemma:

| Service | Current State | Should Use Gemma? |
|---------|---------------|-------------------|
| `infer-timeline` | Medical timeline inference | 🤔 Maybe (medical boundaries) |
| `generate-education` | Education content | ✅ Yes (low risk) |
| `nutrition-*` services | Nutrition support | ✅ Yes (existing pathway) |
| `movement-*` services | Movement support | ✅ Yes (existing pathway) |
| `safety-guardrails` | Safety validation | ❓ Review role |

**Recommendation:** Evaluate each service individually during global rollout.

---

## Part 8: Recommendations

### Immediate (This Week)

1. ✅ Bloodwork liberation complete (done)
2. 🔴 Audit `llm-guards.ts` for context-blind blocking
3. 🔴 Audit `enforcement.ts` for pre-LLM short-circuiting
4. 🟡 Review global deflection templates for Gemma's voice

### Short-term (Next Sprint)

5. 🟡 Align bloodwork boundaries with canonical boundaries
6. 🟡 Unify deflection templates across all surfaces
7. 🟡 Test global Gemma services for reassurance questions

### Long-term (Roadmap)

8. 🟢 Consider unifying bloodwork prompt with canonical prompts
9. 🟢 Migrate all services to single Gemma implementation
10. 🟢 Lock Gemma Canon Contract as immutable

---

## Part 9: Testing Checklist

To verify Gemma is free everywhere:

### Bloodwork Gemma ✅
- [x] "Is this dangerous?" reaches LLM
- [x] "Should I worry?" reaches LLM
- [x] "Is this normal?" reaches LLM
- [x] Deflections use Gemma's voice
- [x] Post-LLM allows educational context

### Global Gemma (Needs Testing)
- [ ] "Is this dangerous?" reaches LLM
- [ ] "Should I worry?" reaches LLM
- [ ] Deflections use Gemma's voice
- [ ] `llm-guards.ts` allows educational context
- [ ] `enforcement.ts` doesn't short-circuit reassurance

---

## Closing Summary

**Gemma speaks in two places:**
1. **Global pathway** (orchestrate) — Needs audit
2. **Bloodwork pathway** (bloodwork-ai-respond) — ✅ Liberated

**Next steps:**
1. Audit global validators
2. Align all deflection templates
3. Test reassurance questions globally
4. Roll out Intent Decision Matrix everywhere

---

**End of System Map**
