# Condition Letters Database Schema

## Tables Used

### 1. condition_documents (NEW)

Primary table for storing PDF document metadata and extraction results.

```sql
CREATE TABLE condition_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  doc_type text NOT NULL DEFAULT 'letter'
    CHECK (doc_type IN ('letter', 'report', 'discharge', 'other')),
  source text,
  doc_date date,
  storage_path text NOT NULL,
  masked_text text,
  full_text text,
  extraction_json jsonb,
  extraction_status text NOT NULL DEFAULT 'uploaded'
    CHECK (extraction_status IN ('uploaded', 'processing', 'extracted', 'partial', 'failed')),
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Primary key | Generated automatically |
| `user_id` | uuid | Owner of document | FK to auth.users, CASCADE delete |
| `title` | text | User-editable title | Default empty string |
| `doc_type` | text | Document category | letter/report/discharge/other |
| `source` | text | Hospital/clinic name | Optional |
| `doc_date` | date | Document date (if extracted) | Optional |
| `storage_path` | text | Path in Supabase Storage | Required |
| `masked_text` | text | Renderable text with PII masked | Optional |
| `full_text` | text | Complete extracted text | Optional |
| `extraction_json` | jsonb | Raw structured extraction output | Optional |
| `extraction_status` | text | Processing state | uploaded/processing/extracted/partial/failed |
| `confidence_score` | numeric | Extraction confidence (0-1) | Optional, range validated |
| `created_at` | timestamptz | Record creation time | Auto-generated |
| `updated_at` | timestamptz | Last update time | Auto-generated |

**Indexes:**
- `idx_condition_documents_user_id` on `user_id`
- `idx_condition_documents_status` on `(user_id, extraction_status)`
- `idx_condition_documents_date` on `(user_id, doc_date DESC)`

**RLS Policies:**
- Users can SELECT/INSERT/UPDATE/DELETE only their own documents
- All policies check `auth.uid() = user_id`

---

### 2. condition_trend_signals (NEW)

Stores progression signals derived from letter extraction.

```sql
CREATE TABLE condition_trend_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES condition_documents(id) ON DELETE CASCADE,
  signal_date date NOT NULL,
  signal_type text NOT NULL DEFAULT 'other'
    CHECK (signal_type IN ('stability', 'improvement', 'progression', 'monitoring_change', 'other')),
  polarity text NOT NULL DEFAULT 'neutral'
    CHECK (polarity IN ('positive', 'negative', 'neutral')),
  category text NOT NULL DEFAULT 'other'
    CHECK (category IN ('clinical_marker', 'symptom', 'treatment_response', 'other')),
  description text NOT NULL,
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1),
  created_at timestamptz DEFAULT now() NOT NULL
);
```

**Fields:**

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | uuid | Primary key | Generated automatically |
| `user_id` | uuid | Owner of signal | FK to auth.users, CASCADE delete |
| `document_id` | uuid | Source document | FK to condition_documents, CASCADE delete |
| `signal_date` | date | When signal occurred | Required |
| `signal_type` | text | Signal classification | stability/improvement/progression/monitoring_change/other |
| `polarity` | text | Signal direction | positive/negative/neutral |
| `category` | text | Signal category | clinical_marker/symptom/treatment_response/other |
| `description` | text | Brief signal description | Required |
| `confidence` | numeric | Detection confidence (0-1) | Optional, range validated |
| `created_at` | timestamptz | Record creation time | Auto-generated |

**Indexes:**
- `idx_condition_trend_signals_user_id` on `user_id`
- `idx_condition_trend_signals_document_id` on `document_id`
- `idx_condition_trend_signals_date` on `(user_id, signal_date DESC)`
- `idx_condition_trend_signals_polarity` on `(user_id, polarity)`

**RLS Policies:**
- Users can SELECT/INSERT/UPDATE/DELETE only their own signals
- All policies check `auth.uid() = user_id`

---

### 3. condition_entries (REUSED)

Timeline events extracted from letters are stored here.

**Relevant Fields:**
- `user_id`: Owner
- `document_date`: Event date
- `document_type`: Can include letter-derived entries
- `document_body`: Description of event
- `attachments`: Can include `source_document_id` to link back to letter

**Prepopulation Strategy:**
- Extract timeline events from `extraction_json.timeline_events`
- Create new entry for each significant event
- Link via `attachments` JSON array: `[{ source_document_id: documentId }]`

---

### 4. condition_care_team (REUSED)

Care team contacts extracted from letters.

**Relevant Fields:**
- `user_id`: Owner
- `name`: Contact name
- `role`: Clinical role
- `institution`: Hospital/clinic
- `phone`: Phone number (if extracted)
- `email`: Email (if extracted)
- `notes`: Can include extraction source info

**Prepopulation Strategy:**
- Extract contacts from `extraction_json.contacts`
- Create new contact for each extracted contact
- Add note: `[AUTO] From letter {documentId}` for traceability

---

### 5. consultation_questions (REUSED)

AI-suggested consultation questions from letter analysis.

**Relevant Fields:**
- `user_id`: Owner
- `question_text`: The suggested question
- `domain`: Set to `'condition'`
- `related_entry_id`: Can reference document ID
- `priority`: Clinical/logistical/general
- `source`: Set to `'ai_suggested'`

**Prepopulation Strategy:**
- Extract questions from `extraction_json.consultation_questions`
- Create questions with `domain='condition'`, `source='ai_suggested'`
- Link via `related_entry_id` to document ID

---

## Relationships

```
auth.users (1) ─────────┬─────────── (*) condition_documents
                        │
                        ├─────────── (*) condition_trend_signals
                        │
                        ├─────────── (*) condition_entries
                        │
                        ├─────────── (*) condition_care_team
                        │
                        └─────────── (*) consultation_questions

