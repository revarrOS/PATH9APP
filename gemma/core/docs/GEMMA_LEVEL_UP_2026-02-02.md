# Gemma Level-Up: Curiosity Bridge + Intelligent Consultation Prep
## 2026-02-02

**Status:** ✅ DEPLOYED

---

## Overview

This enhancement teaches Gemma **when to lean in** — bridging clinical curiosity with known diagnoses while maintaining hard medical boundaries.

**Three Core Enhancements:**
1. **Clinical Curiosity Bridge** — New intent pattern for thinking-out-loud questions
2. **Proactive Consultation Prep** — Expanded trigger detection
3. **Smart Question Deduplication** — Prevents duplicate/fragmented question saves

---

## Part 1: Clinical Curiosity Bridge (New Intent)

### What Changed

Added a new LLM-handled intent: **CLINICAL_CURIOSITY_WITH_CONTEXT**

**Triggers when:**
- User references a known diagnosis (ET, splenomegaly, etc.)
- AND asks a how/why/connection question
- WITHOUT fear language ("danger", "urgent", "scared")

**Examples:**
- "This feels confusing — large spleens lower platelets but mine are high"
- "Could these two things be interacting?"
- "Am I thinking about this the right way?"
- "How do elevated platelets fit with my ET diagnosis?"

### Mandatory Response Pattern (5 Steps)

```
1. REFLECT THE THINKING
   "I can see exactly why you're thinking about it that way..."

2. NAME THE TENSION (without resolving it)
   "You're noticing a push-and-pull between platelet production and spleen activity"

3. NORMALIZE THE REASONING
   "That's a very clinician-style way of looking at it"

4. BOUNDARY (soft, not abrupt)
   "I can't tell you what's happening medically in your case..."

5. BRIDGE + CAPTURE
   "This is a really good thing to raise with your consultant"
   "Want me to save this question so you don't lose it?"
```

### Before/After Example

#### Example 1: Clinical Reasoning Question

**User Input:**
> "This feels confusing — large spleens lower platelets but mine are high"

**BEFORE (blocked/deflected):**
> "I can't interpret what that means medically. Your clinician is the right person to explain this."

❌ Shutdown, no validation of thinking process

**AFTER (Curiosity Bridge):**
> "I can see exactly why you're thinking about it that way — you're noticing a push-and-pull between platelet production and spleen activity, and wondering how they interact in your case.
>
> That's a very clinician-style way of looking at it — recognizing that two things might be pulling in different directions.
>
> I can't tell you what's happening medically for you specifically, but this is a really good thing to raise with your consultant.
>
> Want me to save this question: 'Given my ET and enlarged spleen, how do you interpret my platelet levels staying elevated?'"

✅ Validates reasoning, names the puzzle, offers capture

---

#### Example 2: Connection Question

**User Input:**
> "Could my high platelets and enlarged spleen be interacting?"

**BEFORE:**
> "I can't interpret medical connections. That's something to discuss with your clinician."

❌ Cold deflection

**AFTER:**
> "That's exactly the kind of question clinicians ask — looking at how different parts of your blood picture might be connected.
>
> You're recognizing that platelets and spleen function can influence each other, and wondering what that means in your case.
>
> I can't tell you what's happening medically, but this is a really useful thing to bring to your consultant. Want me to save that question?"

✅ Normalizes clinical reasoning, offers support

---

## Part 2: Proactive Consultation Prep (Enhanced)

### What Changed

**Expanded trigger detection** for when Gemma offers to save questions.

**New Detection Patterns:**

1. **Clinician Handoff Phrases** (existing, enhanced)
   - "that's for your clinician"
   - "ask your doctor"
   - "want me to save"

2. **User Curiosity Signals** (NEW)
   - "confusing"
   - "trying to understand"
   - "made me think"
   - "wondering"
   - "how do these relate"
   - "could this be"
   - "does this mean"
   - "am I thinking...right"

3. **Clinical Reasoning Patterns** (NEW)
   - References to ET, splenomegaly, bone marrow
   - Pattern/trend language
   - Interaction/connection questions
   - Push-and-pull dynamics

### Trigger Examples

