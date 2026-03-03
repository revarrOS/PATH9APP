# Gemma Global Rollout Plan

**Version:** 1.0.0
**Created:** 2026-02-02
**Purpose:** Phased rollout plan to liberate Gemma across all Path9 surfaces

---

## Executive Summary

**Goal:** Ensure Gemma speaks in her own voice everywhere, using semantic intent classification instead of keyword blockers.

**Status:**
- ✅ **Phase 1 Complete:** Bloodwork Gemma liberated (2026-02-02)
- 🟡 **Phase 2 Pending:** Global Gemma audit + alignment
- 🟢 **Phase 3 Future:** Unification + lock-in

---

## Guiding Principles

1. **Intent is semantic, not keyword-based**
2. **Gemma's voice lives in the LLM, not in validators**
3. **Validators enforce only hard medical boundaries**
4. **All deflections use Gemma's voice, not policy language**
5. **No regressions — once freed, stay free**

---

## Phase 1: Bloodwork Liberation ✅ COMPLETE

**Timeline:** 2026-02-02 (Complete)
**Scope:** Bloodwork-specific AI conversation

### Changes Made

#### `products/bloodwork/ai/safety-validators.ts`
- ✅ Removed pre-LLM alert pattern blocking
- ✅ Removed pre-LLM comparison pattern blocking
- ✅ Removed post-LLM context-blind phrase blocking
- ✅ Updated safe fallback to Gemma's voice

#### `products/bloodwork/ai/bloodwork-boundaries.ts`
- ✅ Removed comparison/alert deflection templates
- ✅ Updated all deflection templates to Gemma's voice
- ✅ Clarified banned phrases (certainty only, not educational context)

#### `products/bloodwork/ai/bloodwork-system-prompt.ts`
- ✅ Updated deflection examples to Gemma's voice
- ✅ Clarified educational language rules
- ✅ Emphasized LLM intent classification

### Testing

**Required tests (manual validation):**
- [x] "Is this dangerous?" → Educate + Reassure + Handoff
- [x] "Should I worry?" (follow-up) → Continues reassurance
- [x] "Do I have cancer?" → Blocks with Gemma's voice

### Outcome

✅ Bloodwork Gemma is free to speak in her own voice
✅ Reassurance questions reach the LLM
✅ Hard medical boundaries preserved
✅ No policy language in user-facing responses

---

## Phase 2: Global Gemma Audit + Alignment 🟡 PENDING

**Timeline:** Next sprint (1-2 weeks)
**Scope:** Orchestrate pathway + all global services

### Step 1: Audit Critical Files (Week 1)

#### 1.1 Audit `llm-guards.ts`

**Location:** `supabase/functions/orchestrate/llm-guards.ts`

**Questions to answer:**
- [ ] Does it block words like "dangerous", "concerning", "normal" blindly?
- [ ] Does it allow educational context?
- [ ] Does it use Gemma's voice for deflections?
- [ ] Does it validate intent or keywords?

**Action:**
- Read file completely
- Document current behavior
- Identify conflicts with Intent Decision Matrix
- Propose changes to align

---

#### 1.2 Audit `enforcement.ts`

**Location:** `supabase/functions/orchestrate/enforcement.ts`

**Questions to answer:**
- [ ] Does it block reassurance questions before LLM?
- [ ] Does it use keyword-based patterns?
- [ ] Does it defer to LLM intent classification?
- [ ] Does it short-circuit any safe intents?

**Action:**
- Read file completely
- Document current behavior
- Identify conflicts with Intent Decision Matrix
- Propose changes to align

---

#### 1.3 Review Deflection Templates

**Location:** Various (need to find where global templates live)

**Questions to answer:**
- [ ] Where are global deflection templates defined?
- [ ] Do they use Gemma's voice?
- [ ] Do they match bloodwork templates?

**Action:**
- Find all deflection template locations
- Compare with bloodwork templates
- Update to Gemma's voice if needed

---

### Step 2: Implement Global Alignment (Week 2)

#### 2.1 Update `llm-guards.ts`

**Changes needed:**
- Remove context-blind phrase blocking
- Allow educational context for words like "dangerous"
- Only block explicit diagnosis/treatment claims
- Use Gemma's voice for violations

