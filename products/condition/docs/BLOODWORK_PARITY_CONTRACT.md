# Bloodwork → Condition Management: UX Parity Contract

**Date:** 2026-02-04
**Status:** Design & Planning Phase
**Objective:** Define exact behavioral parity between Bloodwork and Condition Management

---

## PART 1: UX & COMPONENT MAPPING

### Core Principle

**"If you understand Bloodwork Management, you already understand Condition Management."**

Every interaction pattern, visual affordance, and data flow in Bloodwork has a direct analog in Condition Management.

---

### 1. Entry Creation & Data Input

| Bloodwork Feature | Condition Feature | Implementation | Notes |
|------------------|-------------------|----------------|-------|
| **Manual entry form** | **Manual text paste** | Reuse AS-IS | Replace marker fields with freeform text area |
| **Image upload → AI extraction** | **PDF upload → AI extraction** | Adapt | Replace Image Picker with Document Picker |
| **"AI extracted — please review" yellow highlight** | **"AI extracted — please review" yellow highlight** | Reuse AS-IS | Exact same visual treatment |
| **AI badge on fields** `[AI]` | **AI badge on cards** `[AI]` | Reuse AS-IS | Same badge styling |
| **"Please review AI-extracted values before saving"** banner | **"Please review AI-extracted data before accepting"** banner | Reuse AS-IS | Same banner component, adapted text |
| **Smart normalization notice** | **Not applicable** | N/A | Numeric-only feature |
| **Validation warnings (yellow border)** | **Confidence warnings (yellow border)** | Adapt | Show low-confidence extractions |
| **Save button (top right)** | **Accept/Save button (context-dependent)** | Reuse AS-IS | Same placement, same states |

---

### 2. Timeline / Entry List

| Bloodwork Feature | Condition Feature | Implementation | Notes |
|------------------|-------------------|----------------|-------|
| **Timeline list (newest first)** | **Timeline list (newest first)** | Reuse AS-IS | Chronological order |
| **Sort toggle (Latest/Earliest)** | **Sort toggle (Latest/Earliest)** | Reuse AS-IS | Exact same control |
| **Test card: Date / Location / Marker count** | **Entry card: Date / Source / Event type** | Adapt | Same card structure, different content fields |
| **Empty state: "No tests recorded yet"** | **Empty state: "No entries yet"** | Reuse AS-IS | Same empty state pattern |
| **Tap to view detail** | **Tap to view detail** | Reuse AS-IS | Same navigation pattern |
| **Back button (top left)** | **Back button (top left)** | Reuse AS-IS | Consistent navigation |
| **Add button (top right, cyan, circular)** | **Add button (top right, cyan, circular)** | Reuse AS-IS | Exact same button |

---

### 3. Entry Detail View

| Bloodwork Feature | Condition Feature | Implementation | Notes |
|------------------|-------------------|----------------|-------|
| **Header: Back / Title / Edit / Delete** | **Header: Back / Title / Edit / Delete** | Reuse AS-IS | Exact same layout |
| **Date (large, bold)** | **Date (large, bold)** | Reuse AS-IS | Same typography |
| **Location (secondary text)** | **Source (secondary text)** | Adapt | "From letter [ID]" |
| **Notes section** | **Notes section** | Reuse AS-IS | Same expandable notes |
| **Marker cards (value + unit + range)** | **Event cards (description + context)** | Adapt | Same card structure, narrative content |
| **Delete confirmation dialog** | **Delete confirmation dialog** | Reuse AS-IS | Same wording pattern |
| **Loading spinner (center)** | **Loading spinner (center)** | Reuse AS-IS | Same loading state |
| **Error banner (red, top)** | **Error banner (red, top)** | Reuse AS-IS | Same error treatment |

---

### 4. Consultation Prep

