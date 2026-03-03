# Condition Letters & Reports

## What It Is

A PDF letter ingestion system that allows users to upload medical letters/reports, extract structured data using Claude Vision, and automatically prepopulate Condition Management features including timeline entries, care team contacts, consultation questions, and trend signals.

## Where Files Live

### UI Screens
- `app/(tabs)/medical/condition/letters/index.tsx` - Letters list
- `app/(tabs)/medical/condition/letters/upload.tsx` - Upload flow
- `app/(tabs)/medical/condition/letters/[id].tsx` - Letter detail with masking

### Edge Functions
- `supabase/functions/analyze-condition-letter/index.ts` - Vision extraction pipeline

### Database
- `condition_documents` - Document metadata + extraction results
- `condition_trend_signals` - Progression signals extracted from letters
- Reuses: `condition_entries`, `condition_care_team`, `consultation_questions`

### Storage
- Bucket: `condition-letters`
- Path format: `{userId}/{documentId}.pdf`

### Documentation
- `products/condition/docs/VISION_OUTPUT_SCHEMA.md` - Extraction JSON schema
- `products/condition/docs/SCHEMA_CONDITION_LETTERS.md` - Database schema

## Data Flow

```
1. User uploads PDF
   ↓
2. PDF stored in Supabase Storage
   ↓
3. Document record created (status: uploaded)
   ↓
4. Frontend triggers analyze-condition-letter edge function
   ↓
5. Edge function:
   - Verifies ownership
   - Downloads PDF from storage
   - Sends to Claude Vision API
   - Parses structured JSON response
   ↓
6. Extraction results saved to condition_documents
   ↓
7. Status updated: extracted | partial | failed
   ↓
8. User views letter with masking toggle
   ↓
9. Prepopulated items shown in review panel
   ↓
10. Items can be deleted individually (delete parity)
```

## RLS Notes

### condition_documents
- Users can only SELECT/INSERT/UPDATE/DELETE their own documents
- Edge function verifies ownership via `user_id` before processing

### condition_trend_signals
- Users can only SELECT/INSERT/UPDATE/DELETE their own signals
- Cascade delete when parent document is deleted

### Storage
- Bucket: `condition-letters` (private)
- RLS enforced at storage level
- Path structure ensures user isolation

## Fail-Soft Behavior

### Extraction Failures
- **Complete failure**: Document saved with status `failed`, zero confidence
- **Partial extraction**: Document saved with status `partial`, warnings added
- **Parse errors**: Best-effort text extraction, warnings logged

### User Experience
- Processing state shows calm message: "Reading your letter… this can take a moment."
- Failed extractions don't block user from viewing PDF
- Partial extractions show what was found + warnings
- No hard errors propagated to UI

### Edge Function
- Catches all errors gracefully
- Returns 500 with error message (not crash)
- Updates document status to `failed` on exception

## Gemma Integration

### Letter Context Toggle
- Location: Condition AI Analysis screen
- Toggle: "Use my latest letters as context"
- Default: OFF (opt-in)

### Behavior
- **When ON**: Fetches up to 3 most recent extracted letters
- Builds context string with:
  - Letter date
  - Title
  - Diagnoses (max 2)
  - Clinical assessment (first 150 chars)
- Appends to Gemma's domain context prompt

### Gemma Capabilities
- ✅ Explain medical terms from letters
- ✅ Help prepare consultation questions
- ✅ Compare wording changes over time
- ✅ Reference letter content with time-awareness ("In your letter dated X…")
- ❌ Cannot diagnose
- ❌ Cannot interpret clinical meaning
- ❌ Cannot recommend treatment

## Masking

### PII Types Detected
- Names (patient, clinician)
- Date of birth
- Addresses
- Phone numbers
- Email addresses
- NHS numbers
- Medical record numbers (MRN)

### Storage
- `full_text`: Complete extracted text
- `masked_text`: Text with PII replaced by `[NAME]`, `[DOB]`, etc.
- `pii_spans`: Array of detected PII with character positions

### UI Behavior
- Toggle: "Mask personal details"
- Default: ON (safer, calmer)
- When ON: displays `masked_text`
- When OFF: displays `full_text`
- "View original PDF" button always available

## What's Next

### Deferred to Future Iterations
- Stripe payment packs for additional analysis capacity
- Image file upload (JPEG/PNG from photos)
- OCR for scanned documents
- Differential analysis (compare two letters)
- Trend visualization dashboard
- Smart deduplication for prepopulated items
- External health record sync

### Current Limitations
- PDF upload on web shows placeholder (mobile-first MVP)
- No progress indicator during vision analysis
- Large PDFs (>10MB) may timeout
- No automatic deduplication of contacts/entries
- Vision accuracy depends on PDF quality

## Testing Notes

- Edge function deployed and accessible
- RLS enforced on all tables
- Build succeeds without errors
- Masking toggle works correctly
- Prepopulated items deletable with parity
- Gemma context toggle functional
