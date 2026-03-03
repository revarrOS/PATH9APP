# Consultation Prep Category Detection - Verification

## Implementation Complete

### What Was Built

1. **Shared Category Detector** (`products/shared/consultation-prep/category-detector.ts`)
   - Auto-detects category based on question content
   - Three categories: `bloodwork`, `condition`, `general`
   - Heuristic-based detection (condition keywords, bloodwork markers, phrases)

2. **Updated Both AddQuestionModal Components**
   - Bloodwork: `products/bloodwork/consultation-prep/components/AddQuestionModal.tsx`
   - Condition: `products/condition/consultation-prep/components/AddQuestionModal.tsx`
   - Added category selector UI (3 chips: Bloodwork, Condition, General)
   - Auto-detection runs when question text length > 10 chars
   - User can manually override the auto-detected category
   - Marker chips only show when category = 'bloodwork'

3. **Updated Parent Screens**
   - Bloodwork: `app/(tabs)/medical/bloodwork/consultation-prep/index.tsx`
   - Condition: `app/(tabs)/medical/condition/consultation-prep/index.tsx`
   - Pass category to save handlers
   - Map category → domain before storing

4. **Updated Stores**
   - Bloodwork: `products/bloodwork/consultation-prep/services/consultation-prep.store.ts`
   - Condition: `products/condition/consultation-prep/services/consultation-prep.store.ts`
   - Accept dynamic `domain` parameter in `addQuestion()` and `updateQuestion()`
   - Default to 'bloodwork' or 'condition' if not provided (backwards compatible)

---

## Category Detection Logic

### Condition Category (Highest Priority)
**Triggers when:**
- Contains phrases: "my condition", "what's causing", "how does", "is my condition"
- Contains 2+ keywords: diagnosis, condition, fibrosis, ET, treatment, management, progression, biopsy, JAK2, mutation
- Contains 1+ keyword AND no bloodwork markers

**Example Questions:**
- "What is causing my spleen enlargement?" → **Condition**
- "How does fibrosis relate to my condition?" → **Condition**
- "What treatment options are available for ET?" → **Condition**

### Bloodwork Category
**Triggers when:**
- Contains marker names (PLT, HGB, WBC, etc.) AND bloodwork keywords (trend, range, test)
- Contains only marker names with no condition keywords

**Example Questions:**
- "Why is my PLT trending down?" → **Bloodwork**
- "What's the normal range for HGB?" → **Bloodwork**
- "How often should I test my WBC?" → **Bloodwork**

### General Category (Fallback)
**Triggers when:**
- Broad planning questions
- No strong condition or bloodwork signals

**Example Questions:**
- "What should I expect at my next visit?" → **General**
- "What should I ask my doctor?" → **General**

---

## User Flow

### Scenario 1: Bloodwork Analysis Screen
1. User is in Bloodwork Analysis
2. Asks: "How does my low platelet count relate to my myelofibrosis?"
3. Modal opens with:
   - Auto-detected category: **Condition** (not Bloodwork!)
   - No marker chips shown (category ≠ bloodwork)
4. User can:
   - Accept and save → Goes to **Condition Consultation Prep**
   - Change to Bloodwork → Marker chips appear
   - Change to General → Marker chips hidden

### Scenario 2: Condition Analysis Screen
1. User is in Condition Analysis
2. Asks: "Why is my platelet count so low?"
3. Modal opens with:
   - Auto-detected category: **Bloodwork** (not Condition!)
   - Marker chips shown (category = bloodwork)
4. User can:
   - Accept and save → Goes to **Bloodwork Consultation Prep**
   - Change to Condition → Marker chips hidden
   - Change to General → Marker chips hidden

---

## Data Flow

```
User enters question text
    ↓
Auto-detect category (real-time, >10 chars)
    ↓
User reviews/overrides category
    ↓
User clicks Save
    ↓
Parent screen maps category → domain
    ↓
Store saves with correct domain field
    ↓
Question appears in correct Consultation Prep list
```

---

## Database Schema (No Changes Required)

Table: `consultation_questions`

| Column | Type | Notes |
|--------|------|-------|
| domain | text | 'bloodwork', 'condition', or 'general' |

The existing schema already supports this. We just dynamically set the domain based on user-selected category.

---

## Verification Checklist

✅ Category detector created with heuristic logic
✅ Both modals updated with category selector UI
✅ Auto-detection runs on question text change
✅ User can manually override auto-detected category
✅ Marker chips only show for bloodwork category
✅ Category properly saved to domain field
✅ Questions appear in correct Consultation Prep list
✅ No new tables or edge functions
✅ No orchestrate changes
✅ Build passes with no errors

---

## Expected Behavior

**Before Fix:**
- Question asked in Bloodwork Analysis → Always saved to bloodwork domain
- No way to reclassify
- Condition questions polluted bloodwork prep list

**After Fix:**
- Question content determines category, not screen location
- User can override if auto-detection is wrong
- Questions saved to correct domain
- Consultation Prep lists stay clean and relevant
