# Condition Management — Technical Architecture

**Status:** Production (2026-02-02)
**Mirror:** Bloodwork Management Architecture

---

## Overview

Condition Management is a **narrative-based medical tracking system** that helps users understand their clinical journey through consultant letters, clinic summaries, and diagnostic reports.

**Core difference from Bloodwork:**
- Bloodwork = structured numeric data
- Condition = unstructured narrative documents

**Structural similarity:**
- 90% mirror of Bloodwork architecture
- Same data ownership model
- Same consultation prep flow
- Same care team management
- Same support access system

---

## System Architecture

```
User Layer (Mobile/Web)
  ↓
Service Layer (Frontend)
  - ConditionService (CRUD operations)
  - OrchestrationService (AI interactions)
  ↓
Edge Functions (Supabase)
  - condition-ai-respond (Gemma narrative analysis)
  - condition-entries (document CRUD)
  - condition-consultation-prep (question management)
  - condition-care-team (contact management)
  - condition-support-access (permission management)
  ↓
Database (Supabase PostgreSQL)
  - condition_entries
  - condition_consultation_questions
  - condition_care_team
  - condition_support_access
```

---

## Data Model

### condition_entries

Primary storage for clinical documents.

```sql
CREATE TABLE condition_entries (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  document_date date NOT NULL,
  document_type text NOT NULL, -- consultant_letter, clinic_summary, etc.
  clinician_name text NOT NULL,
  institution text NOT NULL,
  document_body text NOT NULL, -- Full document text
  summary text, -- Optional user/AI summary
  attachments jsonb DEFAULT '[]', -- File metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Key fields:**
- `document_body` — Full text of clinical document (unstructured)
- `document_type` — Categorization for filtering/display
- `clinician_name` + `institution` — Attribution
- `summary` — Optional condensed version

**RLS:** User owns all entries. Full CRUD control.

---

### condition_consultation_questions

Captures questions for upcoming appointments.

```sql
CREATE TABLE condition_consultation_questions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  entry_id uuid REFERENCES condition_entries(id) ON DELETE SET NULL,
  question_text text NOT NULL,
  priority text NOT NULL, -- clinical, logistical, general
  source text NOT NULL, -- ai_suggested, user_added
  is_answered boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Identical to Bloodwork structure.**

**Key features:**
- Links to specific entry (optional)
- AI can suggest questions based on document changes
- User can manually add questions
- Priority system for organization
- Answered/unanswered tracking

---

### condition_care_team

Manages clinical contact information.

```sql
CREATE TABLE condition_care_team (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  role text NOT NULL,
  institution text NOT NULL,
  phone text,
  email text,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

**Identical to Bloodwork structure.**

---

### condition_support_access

Enables sharing with family/caregivers.

```sql
CREATE TABLE condition_support_access (
  id uuid PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id),
  support_email text NOT NULL,
  support_name text,
  access_level text NOT NULL, -- view_timeline, view_full
  status text NOT NULL, -- pending, active, revoked
  invite_token uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);
```

**Identical to Bloodwork structure.**

---

## Edge Functions

### condition-ai-respond

**Purpose:** Gemma narrative analysis for clinical documents

**Mirror:** bloodwork-ai-respond

**Key differences:**
- Fetches document text instead of numeric markers
- Compares language between documents (not value deltas)
- Detects terminology questions
- Identifies language shifts

**Safety:**
- Same boundaries as Bloodwork (no diagnosis/treatment)
- Adapted prompts for narrative analysis
- Language comparison instead of trend analysis

**Flow:**
1. User sends message
2. Fetch recent condition documents (last 12 months, limit 10)
3. Build context with document excerpts
4. Send to Claude with narrative analysis system prompt
5. Detect consultation prep opportunities
6. Return response + optional question suggestion

---

### condition-entries

**Purpose:** CRUD operations for condition documents

**Endpoints:**
- GET (all entries or single entry)
- POST (create new entry)
- PUT (update entry)
- DELETE (delete entry)

**Security:**
- JWT required
- User can only access own entries
- RLS enforced at database level

---

### condition-consultation-prep

**Purpose:** Question management for appointments

**Identical to bloodwork-consultation-prep.**

---

### condition-care-team

**Purpose:** Clinical contact management

**Identical to bloodwork-key-contacts** (renamed for clarity).

---

### condition-support-access

**Purpose:** Trusted support sharing

**Identical to bloodwork-support-access.**

---

## Frontend Architecture

### Service Layer

**ConditionService** (`/products/condition/services/condition.service.ts`)

Mirrors BloodworkService structure:

- `createEntry()` — Add new document
- `getEntries()` — Fetch all documents
- `getEntry(id)` — Fetch single document
- `updateEntry(id, data)` — Update document
- `deleteEntry(id)` — Delete document
- `createQuestion()` — Add consultation question
- `getQuestions()` — Fetch questions
- `addCareTeamMember()` — Add contact
- `getCareTeam()` — Fetch contacts
- `createSupportAccess()` — Grant access
- `getSupportAccess()` — Fetch grants

All methods handle auth via Supabase client.

---

### UI Components

**Location:** `/products/condition/components/`

Components mirror Bloodwork structure:

- **ConditionEntryCard** — Display single document summary
- **ConditionTimeline** — Visual timeline of documents
- **ConditionChat** — AI analysis interface
- **ConsultationPrepCard** — Question display/management
- **CareTeamCard** — Contact card
- **SupportAccessCard** — Permission grant card

**Design principle:** 95% visual parity with Bloodwork, adapted for text vs. numbers.

---

### Routes

**Location:** `/app/(tabs)/medical/condition/`

Route structure mirrors Bloodwork:

```
/medical/condition/
  index.tsx                 # Condition hub
  /entry
    index.tsx               # Entry list
    new.tsx                 # Create entry
    [id].tsx                # View entry
    /edit/[id].tsx          # Edit entry
  /timeline
    index.tsx               # Timeline view
  /analysis
    index.tsx               # AI chat
  /consultation-prep
    index.tsx               # Question builder
  /care-team
    index.tsx               # Contact management
  /support-access
    index.tsx               # Permission management
