# Bloodwork Phase 2 — Image-Assisted Entry

**Date:** 2026-01-31
**Status:** Documented (Not Yet Built)
**Prerequisites:** Phase 1 complete and validated with real users

---

## Overview

Phase 2 adds **image-assisted manual entry** to help users type blood test values faster. This is **not** automated import — it's AI helping pre-fill the existing manual form.

### Mental Model (User-Facing)

> "AI helps you type faster, not import your data."

### Mental Model (Internal)

> "OCR pre-fill with mandatory review."

---

## Non-Negotiable Guardrails

These rules are absolute and cannot be compromised:

### 1. Assistive Entry Only ✅

- AI **may** pre-fill the existing manual form
- AI **must never** write directly to the database
- User **must** review every extracted value
- Saving without explicit user confirmation is **forbidden**
- Form displays pre-filled values in "pending review" state

### 2. Mandatory User Review ✅

- All extracted values displayed with visual indicator (e.g., yellow highlight)
- User must tap "Confirm" or "Save" explicitly
- User can edit any pre-filled value before saving
- User can delete any pre-filled value
- Clear "Review AI-extracted values" header above form

### 3. PHI / Privacy Maximization ✅

- Images processed **in memory only**
- **No image persistence** to disk, S3, buckets, or logs
- Base64 payloads **never logged** (not in Supabase logs, edge function logs, or client logs)
- Clear UI copy: _"Images are analyzed securely and not stored"_
- Notes field retains PHI warning: _"Do not include personal identifiers"_

### 4. Conservative Accuracy Expectations ✅

Expected extraction accuracy:
- **Clean printed reports**: 85-90%
- **Phone photos (good lighting)**: 70-85%
- **Poor lighting / skew**: <70%

These are **acceptable ranges** only because user review is mandatory.

### 5. Failure Tolerance ✅

System must gracefully handle:
- Missing markers
- Extra/unrecognized markers
- Unit mismatches (g/dL vs g/L)
- Lab-specific naming variations
- OCR confidence below threshold
- Image upload failures
- LLM timeout or errors

Failure behavior: Display clear error message, fall back to manual entry.

---

## What This Feature Does

1. User taps "Upload Lab Report" button on new test screen
2. User selects image from camera or gallery
3. Image sent to vision LLM for extraction (in memory)
4. Extracted values pre-fill the existing manual form
5. Pre-filled fields highlighted in yellow with "AI-extracted" badge
6. User reviews, edits, and confirms each value
7. User taps Save → standard Phase 1 save flow executes
8. Image is discarded (never stored)

---

## What This Feature Does NOT Do

- ❌ Automatically save extracted values to database
- ❌ Store uploaded images (even temporarily in S3)
- ❌ Log base64-encoded image data
- ❌ Trust AI extraction without user review
- ❌ Proceed without user confirmation
- ❌ Handle multiple images in batch
- ❌ Perform OCR client-side (all processing server-side)

---

## Technical Architecture

### Data Flow

```
User → Image Picker → Base64 Encoding (client)
  → POST /extract-blood-test-image (edge function)
  → Vision LLM (Claude or GPT-4V)
  → Structured JSON response
  → Client pre-fills form with yellow highlights
  → User reviews + edits
  → User taps Save
  → Standard Phase 1 save flow
  → Image data destroyed at all stages
```

### Edge Function: `extract-blood-test-image`

**Location:** `/supabase/functions/extract-blood-test-image/index.ts`

**Input:**
```typescript
POST /extract-blood-test-image
{
  image_base64: string,
  panel_type?: "cbc" | "metabolic" // Optional hint
}
```

**Processing:**
1. Validate base64 format
2. Send to vision LLM with structured prompt
3. Parse LLM response into structured JSON
4. Apply marker normalization
5. Return structured extraction result
6. **No logging of image_base64 anywhere**

**Output:**
```typescript
{
  success: boolean,
  extracted_markers: Array<{
    marker_name: string,        // e.g., "WBC", "HGB"
    value: number | null,
    unit: string,
    confidence: number,         // 0.0 - 1.0
    reference_low: number | null,
    reference_high: number | null
  }>,
  unrecognized_markers: Array<{
    raw_text: string,
    reason: string              // e.g., "Unknown marker name"
  }>,
  warnings: string[],           // e.g., "Poor image quality"
  test_date?: string,           // If detected
  lab_location?: string         // If detected
}
```

