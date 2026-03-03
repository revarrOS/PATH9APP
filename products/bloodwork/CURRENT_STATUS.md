# Bloodwork Management - Current Status

**Last Updated:** 2026-02-01
**Version:** Phase 1 Complete
**Status:** Production Ready

---

## What Works Today

### ✅ Manual Blood Test Entry
- Create new blood tests with test date and lab location
- Enter CBC panel markers (all 18 markers supported)
- All markers are optional (supports partial panels)
- Edit existing tests and markers
- Delete tests (cascades to markers)
- View test history in chronological timeline

### ✅ AI-Assisted Data Entry
- Upload images of blood test reports (camera or file picker)
- Claude Vision API extracts marker values, units, and reference ranges
- Pre-fills form with extracted data for user review
- User confirms/edits before saving
- Images are processed transiently (never stored)
- Handles multiple marker name variations automatically

### ✅ SMART Normalization
- Automatic scale correction for common unit errors
- High-confidence rules only (no guessing):
  - HGB > 20 g/dL → divide by 10 (120 → 12.0)
  - MCHC > 100 g/dL → divide by 10 (334 → 33.4)
  - HCT < 1 % → multiply by 100 (0.397 → 39.7)
  - RDW-CV < 1 % → multiply by 100 (0.15 → 15.0)
- Runs client-side just before save
- User sees normalization happen (transparent)

### ✅ Saved Locations
- Auto-save lab locations when creating/editing tests
- Dropdown of up to 5 recent locations
- Persistent per user
- Reduces repetitive typing

### ✅ Validation & Safety
- Gentle warnings for unusual values (never blocks)
- PHI warnings for free-text fields
- "For tracking only" disclaimers throughout
- No judgment language (no "high", "low", "normal", "abnormal")
- Negative value warnings

---

## Data in Production

**Current Usage:**
- 7 blood tests stored
- 118 individual marker values
- 1 active user
- All tests have proper RLS isolation

**Supported Markers (CBC Panel):**
- WBC, RBC, HGB, HCT, MCV, MCH, MCHC, PLT
- LYM, MXD, NEUT
- RDW-SD, RDW-CV, PDW, MPV, PLCR

---

## Known Limitations (By Design)

### What Bloodwork Does NOT Do
- ❌ No long-term document storage (images processed transiently)
- ❌ No clinical interpretation or diagnosis
- ❌ No medical advice or treatment recommendations
- ❌ No integration with EHR systems
- ❌ No automatic data import from labs
- ❌ No health outcome predictions
- ❌ No status indicators (colors, badges, alarms)

### Current Scope Boundaries
- **Panel Coverage:** CBC only (metabolic, liver, kidney panels not yet supported)
- **Document Types:** Blood tests only (not general medical records)
- **AI Role:** Extraction only (not interpretation)
- **User Base:** Single-user isolation (no care team sharing yet)

---

## Testing Status

### ✅ Verified Working
- User authentication and RLS policies
- CRUD operations (create, read, update, delete)
- Image upload and vision extraction
- SMART normalization for all 4 markers
- Saved locations persistence
- Timeline sorting and display
- Edit and delete flows
- Validation warnings
- PHI safety warnings

### ✅ Data Integrity
- Historical data normalization completed (one-time correction applied)
- All existing markers verified against typical ranges
- No orphaned records
- Cascade deletes working correctly

### ✅ Security
- RLS policies enforce user isolation
- Authenticated users only
- No cross-user data leakage
- Image data never persisted
- API keys secured in environment

---

## Architecture Summary

### Client-Side
- **UI Routes:** `/app/(tabs)/medical/bloodwork/`
  - Timeline view (`index.tsx`)
  - New test form (`new.tsx`)
  - Detail view (`[id].tsx`)
  - Edit form (`edit/[id].tsx`)
- **Service Layer:** `products/bloodwork/services/bloodwork.service.ts`
- **Utils:** `products/bloodwork/utils/smart-normalize.ts`
- **Components:** LocationSelector, PHIWarning, TrackingDisclaimer

### Server-Side
- **Edge Function:** `supabase/functions/analyze-bloodwork-image`
  - Claude Vision API integration
  - Marker extraction logic
  - Name normalization (handles aliases)
  - Stateless, transient processing

### Database
- **Tables:** `blood_tests`, `blood_markers`, `user_preferences`
- **RLS:** 11 policies total (all user-scoped)
- **Indexes:** Optimized for user queries
- **Triggers:** Auto-update timestamps

---

## Performance Characteristics

### Response Times (Observed)
- Manual entry save: < 500ms
- Timeline load: < 300ms
- Image analysis: 3-8 seconds (depends on Claude API)
- Edit/delete: < 400ms

### Data Volumes (Current)
- Average markers per test: 16-17 (out of 18 possible)
- Average tests per user: 7
- Storage per user: ~5KB (structured data only)

---

## Recent Changes

### Completed (Phase 1)
- Manual entry MVP (2026-01-31)
- Image upload with vision extraction (2026-01-31)
- SMART normalization (2026-01-31)
- Historical data correction (2026-02-01)
- Edit and delete flows (2026-01-31)
- Saved locations feature (2026-01-31)

### In Progress
- None (stable)

### Next (Not Started)
- Trend visualization
- Multi-panel support (metabolic, liver, kidney)
- Educational marker explanations
- Appointment preparation support

---

## Known Issues

**None currently.**

All Phase 1 features are working as designed. No open bugs or regressions.

---

## Quick Links

### Active Documentation
- [Product Overview](README.md)
- [Product Validation Plan](PRODUCT_VALIDATION.md)
- [Image Upload Handoff](IMAGE_UPLOAD_HANDOFF.md)
- [Normalization Reference](docs/normalization/)
- [Architecture Details](ARCHITECTURE.md)

### Archive
- [Phase Build Logs](docs/archive/phase-docs/)
- [Fix History](docs/archive/fix-logs/)
- [SQL Scripts](docs/archive/scripts/)

### Code
- [Service Layer](services/bloodwork.service.ts)
- [Types](types/bloodwork.types.ts)
- [SMART Normalize](utils/smart-normalize.ts)
- [Components](components/)

---

## For New Contributors

**Start here:**
1. Read [README.md](README.md) (product overview)
2. Read this file (current state)
3. Review [ARCHITECTURE.md](ARCHITECTURE.md) (how it works)
4. Check [types/bloodwork.types.ts](types/bloodwork.types.ts) (data model)

**Common tasks:**
- Add a new marker: Update `CBC_MARKERS` in `bloodwork.types.ts` + edge function
- Add normalization rule: Update `smart-normalize.ts` + edge function
- Modify UI: Routes in `/app/(tabs)/medical/bloodwork/`
- Database changes: Create migration in `/supabase/migrations/`

**Testing:**
- Manual testing via UI (no automated tests yet)
- Test with real blood test reports (use your own or demo data)
- Verify RLS by checking queries in Supabase dashboard

---

**Questions?** Check [README.md](README.md) or review [docs/archive/](docs/archive/) for historical context.