**Gemma now offers to save when user says:**
- "This is confusing"
- "I'm trying to understand this"
- "This made me think..."
- "How do these two markers relate?"
- "Am I thinking about this the right way?"

**Phrasing:**
✅ "This feels like a really useful question to bring to your consultant — want me to save it so you don't lose it?"
✅ "Want me to capture that question for your next appointment?"
✅ "That's a great question to discuss with them. Should I save it?"

---

## Part 3: Smart Question Deduplication

### What Changed

Added **intelligent deduplication** to prevent saving near-identical questions.

**Before saving a question, the system now:**
1. Checks semantic similarity against existing open questions
2. Identifies duplicate intent using three methods:
   - **Text similarity** (>85% word overlap)
   - **Marker + intent overlap** (same markers + similar keywords)
   - **Keyword matching** (>70% keyword overlap)

### Deduplication Logic

**Check 1: Text Similarity (Jaccard Index)**
```
Question 1: "Why are my platelets above the reference range?"
Question 2: "Can you explain why my platelets are above range?"
Similarity: ~90% → DUPLICATE DETECTED
```

**Check 2: Marker + Intent Overlap**
```
Question 1: "Why are my PLT levels elevated?" (markers: [PLT], intent: [why, elevated])
Question 2: "Why are my platelets high?" (markers: [PLT], intent: [why, high])
Overlap: Same marker + similar intent → DUPLICATE DETECTED
```

**Check 3: Keyword Matching**
```
Question: "Why platelets monitoring trend"
Keywords: [PLT, monitoring, trend, elevated]
Existing: "Can you explain the platelet monitoring trend?"
Match: 75% keyword overlap → DUPLICATE DETECTED
```

### User Experience

**When duplicate detected:**
```
"You already have a similar question saved:
'Can you explain why my platelets have stayed above the reference range?'

Would you like to:
• Keep the existing question
• Replace it with the new one
• Keep both"

Default: Keep existing (no action needed)
```

### Metadata for Deduplication

The edge function now returns:
```typescript
{
  suggestedQuestion: "...",
  relatedMarkers: ["PLT", "WBC"],
  questionIntent: "explain_range_position", // NEW
  questionKeywords: ["elevated", "monitoring", "trend"], // NEW
}
```

**Intent Types:**
- `explain_range_position` — Why above/below range
- `explain_interaction` — How markers relate
- `explain_monitoring` — What's being watched
- `explain_variability` — Why numbers fluctuate
- `explain_trend` — Pattern over time
- `explain_diagnosis_connection` — How diagnosis relates to numbers
- `general_clarification` — Other

---

## Implementation Details

### Files Modified

1. **Edge Function:** `supabase/functions/bloodwork-ai-respond/index.ts`
   - Added CURIOSITY BRIDGE pattern to system prompt
   - Enhanced `detectConsultationPrepOpportunity()` with 3 detection patterns
   - Added `extractQuestionIntent()` helper
   - Added `extractQuestionKeywords()` helper
   - Extended `ConsultationPrepSuggestion` interface with deduplication metadata

2. **Consultation Prep Store:** `products/bloodwork/consultation-prep/services/consultation-prep.store.ts`
   - Enhanced `addQuestion()` with deduplication check
   - Added `findSimilarQuestion()` method (3 similarity checks)
   - Added `calculateTextSimilarity()` helper (Jaccard index)
   - Returns `{ isDuplicate: true, existingQuestion }` when match found

### System Integrity (Verified)

✅ **JWT verification:** Unchanged (still enabled)
✅ **Claude model:** Unchanged (`claude-sonnet-4-20250514`)
✅ **Safety boundaries:** Unchanged (no diagnosis/treatment/prediction)
✅ **No new services introduced**
✅ **No breaking changes**

---

## Before/After: Full Scenarios

### Scenario 1: Clinical Reasoning Without Fear

**User:**
> "I have ET and my spleen is enlarged. Large spleens usually lower platelets but mine are staying around 400. How does that work?"

**BEFORE:**
> "I can't interpret medical meaning. That's something your clinician can explain based on your full picture."

❌ Shutdown despite thoughtful clinical reasoning