### Marker Normalization Layer

**Required Component:** Alias mapping table

**Purpose:** Handle lab-specific naming variations

**Examples:**
- `WBC` ↔ `White Blood Cell Count` ↔ `Leucocytes`
- `HGB` ↔ `Hemoglobin` ↔ `Hb`
- `PLT` ↔ `Platelets` ↔ `Platelet Count`

**Implementation:**
- Static mapping table (JSON config file initially)
- Fuzzy matching for slight variations
- Returns canonical marker name (e.g., `WBC`)

### Unit Conversion Layer

**Required Component:** Unit normalization

**Purpose:** Convert between unit systems

**Examples:**
- `g/L` → `g/dL` (divide by 10)
- `10^9/L` ↔ `K/µL` (same value)
- HCT: fraction ↔ percentage (multiply by 100)

**Behavior:**
- Detect unit from extracted text
- Convert to canonical unit for storage
- Display canonical unit in form

---

## UI Changes Required

### New UI Elements

1. **Upload Button (new.tsx)**
   - Location: Below test date field, above marker inputs
   - Label: "Upload Lab Report (Optional)"
   - Icon: Camera icon
   - Style: Secondary button (not primary)
   - Disclosure text below button:
     > _"Images are analyzed securely and not stored. You must review all extracted values before saving."_

2. **AI-Extracted Badge**
   - Displayed on pre-filled marker input fields
   - Yellow background with "AI-extracted" text
   - Small, non-intrusive design

3. **Review Header**
   - Shown when values are pre-filled
   - Text: "Review AI-Extracted Values"
   - Subtitle: "Please verify each value before saving"
   - Yellow background banner at top of form

4. **Confidence Indicators** (Optional Phase 2.1)
   - Low confidence (<0.7): Orange border + warning icon
   - Medium confidence (0.7-0.9): Yellow background
   - High confidence (>0.9): Green checkmark (user still must review)

### Existing UI Modifications

1. **Marker Input Fields**
   - Add `isAIExtracted` state prop
   - When true: apply yellow background style
   - When user edits: remove yellow background (user has reviewed)
   - Retain all Phase 1 validation logic

2. **Save Button**
   - No changes to save logic
   - If AI-extracted values present: show confirmation modal first
   - Modal text: "You've reviewed the AI-extracted values. Save this test?"

---

## Privacy & Trust Implementation

### Image Handling Rules

1. **Client-Side (Mobile App)**
   - User picks image from gallery/camera
   - Convert to base64 **in memory**
   - Send via HTTPS POST
   - Clear base64 variable immediately after response
   - **No disk caching**

2. **Edge Function**
   - Receive base64 in request body
   - Send to vision LLM API
   - Parse response
   - **Do not log request body**
   - **Do not store image anywhere**
   - Return extraction result
   - Base64 string destroyed when function exits

3. **Vision LLM Provider**
   - Use Anthropic Claude (preferred) or OpenAI GPT-4V
   - Ensure provider API does not retain images
   - Anthropic: Images not used for training (per policy)
   - OpenAI: Opt out of data retention via API settings

### Logging Policy

**What We Log:**
- Extraction success/failure (boolean)
- Number of markers extracted (count)
- Processing time (milliseconds)
- Error messages (without image data)

**What We NEVER Log:**
- Base64 image payloads
- Extracted raw OCR text (may contain PHI)
- User identifiers in extraction logs

**Log Example (Acceptable):**
```json
{
  "event": "blood_test_extraction",
  "success": true,
  "markers_extracted": 12,
  "processing_time_ms": 3421,
  "panel_type": "cbc"
}
```

**Log Example (FORBIDDEN):**
```json
{
  "event": "blood_test_extraction",
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA...",  // ❌ NEVER
  "raw_ocr_text": "Patient: John Doe, DOB: ...",  // ❌ NEVER
  "user_id": "uuid-here"  // ❌ Avoid in extraction logs
}
```

---

## Marker Mapping Reality

### Naming Variations by Lab

Different labs use different terminology. Examples:

| Canonical | Quest Diagnostics | LabCorp | UK NHS |
|-----------|-------------------|---------|--------|
| WBC | White Blood Cell Count | WBC | Leucocytes |
| HGB | Hemoglobin | Hgb | Haemoglobin |
| PLT | Platelet Count | Platelets | Platelet Count |
| NEUT | Neutrophils | Neutrophils (Absolute) | Neutrophils |

### Normalization Strategy

1. **Exact Match** → Use canonical name
2. **Alias Match** → Map to canonical name
3. **Fuzzy Match** (Levenshtein distance < 3) → Map with low confidence
4. **No Match** → Add to `unrecognized_markers` array

### Handling Unrecognized Markers

When a marker cannot be mapped:
- Display in separate section: "Unrecognized Markers"
- Show raw extracted text
- Provide "Add manually" button
- User can create custom marker entry (future feature)

---

## Unit Mismatch Handling

### Common Unit Variations

| Marker | US Labs | UK Labs | International |
|--------|---------|---------|---------------|
| HGB | g/dL | g/dL | g/L |
| WBC | K/µL | 10^9/L | 10^9/L |
| PLT | K/µL | 10^9/L | 10^9/L |
| HCT | % | Fraction (0.0-1.0) | Fraction |

### Conversion Strategy

1. **Detect unit** from extracted text
2. **Convert to canonical unit** for storage
3. **Display canonical unit** in form
4. **Store conversion metadata** for audit trail

**Example:**
- Extracted: `HGB: 135 g/L`
- Converted: `HGB: 13.5 g/dL`
- Stored in database: `value: 13.5, unit: "g/dL", original_unit: "g/L"`

---

## LLM Prompt Strategy

### Vision LLM Prompt

```
You are analyzing a blood test lab report image. Extract the following information:

1. Test date (if visible)
2. Lab/location name (if visible)
3. All blood test markers with:
   - Marker name
   - Numeric value
   - Unit
   - Reference range (low and high, if provided)

Output as JSON:
{
  "test_date": "YYYY-MM-DD or null",
  "lab_location": "string or null",
  "markers": [
    {
      "marker_name": "string",
      "value": number or null,
      "unit": "string",
      "reference_low": number or null,
      "reference_high": number or null
    }
  ]
}

Rules:
- Only extract visible numeric values
- Do not infer or calculate missing values
- If uncertain, set value to null
- Preserve original unit as written
- Extract reference ranges exactly as shown
- Ignore patient name, DOB, or personal identifiers
```

### Structured Output Format

Use LLM structured output mode (Anthropic or OpenAI) to enforce JSON schema.

---

## Error Handling

### Client-Side Errors

| Error | User Message | Behavior |
|-------|--------------|----------|
| Image too large | "Image file is too large. Please use a smaller image." | Reject upload |
| Invalid format | "Please select a valid image (JPG, PNG)" | Reject upload |
| Network timeout | "Upload timed out. Please try again." | Allow retry |

### Server-Side Errors

| Error | User Message | Behavior |
|-------|--------------|----------|
| LLM API failure | "Image analysis failed. Please enter values manually." | Fall back to manual entry |
| No markers detected | "No blood test markers detected. Please enter values manually." | Fall back to manual entry |
| Low confidence | "Image quality is poor. Extracted values may be inaccurate. Please review carefully." | Show warning, allow review |

### Graceful Degradation

If extraction fails:
1. Display clear error message
2. **Do not** leave form in broken state
3. Clear any partially extracted values
4. Allow user to continue with manual entry
5. Log error for debugging (without image data)

---

## Testing Requirements (Before Release)

### Functional Tests

1. ✅ Upload clean printed report → verify 85%+ accuracy
2. ✅ Upload phone photo → verify 70%+ accuracy
3. ✅ Upload poor quality image → verify graceful error handling
4. ✅ Extracted values pre-fill form correctly
5. ✅ User can edit pre-filled values
6. ✅ User can delete pre-filled values
7. ✅ Save flow works identically to Phase 1
8. ✅ Image is never persisted (check S3, logs, disk)

### Privacy Tests

1. ✅ Base64 payload not logged in edge function logs
2. ✅ Image not stored in Supabase storage buckets
3. ✅ No PHI in extraction logs
4. ✅ Disclosure text visible before upload

### Accuracy Tests (Sample Reports)

Test with real-world lab reports from:
- Quest Diagnostics
- LabCorp
- NHS UK hospitals
- Private labs