| Bloodwork Feature | Condition Feature | Implementation | Notes |
|------------------|-------------------|----------------|-------|
| **Question cards with status pills** | **Question cards with status pills** | **Reuse AS-IS** | **100% identical** |
| **Status: Open / Asked / Resolved** | **Status: Open / Asked / Resolved** | **Reuse AS-IS** | **Exact same states** |
| **Filter tabs (All / Open / Asked / Resolved)** | **Filter tabs (All / Open / Asked / Resolved)** | **Reuse AS-IS** | **Exact same component** |
| **Add Question button** | **Add Question button** | **Reuse AS-IS** | **Same modal flow** |
| **Edit / Delete actions** | **Edit / Delete actions** | **Reuse AS-IS** | **Same affordances** |
| **Related markers tags (cyan)** | **Related topics tags (cyan)** | Adapt | Same styling, different semantic meaning |
| **Source context ("HGB 85 • Jan 10")** | **Source context ("From letter • Jan 10")** | Adapt | Same component, different data source |
| **Stored locally (AsyncStorage)** | **Stored in Supabase (consultation_questions table)** | Adapt | Different storage layer, same API interface |
| **Smart deduplication logic** | **Smart deduplication logic** | **Reuse AS-IS** | **Exact same algorithm** |

---

### 5. Care Team Management

| Bloodwork Feature | Condition Feature | Implementation | Notes |
|------------------|-------------------|----------------|-------|
| **Contact card: Name / Role / Institution** | **Contact card: Name / Role / Institution** | **Reuse AS-IS** | **100% identical** |
| **Role badges with color coding** | **Role badges with color coding** | **Reuse AS-IS** | **Same visual system** |
| **Empty state: "No contacts yet"** | **Empty state: "No contacts yet"** | **Reuse AS-IS** | **Same empty state** |
| **Add contact button (top right)** | **Add contact button (top right)** | **Reuse AS-IS** | **Same button** |
| **Edit mode (swipe or tap)** | **Edit mode (swipe or tap)** | **Reuse AS-IS** | **Same interaction** |
| **Delete confirmation** | **Delete confirmation** | **Reuse AS-IS** | **Same dialog** |
| **Form: Name / Role / Email / Phone / Notes** | **Form: Name / Role / Email / Phone / Notes** | **Reuse AS-IS** | **Exact same form** |
| **Source attribution in notes** | **Source attribution in notes ("From letter [ID]")** | Adapt | Same pattern, different source |

---

### 6. AI Suggestions & User Review

| Bloodwork Feature | Condition Feature | Implementation | Notes |
|------------------|-------------------|----------------|-------|
| **AI-extracted data highlighted (yellow background)** | **AI-extracted data highlighted (yellow background)** | **Reuse AS-IS** | **Exact visual affordance** |
| **User edits remove AI badge** | **User edits remove AI badge** | **Reuse AS-IS** | **Same state transition** |
| **Save = commit to database** | **Accept = commit to database** | **Reuse AS-IS** | **Same semantic meaning** |
| **No silent background inserts** | **No silent background inserts** | **Reuse AS-IS** | **Hard constraint** |
| **Analysis warnings shown in banner** | **Analysis warnings shown in banner** | **Reuse AS-IS** | **Same component** |
| **Confidence indicators for low-confidence data** | **Confidence indicators for low-confidence data** | **Reuse AS-IS** | **Same visual treatment** |

---

### 7. Delete Behavior

| Bloodwork Feature | Condition Feature | Implementation | Notes |
|------------------|-------------------|----------------|-------|
| **Confirmation dialog with consequences** | **Confirmation dialog with consequences** | **Reuse AS-IS** | **Same wording structure** |
| **"This action cannot be undone"** | **"This action cannot be undone"** | **Reuse AS-IS** | **Same language** |
| **Cascade delete (test + markers)** | **Cascade delete (document + signals)** | Adapt | Same pattern, different relationships |
| **Navigate back after delete** | **Navigate back after delete** | **Reuse AS-IS** | **Same flow** |
| **Delete button (red, trash icon)** | **Delete button (red, trash icon)** | **Reuse AS-IS** | **Same visual treatment** |

