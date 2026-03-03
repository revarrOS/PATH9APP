# Bloodwork Consultation Prep

A local-only feature for preparing questions to ask clinicians about bloodwork results.

## Purpose

Helps users:
- Save questions sparked during bloodwork review
- Organize questions by marker or topic
- Track which questions have been asked/answered
- Review before appointments

## Storage

**Local-only** using AsyncStorage (`@path9_bloodwork_consult_prep`)

No Supabase tables. All data stays on device.

## Architecture

```
consultation-prep/
├── types/
│   └── consultation-prep.types.ts     # TypeScript interfaces
├── services/
│   └── consultation-prep.store.ts     # AsyncStorage CRUD operations
├── components/
│   ├── QuestionCard.tsx               # Individual question display
│   ├── AddQuestionModal.tsx           # Form for adding/editing
│   └── FilterTabs.tsx                 # Status filter UI
└── docs/
    └── BLOODWORK_CONSULTATION_PREP.md # Detailed documentation
```

## Integration Points

1. **Bloodwork Analysis Chat** (`BloodworkChat.tsx`)
   - "Save question" button appears when Gemma suggests clinician handoff
   - Pre-fills suggested question
   - Tags related markers automatically

2. **Bloodwork Management Screen** (`/app/(tabs)/medical/bloodwork/index.tsx`)
   - Entry point card to Consultation Prep

3. **Route** (`/app/(tabs)/medical/bloodwork/consultation-prep/index.tsx`)
   - Main UI for reviewing/managing questions

## Data Flow

```
User asks Gemma → Gemma provides info + clinician handoff
                ↓
      "Save question" button appears
                ↓
    Modal pre-filled with suggested question
                ↓
         User saves (optional edits)
                ↓
      Stored locally via AsyncStorage
                ↓
       Visible in Consultation Prep list
```

## See Also

- [Detailed Documentation](./docs/BLOODWORK_CONSULTATION_PREP.md)
- [Bloodwork Architecture](../ARCHITECTURE.md)