Measure:
- Marker name accuracy
- Numeric value accuracy
- Unit detection accuracy
- Reference range accuracy

Target: 85% accuracy on clean reports.

---

## Phase 2 Success Criteria

A real user:
1. Takes photo of printed lab report
2. Uploads image via app
3. Sees extracted values pre-fill form with yellow highlights
4. Reviews and edits 2-3 values
5. Confirms all values are correct
6. Taps Save → test is saved successfully
7. Feels confident that image was not stored
8. Completes entry 3-5× faster than full manual entry

**Result:** Phase 2 is complete when a real user can do this comfortably and accurately.

---

## Implementation Checklist

### Edge Function
- [ ] Create `/supabase/functions/extract-blood-test-image/index.ts`
- [ ] Implement vision LLM integration (Anthropic Claude preferred)
- [ ] Implement marker normalization layer
- [ ] Implement unit conversion layer
- [ ] Add structured JSON schema enforcement
- [ ] Add error handling and graceful degradation
- [ ] Ensure no image logging anywhere
- [ ] Test with sample lab reports

### Client UI
- [ ] Add "Upload Lab Report" button to `new.tsx`
- [ ] Implement image picker (camera + gallery)
- [ ] Add base64 encoding logic
- [ ] Add POST request to edge function
- [ ] Implement pre-fill logic with yellow highlights
- [ ] Add "AI-extracted" badges to fields
- [ ] Add review header banner
- [ ] Add confirmation modal before save
- [ ] Add disclosure text about image processing
- [ ] Add error handling UI

### Privacy & Compliance
- [ ] Audit: Verify no image persistence anywhere
- [ ] Audit: Verify no base64 logging anywhere
- [ ] Audit: Verify disclosure text is clear
- [ ] Document: Update privacy policy (if applicable)

### Testing
- [ ] Test with 20+ real lab reports
- [ ] Measure accuracy by marker type
- [ ] Test error scenarios (poor lighting, wrong file type, etc.)
- [ ] Verify save flow identical to Phase 1
- [ ] Performance test: ensure <5s extraction time

---

## Dependencies

### Required Services
- Vision LLM API (Anthropic Claude or OpenAI GPT-4V)
- Expo Image Picker library
- Supabase Edge Functions

### New Environment Variables
```bash
ANTHROPIC_API_KEY=sk-...        # Preferred
OPENAI_API_KEY=sk-...            # Fallback
```

**Note:** These must be configured in Supabase Edge Function secrets (not in `.env` client-side).

---

## Cost Estimation

### Per Image Extraction

**Vision LLM Cost:**
- Anthropic Claude 3.5 Sonnet: ~$0.01-0.03 per image
- OpenAI GPT-4V: ~$0.02-0.05 per image

**Expected Usage:**
- Average user: 3-5 uploads per month
- Monthly cost per user: ~$0.05-0.15

**Scalability:**
- 1,000 active users: ~$50-150/month
- 10,000 active users: ~$500-1500/month

This is acceptable for Phase 2 validation.

---

## Security Considerations

### Threat Model

**Risks:**
1. Image contains PHI → Mitigated by in-memory processing only
2. Image logged accidentally → Mitigated by explicit no-logging policy
3. Extraction inaccurate → Mitigated by mandatory user review
4. User trusts AI blindly → Mitigated by yellow highlights and review header

**Residual Risks:**
- User may screenshot sensitive report → Warn in UI
- LLM provider may retain image (brief period) → Use Anthropic (no retention policy)

---

## Rollout Strategy

### Phase 2.0 (Minimum Viable)
- Upload single image
- Extract CBC panel markers only
- Pre-fill form with mandatory review
- No image storage
- Basic error handling

### Phase 2.1 (Enhancements)
- Confidence score display
- Fuzzy marker name matching
- Unit conversion for metabolic panels
- Better error messages

### Phase 2.2 (Advanced)
- Multi-page report handling
- Support for additional panel types
- Custom marker definitions
- Bulk upload (multiple tests)

---

## Contact & Questions

**Questions about Phase 2 scope?**
Refer to this document and `/products/bloodwork/README.md`.

**Privacy concerns?**
Review Privacy & Trust Implementation section above.

**Ready to build?**
Ensure Phase 1 is validated with real users first.

---

**Last Updated:** 2026-01-31
**Next Review:** After Phase 1 user validation