condition_documents (1) ───────────── (*) condition_trend_signals
                        (document_id FK)
```

**Cascade Deletes:**
- Delete user → deletes all documents, signals, entries, contacts, questions
- Delete document → deletes all trend signals linked to it
- Entries/contacts/questions remain even if source document deleted (intentional)

---

## Storage

### Bucket: `condition-letters`

**Configuration:**
- Visibility: Private
- Path format: `{userId}/{documentId}.pdf`
- Allowed MIME types: `application/pdf`
- Max file size: 10MB (recommended)

**RLS:**
- Users can only upload/download/delete files in their own `userId` folder
- Enforced at storage bucket policy level

---

## Example Queries

### Get all documents for user with status
```sql
SELECT id, title, doc_date, extraction_status, confidence_score
FROM condition_documents
WHERE user_id = auth.uid()
ORDER BY doc_date DESC NULLS LAST;
```

### Get trend signals for a document
```sql
SELECT signal_date, signal_type, polarity, description
FROM condition_trend_signals
WHERE document_id = $1
  AND user_id = auth.uid()
ORDER BY signal_date DESC;
```

### Get recent extracted letters (for Gemma context)
```sql
SELECT id, title, doc_date, extraction_json
FROM condition_documents
WHERE user_id = auth.uid()
  AND extraction_status IN ('extracted', 'partial')
ORDER BY doc_date DESC NULLS LAST
LIMIT 3;
```

### Get prepopulated contacts from a letter
```sql
SELECT id, name, role, institution
FROM condition_care_team
WHERE user_id = auth.uid()
  AND notes LIKE '%From letter ' || $1 || '%';
```

### Count documents by status
```sql
SELECT extraction_status, COUNT(*)
FROM condition_documents
WHERE user_id = auth.uid()
GROUP BY extraction_status;
```

---

## Migration File

Location: `supabase/migrations/20260203120000_create_condition_documents_system.sql`

Includes:
- Table creation with IF NOT EXISTS guards
- All indexes
- RLS policies for both tables
- Cascade delete constraints
- Check constraints on enums

---

## Data Integrity

### Constraints
- All enums validated via CHECK constraints
- Foreign keys with CASCADE delete for cleanup
- Confidence scores bounded 0-1
- User isolation via RLS on all operations

### Fail-Soft Approach
- Extraction failures don't block document creation
- Partial extractions saved with warnings
- Missing fields stored as NULL (not error)
- Users can always view original PDF even if extraction fails