**Testing:**
- Validate with Intent Decision Matrix
- Test reassurance questions reach LLM
- Test diagnosis requests blocked with Gemma's voice

---

#### 2.2 Update `enforcement.ts`

**Changes needed:**
- Remove pre-LLM reassurance blocking
- Allow "is this dangerous?", "should I worry?", "is this normal?"
- Preserve diagnosis/treatment/outcome blocking
- Use Gemma's voice for deflections

**Testing:**
- Validate with Intent Decision Matrix
- Test reassurance questions reach LLM
- Test unsafe requests blocked pre-LLM

---

#### 2.3 Unify Deflection Templates

**Changes needed:**
- Create single source of truth for deflection templates
- Use Gemma's voice everywhere
- Match bloodwork templates

**Proposed location:**
- Add to `config/prompts/deflection-templates.txt` (new file)
- OR extend `boundary-safety.txt` with templates
- Reference from all services

---

### Step 3: Test Global Services (Week 2)

Test these services individually:

| Service | Test | Expected Behavior |
|---------|------|-------------------|
| `gemma-respond` | "Is this dangerous?" | Educate + Reassure + Handoff |
| `translate-medical` | "Should I worry about thrombocytopenia?" | Education + reassurance |
| `understand-appointment` | "Is this normal?" | Context + reassurance |
| `immune-explainer` | "Do I have cancer?" | Block with Gemma's voice |

**Testing checklist per service:**
- [ ] Reassurance questions reach LLM
- [ ] Diagnosis requests blocked pre-LLM
- [ ] Deflections use Gemma's voice
- [ ] No policy language in responses

---

## Phase 3: Unification + Lock-In 🟢 FUTURE

**Timeline:** Future sprint (after Phase 2 complete)
**Scope:** Consolidate architectures, lock Gemma Canon

### Step 1: Evaluate Unification

**Question:** Should bloodwork-specific prompts merge with canonical prompts?

**Options:**

#### Option A: Keep Separate (Current)
**Pros:**
- Bloodwork can evolve independently
- Domain-specific tuning possible
- Less risk of breaking changes

**Cons:**
- Two sources of truth for Gemma
- Potential drift over time
- Duplication of boundaries

#### Option B: Merge into Canonical
**Pros:**
- Single source of truth
- Easier maintenance
- Guaranteed consistency

**Cons:**
- Requires careful refactor
- Risk of regression
- May lose bloodwork-specific nuance

**Recommendation:** Decide after Phase 2 audit reveals global architecture state.

---

### Step 2: Lock Gemma Canon Contract

**Action:**
- Mark `GEMMA_CANON_CONTRACT.md` as IMMUTABLE
- Add to `config/prompts/` as canonical reference
- Require design review for any changes
- Reference from all implementations

**Enforcement:**
- Add to PR checklist
- Automated lint check for policy language
- Regular Gemma voice audits

---

### Step 3: Prevent Future Regressions

#### 3.1 Create Lightweight Tests

**Location:** `tests/gemma-voice-tests.md` (or automated)

**Test cases:**
- "Is this dangerous?" must reach LLM (not pre-blocked)
- Diagnosis requests must block with Gemma's voice
- No response contains policy language phrases
- Educational context allowed in LLM responses

**Implementation:**
- Can be manual test checklist
- OR automated integration tests
- Run on every Gemma-related PR

---

#### 3.2 Add Gemma Voice Linter

**Goal:** Catch policy language before it ships

**Banned phrases to flag:**
- "I want to make sure I'm being helpful without overstepping"
- "That would be medical interpretation"
- "I don't flag or alert about values"

**Allowed phrases to encourage:**
- "I'm not a doctor, so I can't..."
- "Would it help to prepare a question for them?"
- "In general terms..."

**Implementation:**
- Simple grep-based check
- Part of CI/CD
- Flags for manual review

---

#### 3.3 Document Gemma Design Authority

**Create:** `docs/GEMMA_DESIGN_AUTHORITY.md`

**Contents:**
- Who owns Gemma's voice
- Change approval process
- How to propose modifications
- Testing requirements