---

### 8. Status & Transparency

| Bloodwork Feature | Condition Feature | Implementation | Notes |
|------------------|-------------------|----------------|-------|
| **Processing states: uploading / analyzing / complete** | **Processing states: uploading / analyzing / complete** | **Reuse AS-IS** | **Same state machine** |
| **Source badges ("Manual" vs "AI-extracted")** | **Source badges ("Manual" vs "AI-extracted")** | **Reuse AS-IS** | **Same badge system** |
| **Timestamp on entries** | **Timestamp on entries** | **Reuse AS-IS** | **Same format** |
| **"Stored on this device only" disclaimer** | **"Stored securely" (Supabase)** | Adapt | Different storage context |

---

## PART 2: EXTRACTION → PREPOPULATION BRIDGE

### Core Design Principle

**"AI suggests → User reviews → User confirms → Then saved"**

### The Bloodwork Pattern (Gold Standard)

**Bloodwork Image Upload Flow:**

1. User uploads image
2. `analyze-bloodwork-image` extracts values
3. Extracted values populate form fields **WITH YELLOW HIGHLIGHT**
4. User reviews each field:
   - Accept (leave as-is)
   - Edit (removes yellow highlight)
   - Delete (clear field)
5. User taps **Save**
6. Only then are values written to `bloodwork_entries` + `bloodwork_markers`

**Key insight:** The form is the review interface. Nothing commits until Save is pressed.

---

### The Condition Pattern (Must Mirror Bloodwork)

**Condition Letter Upload Flow:**

#### Phase 1: Upload & Extraction (Already Working)

1. User uploads PDF → `condition_documents` (status: `uploaded`)
2. `analyze-condition-letter` processes PDF
3. Extraction JSON stored in `condition_documents.extraction_json` (status: `extracted`)
4. User sees: "Extraction complete — review suggested data"

#### Phase 2: Review Interface (NEW — MUST BUILD)

**THIS IS WHERE THE BLOODWORK PATTERN APPLIES**

Letter detail screen shows:

**Section 1: Clinical Summary (Read-only)**
- Top 3 clinical assessment points
- Just for context, not actionable

**Section 2: Suggested Timeline Entries** ⚠️ **REVIEW REQUIRED**

```
┌─────────────────────────────────────────────┐
│ ⚠ Review Suggested Timeline Entries         │
│                                              │
│ ┌────────────────────────────────────────┐ │
│ │ [AI] Jan 10, 2026 — Review              │ │
│ │ "Routine 3-month follow-up appointment"│ │
│ │ Significance: Medium                    │ │
│ │                                          │ │
│ │ [Accept] [Edit] [Reject]                │ │
│ └────────────────────────────────────────┘ │
│                                              │
│ ┌────────────────────────────────────────┐ │
│ │ [AI] Jan 15, 2026 — Diagnosis           │ │
│ │ "CLL Stage II confirmed"                │ │
│ │ Significance: High                      │ │
│ │                                          │ │
│ │ [Accept] [Edit] [Reject]                │ │
│ └────────────────────────────────────────┘ │
│                                              │
│ Total: 2 suggested entries                  │
│ Accepted: 0 • Pending review: 2             │
└─────────────────────────────────────────────┘
```

**Section 3: Suggested Care Team Contacts** ⚠️ **REVIEW REQUIRED**

```
┌─────────────────────────────────────────────┐
│ ⚠ Review Suggested Contacts                 │
│                                              │
│ ┌────────────────────────────────────────┐ │
│ │ [AI] Dr Sarah Johnson                   │ │
│ │ Consultant Haematologist                │ │
│ │ Royal Marsden Hospital                  │ │
│ │ 020 7352 8171                           │ │
│ │                                          │ │
│ │ [Accept] [Edit] [Reject]                │ │
│ └────────────────────────────────────────┘ │
│                                              │
│ Total: 1 suggested contact                  │
│ Accepted: 0 • Pending review: 1             │
└─────────────────────────────────────────────┘
```

