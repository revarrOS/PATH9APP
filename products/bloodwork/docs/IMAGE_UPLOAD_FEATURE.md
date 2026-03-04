# Blood Test Image Upload Feature (Assistive Entry)

## Overview
This feature allows users to upload JPEG or PNG images of blood test reports to assist with manual data entry. The feature is **assistive only** — AI never writes directly to the database, and manual review is mandatory.

## Architecture

### Edge Function: `analyze-bloodwork-image`
**Location**: `/supabase/functions/analyze-bloodwork-image/index.ts`

**Endpoint**: `POST /functions/v1/analyze-bloodwork-image`

**Input**:
```json
{
  "image_base64": "base64-encoded-image-string"
}
```

**Output**:
```json
{
  "suggested_values": { "WBC": "4.6", "PLT": "132" },
  "units": { "WBC": "10^9/L", "PLT": "10^9/L" },
  "confidence": { "WBC": 0.91, "PLT": 0.88 },
  "reference_ranges": {
    "WBC": { "low": "4.0", "high": "11.0" }
  },
  "unmapped_markers": ["BASO", "EOS"],
  "warnings": ["Unit mismatch detected for HCT"]
}
```

**Processing Flow**:
1. Receives base64 image in request body (JPEG or PNG)
2. Sends to Anthropic Claude Vision API
3. Parses structured JSON response
4. Filters only known CBC markers
5. Returns suggested values (does NOT write to database)
6. Image discarded when function execution completes

**Security**:
- JWT authentication required (`verify_jwt: true`)
- No image persistence (memory only)
- No base64 payloads logged
- CORS headers configured

### Frontend Integration
**Location**: `/app/(tabs)/medical/bloodwork/new.tsx`

**New Features Added**:

1. **Image Upload Section**
   - Camera capture (mobile only)
   - Photo library selection (all platforms)
   - PHI safety disclosure
   - Platform-aware UI (web shows library only)

2. **AI-Extracted Field Highlighting**
   - Yellow background on AI-filled fields
   - "AI" badge next to marker name
   - Review banner when AI fields present
   - Highlight removed when user manually edits

3. **Analysis Warnings**
   - Unknown markers surfaced
   - Unit mismatches flagged
   - Partial extraction supported

4. **State Management**
   - `aiExtractedFields`: Set<string> tracking AI-filled markers
   - `analyzing`: boolean for loading state
   - `analysisWarnings`: string[] for extraction issues
   - AI flag cleared on manual edit

## Non-Negotiable Guardrails

### ✅ Assistive Only
- ✅ Image → AI → pre-fill form
- ✅ AI never writes to database
- ✅ User must review and explicitly save
- ✅ Manual override always possible

### ✅ No Persistence
- ✅ Images processed in memory only
- ✅ No storage (disk, bucket, logs)
- ✅ No base64 payloads logged
- ✅ Discarded after edge function execution

### ✅ Partial & Imperfect Extraction
- ✅ Missing markers allowed
- ✅ Unknown markers surfaced but ignored
- ✅ Unit mismatches flagged for review
- ✅ Never guess values

### ✅ UX Requirements
- ✅ Yellow highlighting on AI-filled fields
- ✅ Clear copy: "Please review before saving"
- ✅ Manual override always possible
- ✅ AI badge on extracted fields

### ✅ PHI Safety
- ✅ No names, DOBs, IDs stored
- ✅ Notes field warns against identifiers (existing PHIWarning component)
- ✅ Clear UI copy: "Images are analyzed securely and not stored"

## Testing Requirements

### Manual Test Flow (Required Before Handoff)

**Phase 1: Manual Entry Baseline**
1. Navigate to Medical → Bloodwork → Add Blood Test
2. Enter test date, location, notes
3. Manually enter 3-5 markers (e.g., WBC: 4.6, PLT: 132, HGB: 14.2)
4. Save
5. Return to bloodwork list
6. Verify test appears
7. Tap to view details
8. Verify all markers render correctly

**Phase 2: Image Upload Flow**
1. Navigate to Medical → Bloodwork → Add Blood Test
2. Scroll to "Image Assist" section
3. Tap "Upload Blood Test Image"
4. Select image (real blood test or synthetic test image)
5. Wait for analysis (spinner shows)
6. Verify form pre-fills with yellow-highlighted fields
7. Verify "AI" badges appear next to extracted markers
8. Verify review banner shows at top
9. Edit one AI-extracted value manually
10. Verify yellow highlight removes on edit
11. Verify "AI" badge remains but highlight clears
12. Add additional manual markers
13. Save
14. Return to bloodwork list
15. Verify test appears
16. Tap to view details
17. Verify all markers (AI + manual) render correctly

**Phase 3: Error Handling**
1. Test with invalid image format
2. Test with unreadable/blurry image
3. Test with network error
4. Verify error messages display inline
5. Verify form remains editable after errors

### Synthetic Test Data

For testing without real PHI, use these mock extraction results:

```typescript
// Mock successful extraction
{
  "suggested_values": {
    "WBC": "4.6",
    "RBC": "4.8",
    "HGB": "14.2",
    "HCT": "42.1",
    "PLT": "232"
  },
  "units": {
    "WBC": "10^9/L",
    "RBC": "10^12/L",
    "HGB": "g/dL",
    "HCT": "%",
    "PLT": "10^9/L"
  },
  "confidence": {
    "WBC": 0.95,
    "RBC": 0.93,
    "HGB": 0.91,
    "HCT": 0.88,
    "PLT": 0.94
  },
  "reference_ranges": {
    "WBC": { "low": "4.0", "high": "11.0" },
    "PLT": { "low": "150", "high": "400" }
  },
  "unmapped_markers": ["BASO", "EOS"],
  "warnings": []
}
```

## Dependencies Added
- `expo-image-picker`: For camera and photo library access

## Environment Variables Required
- `ANTHROPIC_API_KEY`: Already configured in Supabase secrets
- `EXPO_PUBLIC_SUPABASE_URL`: Already configured
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Already configured

## Out of Scope (Explicitly NOT Built)

The following were explicitly excluded per requirements:

❌ Trends
❌ Graphs
❌ Benchmarks
❌ Interpretation
❌ AI explanations
❌ Emotional language
❌ Auto-save on extraction
❌ Image storage/persistence
❌ AI direct database writes

This is **typing assistance only**.

## Validation Checklist

- [x] Build compiles without errors
- [x] Edge function deployed successfully
- [x] Image upload UI integrated into form
- [x] Yellow highlighting on AI-extracted fields
- [x] AI badge displays correctly
- [x] Review banner shows when AI fields present
- [x] Manual edit removes AI highlighting
- [x] PHI safety disclosures present
- [x] Camera/library picker works (platform-aware)
- [x] Analysis loading state displays
- [x] Warnings display for unmapped markers
- [x] Manual save flow unchanged
- [x] No auto-save on extraction
- [x] Images not persisted
- [ ] **End-to-end manual testing** (requires user validation)

## Known Limitations

1. **Web Platform**: Camera capture not available on web (library only)
2. **Vision API Accuracy**: Extraction quality depends on image clarity and format
3. **Known Markers Only**: Only extracts CBC markers defined in `CBC_MARKERS` array
4. **No OCR Fallback**: Relies solely on Claude Vision API

## Future Enhancements (Not in Current Scope)

- Support for additional panel types (metabolic, lipid, etc.)
- Batch upload for multiple test pages
- Image preview before analysis
- Confidence threshold tuning
- Multi-language support for international lab formats