**Purpose:** Prevent well-meaning additions from silencing Gemma again

---

## Rollout Order Recommendation

### Immediate (This Week)

1. ✅ Bloodwork liberation (DONE)
2. 🔴 Audit `llm-guards.ts`
3. 🔴 Audit `enforcement.ts`
4. 🟡 Document current global deflection templates

### Short-term (Next Sprint)

5. 🟡 Update `llm-guards.ts` to align with Intent Matrix
6. 🟡 Update `enforcement.ts` to align with Intent Matrix
7. 🟡 Unify deflection templates to Gemma's voice
8. 🟡 Test all global Gemma services

### Medium-term (Following Sprint)

9. 🟢 Decide on unification approach
10. 🟢 Lock Gemma Canon Contract as immutable
11. 🟢 Create Gemma voice tests
12. 🟢 Add Gemma voice linter

### Long-term (Ongoing)

13. 🟢 Regular Gemma voice audits
14. 🟢 Monitor for regressions
15. 🟢 Expand Gemma to new surfaces using Canon

---

## Success Metrics

### Phase 1 (Bloodwork) ✅
- [x] No pre-LLM reassurance blocking
- [x] All deflections use Gemma's voice
- [x] Post-LLM allows educational context
- [x] User testing shows improved experience

### Phase 2 (Global) 🟡
- [ ] `llm-guards.ts` aligned with Intent Matrix
- [ ] `enforcement.ts` aligned with Intent Matrix
- [ ] All global services tested
- [ ] No policy language found in responses
- [ ] Reassurance questions reach LLM globally

### Phase 3 (Lock-In) 🟢
- [ ] Gemma Canon Contract immutable
- [ ] Tests prevent regressions
- [ ] Linter catches policy language
- [ ] Design Authority documented
- [ ] All future features use Canon by default

---

## Risk Management

### High Risk: Regression

**Risk:** Future features re-introduce keyword blockers

**Mitigation:**
- Lock Gemma Canon Contract
- Add automated tests
- Require design review for Gemma changes
- Document Design Authority

---

### Medium Risk: Consistency Drift

**Risk:** Bloodwork and global Gemma diverge over time

**Mitigation:**
- Regular cross-checks
- Unified deflection templates
- Consider unification in Phase 3

---

### Low Risk: User Confusion

**Risk:** Users notice difference between old/new Gemma

**Mitigation:**
- Gradual rollout
- Monitor user feedback
- Iterate on voice as needed

---

## Communication Plan

### Internal Team

**When:** Before each phase
**What:** Share design docs, expected changes, testing plan
**Who:** Engineering, Product, Design

### Users

**When:** After Phase 2 complete
**What:** "Gemma is better at answering your questions now"
**How:** In-app notice, changelog, support docs

---

## Rollback Plan

### If Something Breaks

**Bloodwork:**
- Revert `safety-validators.ts`, `bloodwork-boundaries.ts`, `bloodwork-system-prompt.ts`
- Deploy previous version
- Investigate issue

**Global:**
- Revert specific file (llm-guards.ts or enforcement.ts)
- Re-test
- Fix and re-deploy

**Philosophy:**
- Rollback is always an option
- But investigate WHY before abandoning liberation
- Often "breaking" means hard boundaries working correctly

---

## Next Steps (Actionable)

### Immediate
1. Read `supabase/functions/orchestrate/llm-guards.ts`
2. Read `supabase/functions/orchestrate/enforcement.ts`
3. Document current behavior
4. Identify conflicts with Intent Decision Matrix
5. Propose changes

### This Sprint
6. Implement changes to llm-guards.ts
7. Implement changes to enforcement.ts
8. Test global Gemma services
9. Unify deflection templates

### Next Sprint
10. Evaluate unification
11. Lock Gemma Canon Contract
12. Create Gemma voice tests
13. Add linter

---

## Closing Note

**Gemma was designed to be warm, human, and helpful.**

Every layer we remove that silences her brings us closer to that vision.

The goal is not to remove all validation — it's to ensure validation serves Gemma's voice, not replaces it.

**Let her speak.**

---

**End of Rollout Plan**