**Section 4: Suggested Questions** ⚠️ **REVIEW REQUIRED**

```
┌─────────────────────────────────────────────┐
│ ⚠ Review Suggested Questions                │
│                                              │
│ ┌────────────────────────────────────────┐ │
│ │ [AI] "What does 'watch and wait' mean   │ │
│ │ for my treatment plan?"                 │ │
│ │ Priority: Clinical                      │ │
│ │                                          │ │
│ │ [Accept] [Edit] [Reject]                │ │
│ └────────────────────────────────────────┘ │
│                                              │
│ Total: 3 suggested questions                │
│ Accepted: 0 • Pending review: 3             │
└─────────────────────────────────────────────┘
```

**Bottom Action:**
```
┌─────────────────────────────────────────────┐
│     [Accept All Reviewed Items] (Cyan)      │
│                                              │
│ This will add 2 timeline entries, 1 contact,│
│ and 3 questions to your records.            │
│                                              │
│ You can edit or remove them anytime.        │
└─────────────────────────────────────────────┘
```

---

### User Actions & State Transitions

#### Individual Item Actions

**Accept:**
- Item marked as `status: 'accepted'` in UI state
- Yellow highlight removed
- Badge changes from `[AI]` to `[✓ Accepted]` (green)

**Edit:**
- Opens inline edit form (like Bloodwork marker editing)
- User modifies fields
- Item marked as `status: 'edited'`
- Badge changes from `[AI]` to `[Edited]` (blue)

**Reject:**
- Item marked as `status: 'rejected'`
- Item fades out and collapses
- Not included in final save

#### Bulk Action

**Accept All Reviewed Items:**
- Iterate through all accepted/edited items
- INSERT into respective tables:
  - `condition_entries` (timeline events)
  - `condition_care_team` (contacts)
  - `consultation_questions` (questions with `source: 'ai_suggested'`)
  - `condition_trend_signals` (if applicable)
- Show success message: "3 timeline entries, 1 contact, and 2 questions added"
- Update letter status: `suggestions_reviewed: true`
- Navigate back or stay on detail screen

---

### Database Writes (Only After Confirmation)

**Before user accepts:**
- `condition_documents.extraction_json` contains suggestions
- No writes to downstream tables
- Zero risk of polluting user's timeline

**After user accepts:**

```sql
-- Timeline entries
INSERT INTO condition_entries (user_id, document_date, document_type, document_body, source_document_id)
SELECT user_id, event.date, event.event_type, event.description, document_id
FROM accepted_timeline_events;

-- Care team contacts
INSERT INTO condition_care_team (user_id, name, role, institution, phone, email, notes)
SELECT user_id, contact.name, contact.role, contact.institution, contact.phone, contact.email,
       '[AUTO] From letter ' || document_id
FROM accepted_contacts;

-- Consultation questions (with deduplication)
FOR EACH accepted_question:
  result = consultationPrepService.addQuestion(
    question_text,
    {
      source: 'ai_suggested',
      domain: 'condition',
      related_entry_id: document_id,
      priority: question.priority
    }
  );
  IF result.isDuplicate:
    SHOW "Question similar to existing — skipped"
  ELSE:
    count_added++

-- Trend signals
INSERT INTO condition_trend_signals (user_id, document_id, signal_date, signal_type, polarity, category, description, confidence)
SELECT user_id, document_id, signal.signal_date, signal.signal_type, signal.polarity, signal.category, signal.description, signal.confidence
FROM accepted_trend_signals;
```

---

### Deduplication Strategy

**Timeline Entries:**
- Check for existing entry with same date + similar description (fuzzy match)
- If found: Show warning "Similar entry exists on Jan 10 — still add?"
- User confirms or rejects