```

---

## Key Design Decisions

### 1. Why Mirror Bloodwork?

**Rationale:**
- Proven UX patterns
- Reduced cognitive load for users
- Consistent mental model across medical data types
- Faster development
- Shared maintenance patterns

**Trade-off:**
- Some Bloodwork UI patterns (charts) don't translate
- Accepted: Timeline view replaces charts

---

### 2. Why Unstructured `document_body`?

**Rationale:**
- Clinical letters vary widely in format
- Attempting to parse/structure would be fragile
- AI can analyze unstructured text effectively
- User sees original language (clinical fidelity)

**Trade-off:**
- Can't query specific fields within documents
- Accepted: Full-text search sufficient

---

### 3. Why Separate from Bloodwork?

**Rationale:**
- Different data types (numeric vs. narrative)
- Different analysis methods (trends vs. language)
- Clean separation of concerns
- Easier to maintain

**Alternative considered:**
- Unified "medical records" table
- Rejected: Would blur boundaries, complicate queries

---

### 4. Why Same Consultation Prep?

**Rationale:**
- Same user need (prepare questions)
- Same AI capability (detect confusion → suggest questions)
- Same workflow (capture → organize → review)

**Identical implementation.**

---

## Security Model

### Row Level Security (RLS)

**All tables enforce:**
1. User can only see own data
2. User can only modify own data
3. Support access grants read-only permissions (future)

**Policies:**

```sql
-- Example: condition_entries
CREATE POLICY "Users can view own entries"
  ON condition_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
  ON condition_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

---

### JWT Verification

All edge functions verify JWT:

```typescript
const {
  data: { user },
  error: userError,
} = await supabaseClient.auth.getUser();

if (userError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
  });
}
```

**No changes to JWT configuration.**

---

## Gemma Integration

### Domain-Specific Prompt

Located: `/supabase/functions/condition-ai-respond/index.ts`

**Key adaptations:**

1. **Context building**
   - Fetches document text (not numeric values)
   - Includes document type, clinician, institution
   - Truncates long documents for context window

2. **Analysis prompts**
   - "Compare language between documents"
   - "Explain terminology encyclopedically"
   - "Identify language shifts"
   - "Detect new vs. unchanged observations"

3. **Safety boundaries**
   - Same as Bloodwork: no diagnosis, treatment, prediction
   - Adapted: factual language comparison allowed

---

## Scalability Considerations

### Document Storage

**Current:**
- Full text stored in PostgreSQL
- Works for typical letter sizes (1-10KB)

**Future (if needed):**
- Large PDFs → Store in Supabase Storage
- Reference URL in `attachments` field
- Extract text for AI analysis

---

### AI Context Windows

**Current:**
- Last 10 documents
- Truncate to 1000 characters per document
- Sufficient for language comparison

**Future (if needed):**
- Semantic chunking for long documents
- Vector embeddings for semantic search

---

## Testing Strategy

### Unit Tests

**Not implemented (matches Bloodwork).**

Future: Test TypeScript service methods.

---

### Integration Tests

**Not implemented (matches Bloodwork).**

Future: Test edge function CRUD operations.

---

### Manual Validation

**Required before production:**

1. Create entry (consultant letter)
2. View timeline
3. Ask Gemma about document
4. Verify language comparison
5. Save question to consultation prep
6. Add care team contact
7. Grant support access
8. Delete entry

---

## Related Documentation

- `/products/condition/README.md` — Product overview
- `/products/condition/CURRENT_STATUS.md` — Build status
- `/gemma/domains/condition/CONDITION_ANALYSIS_GEMMA.md` — Gemma rules
- `/products/bloodwork/ARCHITECTURE.md` — Reference implementation

---

**Built:** 2026-02-02
**Mirror:** Bloodwork Management (90% parity)
**Status:** Production-ready
