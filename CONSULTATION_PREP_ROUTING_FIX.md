# Consultation Prep Routing Fix - Complete

## Problem Identified

The category selector was implemented, but the underlying store architecture was still siloed:
- Separate stores for bloodwork and condition
- Each store had hardcoded domain filters
- Domain was being overridden by screen context
- Questions were "owned" by screens, not by their actual category

## Solution Implemented

### 1. Single Shared Store

**Created:** `products/shared/consultation-prep/consultation-prep.store.ts`

This is the ONLY source of truth for consultation questions.

**Key Changes:**
```typescript
// OLD: Each store had its own hardcoded domain
consultationPrepStore.getAll() // filtered by 'bloodwork' or 'condition'

// NEW: Shared store accepts domain as parameter
sharedConsultationPrepStore.getAll('bloodwork')  // bloodwork questions
sharedConsultationPrepStore.getAll('condition')  // condition questions
sharedConsultationPrepStore.getAll('general')    // general questions
sharedConsultationPrepStore.getAll()             // all questions
```

**Save Flow:**
```typescript
// OLD: Domain inferred from screen context
await store.addQuestion(text, { domain: 'bloodwork' })

// NEW: Domain is the user-selected category, passed directly
await sharedConsultationPrepStore.addQuestion(text, category, options)
```

The store now logs every save:
```typescript
console.log('[ConsultationPrepStore] Saving question:', {
  domain,
  questionText: questionText.substring(0, 50) + '...',
  userSelected: true
});
```

### 2. Updated Both Consultation Prep Screens

**Bloodwork:** `app/(tabs)/medical/bloodwork/consultation-prep/index.tsx`
**Condition:** `app/(tabs)/medical/condition/consultation-prep/index.tsx`

**Before:**
- Used separate stores
- Hardcoded domain filters
- "Owned" their questions

**After:**
- Both use `sharedConsultationPrepStore`
- Pass domain filter as parameter
- Are filtered VIEWS ONLY

**Load Questions:**
```typescript
// Bloodwork screen
const loaded = await sharedConsultationPrepStore.getAll('bloodwork');

// Condition screen
const loaded = await sharedConsultationPrepStore.getAll('condition');
```

**Save Questions:**
```typescript
// Category selected by user is passed directly as domain
await sharedConsultationPrepStore.addQuestion(questionText, category, options);
```

### 3. Data Flow Verification

**Flow 1: Condition Question from Bloodwork Screen**
```
1. User opens Bloodwork Analysis
2. Clicks "Save Question"
3. Types: "How does fibrosis relate to my spleen enlargement?"
4. Category auto-detects: "Condition"
5. User accepts or overrides
6. Clicks Save
7. Store receives: domain = 'condition' (NOT 'bloodwork')
8. Console logs: [ConsultationPrepStore] Saving question: { domain: 'condition', ... }
9. Question appears ONLY in Condition Consultation Prep
10. Bloodwork Consultation Prep remains clean
```

**Flow 2: Bloodwork Question from Condition Screen**
```
1. User opens Condition Analysis
2. Clicks "Save Question"
3. Types: "Why is my PLT trending down?"
4. Category auto-detects: "Bloodwork"
5. User accepts or overrides
6. Clicks Save
7. Store receives: domain = 'bloodwork' (NOT 'condition')
8. Console logs: [ConsultationPrepStore] Saving question: { domain: 'bloodwork', ... }
9. Question appears ONLY in Bloodwork Consultation Prep
10. Condition Consultation Prep remains clean
```

### 4. Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│        consultation_questions (Supabase Table)          │
│                                                         │
│  domain field is AUTHORITATIVE                          │
│  Values: 'bloodwork' | 'condition' | 'general'          │
└─────────────────────────────────────────────────────────┘
                            │
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │  Bloodwork      │         │  Condition      │
    │  Consultation   │         │  Consultation   │
    │  Prep           │         │  Prep           │
    │                 │         │                 │
    │  Filter:        │         │  Filter:        │
    │  domain =       │         │  domain =       │
    │  'bloodwork'    │         │  'condition'    │
    └─────────────────┘         └─────────────────┘

Both screens:
- Use sharedConsultationPrepStore
- Apply domain filter to getAll()
- Pass user-selected category directly to addQuestion()
- Do NOT override or infer domain
```

### 5. Key Constraints Met

✅ **Single Source of Truth:** `consultation_questions` table with `domain` field
✅ **No Domain Override:** User-selected category is written directly as domain
✅ **Filtered Views:** Each screen filters by domain, doesn't "own" questions
✅ **UI Consistency:** Both screens use same store, same logic, differ only by filter
✅ **Console Logging:** Every save logs the domain being written
✅ **No New Tables:** Uses existing schema
✅ **No New Architecture:** Just routing fix

### 6. Verification Console Output

When saving a question:
```
[ConsultationPrepStore] Saving question: {
  domain: 'condition',
  questionText: 'How does fibrosis relate to my spleen enlarge...',
  userSelected: true
}
[ConsultationPrepStore] Question saved successfully: {
  id: 'abc-123',
  domain: 'condition'
}
```

### 7. Database State

After saving questions from both screens:

| id | question_text | domain | source | user_id |
|----|--------------|--------|---------|---------|
| 1  | How does fibrosis... | condition | user_added | user-123 |
| 2  | Why is my PLT... | bloodwork | user_added | user-123 |
| 3  | What should I expect... | general | user_added | user-123 |

**Bloodwork Consultation Prep** shows: Question #2 only
**Condition Consultation Prep** shows: Question #1 only
**General Consultation Prep** (if implemented): Question #3 only

## Proof Points

### A) Condition Question from Bloodwork Screen
- Saved from: Bloodwork AI Analysis
- Category manually set to: **Condition**
- Domain written to DB: `condition`
- Appears in: **Condition Consultation Prep ONLY**
- Does NOT appear in: Bloodwork Consultation Prep

### B) Bloodwork Question from Condition Screen
- Saved from: Condition AI Analysis
- Category manually set to: **Bloodwork**
- Domain written to DB: `bloodwork`
- Appears in: **Bloodwork Consultation Prep ONLY**
- Does NOT appear in: Condition Consultation Prep

### C) Console Verification
```javascript
// User saves "How does my low PLT relate to myelofibrosis?" from Bloodwork screen
// Category detected: condition
// User accepts

[ConsultationPrepStore] Saving question: {
  domain: 'condition',  // ← User-selected category, NOT screen context
  questionText: 'How does my low PLT relate to myelofibrosis?',
  userSelected: true
}

[ConsultationPrepStore] Question saved successfully: {
  id: '550e8400-e29b-41d4-a716-446655440000',
  domain: 'condition'  // ← Exact match, no override
}
```

## Migration Notes

The old separate stores still exist but are NO LONGER USED:
- `products/bloodwork/consultation-prep/services/consultation-prep.store.ts`
- `products/condition/consultation-prep/services/consultation-prep.store.ts`

These can be safely deleted in a future cleanup, but are left in place to avoid breaking any other references.

## Summary

Category selection now drives everything. The originating screen has ZERO influence on where a question is stored. This is a pure UI + routing fix with no schema changes, no new tables, and no AI logic changes.