**Care Team Contacts:**
- Check for existing contact with same name + institution
- If found: Show warning "Dr Sarah Johnson already in your care team — update instead?"
- User confirms or merges

**Consultation Questions:**
- Use Bloodwork's `findSimilarQuestion()` algorithm (text similarity + intent keywords)
- If duplicate detected: Skip silently, show count: "2 questions added, 1 skipped (duplicate)"

**Trend Signals:**
- No deduplication (multiple signals from different letters is valid)

---

### Error Handling

**Extraction Failure:**
- Letter shows status: `failed`
- No suggestions to review
- User can still view extracted text (if any)
- Manual entry option available

**Partial Extraction:**
- Letter shows status: `partial`
- Only extracted fields shown for review
- Warning: "Some data could not be extracted — please review carefully"

**Save Failure:**
- Show error banner: "Failed to save — please try again"
- Items remain in review state
- User can retry

---

## PART 3: IMPLEMENTATION PLAN

### Step 1: Update Extraction Logic

**File:** `supabase/functions/analyze-condition-letter/index.ts`

**Changes:**
1. Replace generic Gemma prompt with structured extraction prompt
2. Enforce JSON schema from `VISION_OUTPUT_SCHEMA.md`
3. Parse timeline_events, contacts, consultation_questions, trend_signals
4. Store in `extraction_json` (no DB inserts yet)
5. Add PII detection logic (use Vision API to identify PII spans)
6. Generate `masked_text` with PII replaced

**Prompt template:**
```typescript
const structuredPrompt = `
Analyze this medical letter and extract structured information.

Return a JSON object with these fields:
{
  "timeline_events": [...],
  "contacts": [...],
  "consultation_questions": [...],
  "trend_signals": [...],
  "pii_spans": [...],
  "clinical_assessment": [...],
  "confidence_score": 0.0-1.0
}

For timeline_events, extract significant milestones with dates.
For contacts, extract clinician names, roles, and contact details.
For consultation_questions, suggest 3-5 questions a patient might ask based on this letter.
For pii_spans, identify all personal information (names, DOB, addresses, NHS numbers).

Return valid JSON only. No markdown.
`;
```

---

### Step 2: Create Review Interface Component

**File:** `products/condition/components/LetterReviewInterface.tsx`

**Component structure:**
```typescript
interface LetterReviewInterfaceProps {
  document: ConditionDocument;
  onAcceptAll: (acceptedData: AcceptedSuggestions) => Promise<void>;
}

interface AcceptedSuggestions {
  timelineEntries: Array<TimelineEntry & { status: 'accepted' | 'edited' }>;
  contacts: Array<ContactSuggestion & { status: 'accepted' | 'edited' }>;
  questions: Array<QuestionSuggestion & { status: 'accepted' | 'edited' }>;
  signals: Array<TrendSignal & { status: 'accepted' | 'edited' }>;
}

export function LetterReviewInterface({ document, onAcceptAll }: Props) {
  const [reviewState, setReviewState] = useState<ReviewState>({
    timelineEntries: parseTimelineEntries(document.extraction_json),
    contacts: parseContacts(document.extraction_json),
    questions: parseQuestions(document.extraction_json),
    signals: parseSignals(document.extraction_json),
  });

  const handleAcceptItem = (category: string, index: number) => {
    // Mark item as accepted
  };

  const handleEditItem = (category: string, index: number, newData: any) => {
    // Update item with user edits
  };

  const handleRejectItem = (category: string, index: number) => {
    // Mark item as rejected
  };

  const handleAcceptAll = async () => {
    const accepted = filterAcceptedItems(reviewState);
    await onAcceptAll(accepted);
  };

  return (
    <ScrollView>
      <SuggestedTimelineSection
        entries={reviewState.timelineEntries}
        onAccept={handleAcceptItem}
        onEdit={handleEditItem}
        onReject={handleRejectItem}
      />
      <SuggestedContactsSection ... />
      <SuggestedQuestionsSection ... />
      <AcceptAllButton onPress={handleAcceptAll} />
    </ScrollView>
  );
}
```