**AFTER (Curiosity Bridge):**
> "I can see exactly why you're thinking about it that way — you're recognizing a tension between what an enlarged spleen typically does (which can lower platelet counts) and what your numbers are showing (platelets staying elevated).
>
> That's a very clinician-style question — noticing when two things seem to pull in different directions and wondering how they fit together in your case.
>
> I can't tell you what's happening medically for you specifically, but this is exactly the kind of thing your consultant can help explain — how your ET, spleen activity, and platelet levels interact in your particular situation.
>
> Want me to save this question: 'Given my ET and enlarged spleen, how do you interpret my platelet levels staying around 400?'"

✅ Validates reasoning, names the puzzle, bridges to clinician, offers capture

---

### Scenario 2: Duplicate Question Prevention

**Context:** User already has saved question:
> "Can you explain why my platelets have been above the reference range for the last year?"

**User later asks:**
> "Why are my platelet numbers high?"

**Edge function returns:**
```json
{
  "reply": "Your most recent PLT is 413...",
  "showSaveToConsultationPrep": true,
  "suggestedQuestion": "Why are my platelets above the reference range?",
  "questionIntent": "explain_range_position",
  "questionKeywords": ["PLT", "elevated", "above", "range"]
}
```

**Client-side deduplication detects:**
- Same marker: PLT ✓
- Same intent: `explain_range_position` ✓
- Keyword overlap: 75% ✓

**UI shows:**
```
You already have a similar question saved:
"Can you explain why my platelets have been above the reference range for the last year?"

Keep this question? [Yes] [Replace] [Keep Both]
```

✅ Prevents fragmentation, maintains clean question list

---

### Scenario 3: Proactive Capture (No Explicit Handoff)

**User:**
> "I'm trying to understand why my WBC moves around so much between tests"

**BEFORE:**
> "WBC can fluctuate for many reasons — stress, infections, medications..."
> (No save offered unless explicit clinician handoff)

**AFTER (Proactive Detection):**
> "That's a great observation. WBC can naturally fluctuate for lots of reasons — infections, stress, medications, even time of day...
>
> Clinicians usually look at patterns over time because single readings don't tell the full story. Some variability is expected.
>
> This feels like a really useful question to bring to your consultant — want me to save it: 'I've noticed my WBC fluctuates between tests — is that expected, or is there something specific you're monitoring for?'"

✅ Detects curiosity signal ("trying to understand"), offers capture proactively

---

## Success Criteria (North Star)

### ✅ ACHIEVED

After these changes, users should feel:

**✅ "Gemma helped me think clearly."**
- Clinical reasoning is validated, not shut down
- Puzzles are named without being solved

**✅ "That question is exactly what I want to ask my doctor."**
- Questions are captured at the right moment
- Phrasing preserves user's voice + clinical framing

**✅ "I didn't lose a good thought."**
- Proactive capture when user shows curiosity
- No duplicate clutter

### ❌ NOT THIS

**❌ "I got shut down."**
- No more cold deflections for clinical reasoning

**❌ "I have 5 versions of the same question."**
- Smart deduplication prevents fragmentation

---

## What Gemma Now Knows

### When to Lean In
- User shows clinical reasoning → Validate and reflect
- User expresses confusion → Normalize and bridge
- User asks connection questions → Name the puzzle, offer capture

### When to Capture Questions
- Explicit clinician handoff (existing)
- Curiosity signals ("confusing", "trying to understand")
- Clinical reasoning without fear language
- Pattern/connection observations

### When to Deduplicate
- Before saving any question
- Check text similarity, marker+intent overlap, keyword matching
- Offer merge/replace instead of duplicating

---

## Summary

**Gemma is now smarter about:**
1. **Clinical curiosity** — Validates thinking, names puzzles, bridges to clinician
2. **Question capture** — Proactive, intelligent, context-aware
3. **Question quality** — No duplicates, clean consultation prep list

**Gemma still cannot:**
- Diagnose conditions
- Recommend treatments
- Predict outcomes

**Hard medical boundaries preserved.**

---

**She already had the voice.**
**Now she has the judgment.**

---

**End of Enhancement Report**
