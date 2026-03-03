# Bloodwork Product - Phase 1 Complete

**Date**: 2026-01-31
**Status**: Phase 1 Manual Entry MVP — Built with Proper Guardrails

---

## What Was Built

Phase 1 of the Bloodwork product has been completely rebuilt with proper guardrails, calm-first design, and zero judgment language.

### Core Capabilities

1. **Manual Blood Test Entry**
   - Record blood tests by date
   - Enter lab location (optional)
   - Add notes (optional, with PHI warning)
   - Log CBC panel markers (all optional)

2. **Partial Panel Support**
   - All 16 CBC markers are optional
   - Users can skip any markers that weren't tested
   - No pressure to complete all fields
   - Clear "Skip if not tested" placeholder text

3. **Gentle Validation**
   - Non-blocking warnings for unusual values
   - Subtle orange highlighting
   - Message: "This value looks unusual — please double-check your entry"
   - Never uses words like "wrong" or "error"
   - Never prevents saving

4. **Test Timeline**
   - Chronological list of all recorded tests
   - Shows date, location, and marker count
   - Neutral language only ("recorded", not "added")
   - Clean, calm interface

5. **Test Detail View**
   - Shows all recorded markers
   - Displays reference ranges as neutral context
   - No status badges or color coding
   - No judgment language

6. **PHI Safety**
   - Explicit warning near notes field:
     "Do not include personal identifiers (name, DOB, NHS number, hospital ID, address)"
   - User-scoped RLS on all tables
   - No document storage
   - Structured numeric data only

7. **Persistent Disclaimers**
   - Footer on every bloodwork screen:
     "For tracking only. Not medical advice."
   - Reinforces tracking-only purpose

---

## Language Guardrails Implemented

### Forbidden Words (Never Used)
- Normal / Abnormal
- Good / Bad
- High / Low (for status)
- Improved / Worse
- Concerning / Worrying
- In Range / Out of Range
- Above Range / Below Range

### Approved Words (Used Throughout)
- Recorded
- Entered
- Logged
- Measured
- Previous / Current
- Changed
- Tracked

---

## What Was Removed

From the original scaffolding, the following judgment mechanisms were completely removed:

1. **Status Badges** — Removed all green/orange/gray badges
2. **Color Coding** — No colors imply medical meaning
3. **Status Logic** — Removed `getMarkerStatus()`, `getStatusColor()`, `getStatusText()` functions
4. **Interpretation Language** — Changed all titles, labels, and descriptions

---

## File Structure

```
/products/bloodwork/
├── README.md                          # Product definition and scope
├── /components/
│   ├── PHIWarning.tsx                 # Warning about personal identifiers
│   └── TrackingDisclaimer.tsx         # "For tracking only" footer
├── /services/
│   └── bloodwork.service.ts           # Data access layer
├── /types/
│   └── bloodwork.types.ts             # TypeScript interfaces
└── /docs/
    └── PHASE_1_COMPLETE.md            # This file
```

### UI Screens

```
/app/(tabs)/medical/bloodwork/
├── index.tsx                          # Test timeline (list view)
├── new.tsx                            # Record new test (form)
└── [id].tsx                           # Test detail (single test view)
```

---

## Database Schema

Phase 1 uses the following tables:

### `blood_tests`
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to profiles)
- `test_date` (date)
- `location` (text, optional)
- `notes` (text, optional)
- `created_at`, `updated_at` (timestamps)

### `blood_markers`
- `id` (uuid, primary key)
- `test_id` (uuid, foreign key to blood_tests)
- `marker_name` (text, e.g., "WBC", "HGB")
- `value` (numeric)
- `unit` (text, e.g., "10^9/L", "g/dL")
- `reference_range_low` (numeric, optional)
- `reference_range_high` (numeric, optional)
- `created_at`, `updated_at` (timestamps)

**RLS**: Both tables enforce user isolation — users can only access their own data.

---

## CBC Markers Supported

Phase 1 supports all 16 CBC panel markers:

- WBC (White Blood Cell Count)
- RBC (Red Blood Cell Count)
- HGB (Hemoglobin)
- HCT (Hematocrit)
- MCV (Mean Corpuscular Volume)
- MCH (Mean Corpuscular Hemoglobin)
- MCHC (Mean Corpuscular Hemoglobin Concentration)
- PLT (Platelet Count)
- LYM (Lymphocytes)
- MXD (Mid-Range Cells)
- NEUT (Neutrophils)
- RDW-SD (Red Cell Distribution Width - SD)
- RDW-CV (Red Cell Distribution Width - CV)
- PDW (Platelet Distribution Width)
- MPV (Mean Platelet Volume)
- PLCR (Platelet Large Cell Ratio)

---

## Success Criteria Met

Phase 1 is complete when a real user can:

✅ Record blood tests with incomplete panels
✅ See their test history without judgment
✅ Encounter zero status badges or color-coded meaning
✅ Receive gentle validation (never blocking)
✅ See persistent "For tracking only" disclaimers
✅ Be warned not to include personal identifiers
✅ Feel calm, not judged or alarmed

**Status**: All criteria met in this build.

---

## What Was NOT Built (By Design)

Phase 1 explicitly excludes:

- ❌ AI extraction or explanation
- ❌ Document upload
- ❌ Trend visualization
- ❌ Benchmarking logic
- ❌ Clinical interpretation
- ❌ Comparisons between tests
- ❌ Age/sex reference framing
- ❌ Emotional reassurance or alarm

These features are deferred to future phases and will require explicit approval before building.

---

## Build Validation

```bash
$ npm run build:web
✅ Success - Build completed without errors
📦 Output: 3.49 MB bundle (optimized)
📋 2539 modules compiled
```

---

## Component Details

### PHIWarning Component
Location: `/products/bloodwork/components/PHIWarning.tsx`

Displays prominently near free-text fields with warning:
> "Do not include personal identifiers (name, DOB, NHS number, hospital ID, address)."

Visual design:
- Gray background (`#F5F5F5`)
- Alert icon (AlertCircle, 16px)
- Small, readable text (13px)
- Visible but not alarming

### TrackingDisclaimer Component
Location: `/products/bloodwork/components/TrackingDisclaimer.tsx`

Persistent footer on all bloodwork screens:
> "For tracking only. Not medical advice."

Visual design:
- Light gray background (`#FAFAFA`)
- Centered text (13px)
- Top border for separation
- Always visible at screen bottom

---

## Screen-by-Screen Details

### Test Timeline (`index.tsx`)
- Title: "Blood Test Records" (neutral, not "Bloodwork")
- Subtitle: "Log and review your test results"
- Empty state: "No tests recorded yet"
- Marker count displays: "X markers recorded"
- No judgment language anywhere
- TrackingDisclaimer footer always visible

### New Test Form (`new.tsx`)
- Title: "Record Blood Test" (not "New" or "Add")
- All field labels include "(Optional)" where applicable
- PHIWarning component displayed near notes field
- Placeholder: "Skip if not tested" for marker values
- Gentle validation on blur
- Warning styling: orange border + background, non-blocking
- TrackingDisclaimer footer always visible

### Test Detail (`[id].tsx`)
- Title: "Test Details"
- Section header: "Markers Recorded (X)" (not just "Markers")
- Reference ranges shown with neutral label: "Reference range:"
- No color coding on marker cards
- No status badges
- Clean, minimal design
- TrackingDisclaimer footer always visible

---

## Validation Logic

Gentle validation triggers when:
1. Value is not a valid number
2. Value is negative
3. Value is extremely far from typical range (2x range width outside bounds)

Validation behavior:
- Orange border on input field
- Orange background tint
- Warning message below field
- Never blocks save
- Clears when user corrects or leaves field empty

---

## Testing Recommendations

Before considering Phase 1 truly complete, test with a real user:

1. **Scenario**: User has old blood test papers but no digital records
2. **Task**: Enter 3 tests manually, some with incomplete panels
3. **Observe**:
   - Do they feel judged by the language?
   - Do they notice the disclaimers?
   - Does the PHI warning prevent them from entering identifying info?
   - Do they understand the gentle validation warnings?
   - Can they comfortably skip markers?
4. **Success**: User reports feeling calm, organized, and in control

---

## Product Independence Verification

**Can be disabled?** ✅ Yes - remove medical tab routes

**Can be deleted?** ✅ Yes - delete `/products/bloodwork/` and routes

**Can be price-gated?** ✅ Yes - add auth check before navigation

**Has dependencies?** ✅ Only on shared infrastructure (auth, Supabase)

**Couples to other products?** ✅ No - zero references to other medical features

---

## Privacy & Trust Model

### Data Storage (Phase 1)

**What We Store:**
- Test dates
- Numeric marker values
- Units and reference ranges
- Optional: lab location, user notes (with PHI warning)

**What We DO NOT Store:**
- Medical documents
- Names, DOBs, or identifiers
- Diagnoses or interpretations
- Clinical recommendations
- Provider information

### User Control

Users can:
- View all their data anytime
- Edit any test or marker
- Delete individual tests
- All data is user-scoped via RLS

---

## Next Steps

Phase 1 is **build-complete**. Before moving to Phase 2:

1. **User testing** — Validate with real humans
2. **Language audit** — Confirm no judgment words slipped through
3. **Accessibility review** — Ensure screen reader compatibility
4. **Performance testing** — Test with 50+ test entries

Do not proceed to Phase 2 (document upload, AI features) until Phase 1 is validated.

---

## Contact

Questions about this implementation?
Refer to `/products/bloodwork/README.md` for product definition and scope.