---

### Step 3: Update Letter Detail Screen

**File:** `app/(tabs)/medical/condition/letters/[id].tsx`

**Changes:**
1. After extraction completes, show review interface
2. Replace current "Prepopulated X items" with review interface
3. Add `onAcceptAll` handler that writes to DB
4. Show success message after acceptance

**Before:**
```typescript
{totalPrepopulated > 0 && (
  <View style={styles.section}>
    <Text>Prepopulated into your records</Text>
    <Text>✓ {prepopulationCount.entries} timeline entries</Text>
  </View>
)}
```

**After:**
```typescript
{document.extraction_status === 'extracted' && !document.suggestions_reviewed && (
  <LetterReviewInterface
    document={document}
    onAcceptAll={handleAcceptSuggestions}
  />
)}

{document.suggestions_reviewed && (
  <View style={styles.section}>
    <Text>✓ Data from this letter has been reviewed and added</Text>
  </View>
)}
```

---

### Step 4: Implement Prepopulation Logic

**File:** `products/condition/services/condition.service.ts`

**New method:**
```typescript
async acceptLetterSuggestions(
  documentId: string,
  acceptedData: AcceptedSuggestions
): Promise<PrepopulationResult> {
  const results = {
    timelineEntriesAdded: 0,
    contactsAdded: 0,
    questionsAdded: 0,
    signalsAdded: 0,
    duplicatesSkipped: 0,
  };

  // 1. Insert timeline entries
  for (const entry of acceptedData.timelineEntries) {
    if (entry.status === 'rejected') continue;

    const { data, error } = await supabase
      .from('condition_entries')
      .insert({
        user_id: userId,
        document_date: entry.date,
        document_type: entry.event_type,
        document_body: entry.description,
        source_document_id: documentId,
      });

    if (!error) results.timelineEntriesAdded++;
  }

  // 2. Insert contacts
  for (const contact of acceptedData.contacts) {
    if (contact.status === 'rejected') continue;

    // Check for duplicate
    const existing = await this.findExistingContact(contact.name, contact.institution);
    if (existing) {
      results.duplicatesSkipped++;
      continue;
    }

    await supabase.from('condition_care_team').insert({
      user_id: userId,
      name: contact.name,
      role: contact.role,
      institution: contact.institution,
      phone: contact.phone,
      email: contact.email,
      notes: `[AUTO] From letter ${documentId}`,
    });

    results.contactsAdded++;
  }

  // 3. Insert questions (with deduplication)
  for (const question of acceptedData.questions) {
    if (question.status === 'rejected') continue;

    const result = await consultationPrepService.addQuestion(
      question.question_text,
      {
        source: 'ai_suggested',
        domain: 'condition',
        related_entry_id: documentId,
        priority: question.priority,
      }
    );

    if ('isDuplicate' in result) {
      results.duplicatesSkipped++;
    } else {
      results.questionsAdded++;
    }
  }

  // 4. Insert trend signals
  for (const signal of acceptedData.signals) {
    if (signal.status === 'rejected') continue;

    await supabase.from('condition_trend_signals').insert({
      user_id: userId,
      document_id: documentId,
      signal_date: signal.signal_date,
      signal_type: signal.signal_type,
      polarity: signal.polarity,
      category: signal.category,
      description: signal.description,
      confidence: signal.confidence,
    });

    results.signalsAdded++;
  }

  // 5. Mark letter as reviewed
  await supabase
    .from('condition_documents')
    .update({ suggestions_reviewed: true })
    .eq('id', documentId);

  return results;
}
```

---

### Step 5: Update Database Schema

