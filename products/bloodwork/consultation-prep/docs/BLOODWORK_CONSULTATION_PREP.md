# Bloodwork Consultation Prep — Technical Documentation

## Overview

Consultation Prep is a local-only feature that helps users organize questions about their bloodwork results to ask their clinician.

**Critical Design Principle:** This feature stores data ONLY on the device using AsyncStorage. No Supabase tables, no RLS, no backend synchronization.

---

## User Story

**As a user reviewing my bloodwork results**, I want to save questions that come up during analysis so I can remember to ask my clinician during my next appointment.

---

## Data Model

```typescript
interface ConsultationQuestion {
  id: string;                    // Unique identifier
  questionText: string;          // The question to ask
  createdAt: string;             // ISO timestamp
  status: 'open' | 'asked' | 'resolved';
  relatedMarkers?: string[];     // e.g., ['PLT', 'WBC']
  source?: 'gemma' | 'manual';   // Where question originated
  sourceContext?: {              // Context from bloodwork
    testDate?: string;
    marker?: string;
    value?: string;
    range?: string;
  };
  updatedAt?: string;            // ISO timestamp of last update
}
```

---

## Storage

**Storage Key:** `@path9_bloodwork_consult_prep`

**Storage Format:**
```json
{
  "questions": [
    {
      "id": "q_1735689123456_abc123",
      "questionText": "Can you explain why my platelets have stayed above the reference range over the last year?",
      "createdAt": "2024-12-31T12:00:00.000Z",
      "status": "open",
      "relatedMarkers": ["PLT"],
      "source": "gemma",
      "sourceContext": {
        "testDate": "2024-12-15",
        "marker": "PLT",
        "value": "413 ×10⁹/L",
        "range": "150-400 ×10⁹/L"
      }
    }
  ]
}
```

---

## API (CRUD Operations)

### consultationPrepStore.getAll()
Returns all questions, newest first.

### consultationPrepStore.addQuestion(questionText, options?)
Adds a new question. Options:
- `relatedMarkers?: string[]`
- `source?: 'gemma' | 'manual'`
- `sourceContext?: SourceContext`

### consultationPrepStore.updateQuestion(id, updates)
Updates any fields except `id` and `createdAt`.

### consultationPrepStore.updateStatus(id, status)
Convenience method for status changes.

### consultationPrepStore.deleteQuestion(id)
Removes a question permanently.

### consultationPrepStore.getByStatus(status)
Filters questions by status.

### consultationPrepStore.getByMarker(marker)
Filters questions by related marker.

---

## UI Components

### QuestionCard
Displays a single question with:
- Question text
- Status pill (open/asked/resolved)
- Related marker tags
- Created date
- Actions (edit, delete, change status)

### AddQuestionModal
Form for adding/editing questions:
- Text input (multiline)
- Optional marker tag selector
- Save/Cancel buttons

### FilterTabs
Simple tab bar for filtering:
- All
- Open
- Asked
- Resolved

---

## Integration with Gemma Chat

When Gemma's response includes a clinician handoff, the edge function returns:

```json
{
  "reply": "...",
  "showSaveToConsultationPrep": true,
  "suggestedQuestion": "Can you explain why...",
  "relatedMarkers": ["PLT"],
  "sourceContext": {
    "testDate": "2024-12-15",
    "marker": "PLT",
    "value": "413 ×10⁹/L",
    "range": "150-400 ×10⁹/L"
  }
}
```

The chat UI detects `showSaveToConsultationPrep` and renders a button:
"Save a question for my next appointment"

Clicking opens `AddQuestionModal` with pre-filled data.

---

## Route Structure

**Route:** `/app/(tabs)/medical/bloodwork/consultation-prep/index.tsx`

**Screen Layout:**
```
┌─────────────────────────────────────┐
│ ← Bloodwork                         │
├─────────────────────────────────────┤
│ Consultation Prep                   │
│ Save questions you want to ask      │
│ your clinician. Stored on this      │
│ device only.                        │
├─────────────────────────────────────┤
│ [+ Add Question]                    │
├─────────────────────────────────────┤
│ [All] [Open] [Asked] [Resolved]     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Can you explain why my...       │ │
│ │ Open • PLT • Dec 31             │ │
│ │ [Asked] [Resolved] [Edit] [×]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ What does my WBC trend...       │ │
│ │ Asked • WBC • Dec 29            │ │
│ │ [Resolved] [Edit] [×]           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Entry Point

**Location:** `/app/(tabs)/medical/bloodwork/index.tsx`

Add a card in the "Management" section:
```tsx
<TouchableOpacity
  onPress={() => router.push('/medical/bloodwork/consultation-prep')}
  style={styles.card}
>
  <Text style={styles.cardTitle}>Consultation Prep</Text>
  <Text style={styles.cardDescription}>
    Questions to ask your clinician
  </Text>
</TouchableOpacity>
```

---

## Design Principles

### Calm & Simple
- No urgency
- No pressure to "complete" questions
- Users set their own pace

### Local-Only
- Privacy by default
- No sync, no cloud storage
- User owns their data

### Non-Medical
- This is prep, not diagnosis
- Questions are user-generated or Gemma-suggested
- No medical interpretation

### Integration, Not Disruption
- Surfaces naturally during bloodwork review
- Optional — never forced
- Fits into existing workflow

---

## Future Considerations (Out of Scope)

- Export questions to PDF/text
- Share with clinician via secure messaging
- Pre-appointment reminders
- Question templates library

---

## Testing

Manual testing checklist:
- [ ] Add question from Gemma chat
- [ ] Add question manually
- [ ] Edit question text
- [ ] Change status (open → asked → resolved)
- [ ] Delete question
- [ ] Filter by status
- [ ] Questions persist across app restarts
- [ ] Dark theme renders correctly
- [ ] Long question text wraps properly
- [ ] Multiple marker tags display correctly

---

## Security & Privacy

- All data stored locally on device
- No network transmission
- No Supabase persistence
- User can clear all data via storage service
- No PHI/PII in question text (user discretion)

---

## Files Created

```
/products/bloodwork/consultation-prep/
├── types/consultation-prep.types.ts
├── services/consultation-prep.store.ts
├── components/
│   ├── QuestionCard.tsx
│   ├── AddQuestionModal.tsx
│   └── FilterTabs.tsx
├── docs/
│   └── BLOODWORK_CONSULTATION_PREP.md
└── README.md

/app/(tabs)/medical/bloodwork/consultation-prep/
└── index.tsx
```

---

## Summary

Consultation Prep provides a calm, private way for users to organize questions about their bloodwork before meeting with their clinician. It integrates naturally with Gemma's analysis capabilities and respects user autonomy by keeping all data local.