**Migration:** `add_suggestions_reviewed_flag.sql`

```sql
-- Add flag to track if user has reviewed suggestions
ALTER TABLE condition_documents
ADD COLUMN suggestions_reviewed boolean DEFAULT false;

-- Index for queries filtering reviewed/pending letters
CREATE INDEX idx_condition_documents_reviewed
ON condition_documents(user_id, suggestions_reviewed);
```

---

### Step 6: Component Reuse Checklist

**Components to copy from Bloodwork:**

1. ✅ **Status badge component** → Use for suggestion states
2. ✅ **AI extraction banner** → "Please review AI-extracted data"
3. ✅ **Confirmation dialog** → Delete confirmations
4. ✅ **Empty state component** → "No entries yet"
5. ✅ **QuestionCard** → Reuse AS-IS for consultation prep
6. ✅ **KeyContactCard** → Reuse AS-IS for care team
7. ✅ **FilterTabs** → Reuse AS-IS for question filtering

**New components needed:**

1. `SuggestedTimelineEntryCard` (adapt from marker card)
2. `SuggestedContactCard` (adapt from KeyContactCard)
3. `SuggestedQuestionCard` (adapt from QuestionCard)
4. `AcceptRejectEditControls` (new, but follows Bloodwork button patterns)

---

## SUCCESS CRITERIA

### Behavioral Parity Achieved When:

✅ **No data writes without explicit user confirmation**
- Nothing appears in timeline/care team/questions without user review

✅ **AI suggestions visually identical to Bloodwork**
- Yellow highlights, AI badges, review banners

✅ **State transitions match Bloodwork**
- AI → Accepted → Saved
- AI → Edited → Saved
- AI → Rejected → Discarded

✅ **Error handling mirrors Bloodwork**
- Same banner styling, same wording patterns

✅ **Delete behavior mirrors Bloodwork**
- Same confirmation dialogs, same cascade logic

✅ **Component styling consistent**
- Same card layouts, same typography, same colors

✅ **Mental model preserved**
- "If you understand Bloodwork, you understand Condition"

---

## HARD CONSTRAINTS

❌ **NEVER auto-write to downstream tables**
❌ **NEVER bypass user review**
❌ **NEVER invent new UX patterns**
❌ **NEVER make Gemma authoritative**
❌ **NEVER surprise the user**

✅ **ALWAYS require explicit confirmation**
✅ **ALWAYS highlight AI-extracted data**
✅ **ALWAYS allow edit before accept**
✅ **ALWAYS provide reject option**
✅ **ALWAYS show what will be saved**

---

## IMPLEMENTATION SEQUENCE

1. **Phase 1:** Update extraction logic (structured JSON)
2. **Phase 2:** Build review interface components
3. **Phase 3:** Wire up accept/reject/edit handlers
4. **Phase 4:** Implement prepopulation service methods
5. **Phase 5:** Add deduplication logic
6. **Phase 6:** Update letter detail screen
7. **Phase 7:** End-to-end testing with real letters
8. **Phase 8:** Refinement based on Bloodwork visual parity audit

---

## ROLLOUT VERIFICATION

Before considering this complete:

1. **Upload a letter** → Extraction completes
2. **Review interface appears** → No auto-writes
3. **Accept 2 entries, edit 1 contact, reject 1 question** → Correct state
4. **Tap "Accept All Reviewed Items"** → DB writes happen
5. **Navigate to Timeline** → 2 new entries appear
6. **Navigate to Care Team** → 1 new contact appears
7. **Navigate to Consultation Prep** → Questions appear (with dedup)
8. **Verify source attribution** → "From letter [ID]" visible
9. **Delete letter** → Entries remain (intentional)
10. **Repeat with another letter** → Deduplication works

---

**Status:** Ready for build approval
**Next Action:** Confirm this contract, then proceed to implementation

---

**"Nothing is auto-written into a patient's life without review."**
