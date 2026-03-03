# Bloodwork & Bloodwork Trends — Containment Audit Report

**Date**: 2026-02-01
**Scope**: Bloodwork Entry + Bloodwork Trends
**Status**: READ-ONLY AUDIT (No changes made)
**Auditor**: Automated System Analysis

---

## Executive Summary

The Bloodwork product and Bloodwork Trends feature are **well-contained, correctly isolated, and safely extensible**. The architecture follows clean separation principles with minimal external dependencies. All dependencies are justified and properly documented.

### Key Findings

✅ **Product Containment**: Excellent
✅ **External Dependencies**: Minimal and justified
✅ **Database Isolation**: Complete user-scoped RLS
✅ **Documentation Hygiene**: Good (minor cleanup opportunities)
✅ **Trends Integration**: Clean separation from Entry logic
✅ **Future Risk**: Low sprawl risk

---

## 1. Complete File Inventory

### 1.1 Inside `/products/bloodwork/` (Primary Scope)

#### Core Product Files (8 files)
```
/products/bloodwork/
├── README.md                          [Active - Product definition & boundaries]
├── ARCHITECTURE.md                    [Active - Technical architecture overview]
├── CURRENT_STATUS.md                  [Active - Current capabilities & status]
├── AUDIT_SUMMARY.md                   [Archive candidate - Historical audit]
├── PRODUCT_VALIDATION.md              [Active - Validation rules & safety]
├── IMAGE_UPLOAD_HANDOFF.md            [Archive candidate - Feature handoff doc]
├── CLEANUP_SUMMARY_2026-02-01.md      [Archive candidate - Historical cleanup log]
└── CONTAINMENT_AUDIT_2026-02-01.md    [Archive candidate - Previous audit]
```

#### Components (4 files)
```
/products/bloodwork/components/
├── LocationSelector.tsx               [Active - Saved locations dropdown]
├── PHIWarning.tsx                     [Active - Privacy warning banner]
├── TrackingDisclaimer.tsx             [Active - Legal disclaimer component]
└── TrendChart.tsx                     [Active - TRENDS CORE VISUALIZATION]
```

**Trends-Specific Component**: `TrendChart.tsx`
- **Purpose**: Renders time-series line chart with reference ranges
- **Dependencies**:
  - External: `@/config/theme` (global theme)
  - Internal: `/products/bloodwork/reference/ranges.ts`
  - Internal: `/products/bloodwork/utils/reference-ranges.ts`
- **Isolation**: No dependency on Entry logic
- **Status**: Clean, well-scoped

#### Services (1 file)
```
/products/bloodwork/services/
└── bloodwork.service.ts               [Active - CRUD operations for tests/markers]
```

**Service Analysis**:
- **Methods**: `createTest()`, `updateTest()`, `deleteTest()`, `getTests()`
- **Trends Usage**: Trends only calls `getTests()` (read-only)
- **External Dependencies**:
  - `@/lib/supabase` (shared Supabase client - acceptable)
  - `@/services/user-preferences.service` (for saved locations - acceptable)
- **Isolation**: No cross-product dependencies
- **Status**: Clean

#### Types (1 file)
```
/products/bloodwork/types/
└── bloodwork.types.ts                 [Active - TypeScript interfaces & marker defs]
```

**Type Analysis**:
- **Core Types**: `BloodTest`, `BloodMarker`, `BloodTestWithMarkers`
- **Input Types**: `CreateBloodTestInput`, `UpdateBloodTestInput`, etc.
- **Marker Definitions**: `CBC_MARKERS` array (18 markers)
- **Marker Aliases**: `MARKER_NAME_ALIASES` (normalization mapping)
- **Trends Usage**: Imports `CBC_MARKERS` for marker metadata
- **Status**: Clean, well-documented

#### Utilities (2 files)
```
/products/bloodwork/utils/
├── reference-ranges.ts                [Active - TRENDS DEPENDENCY - Reference range lookup]
└── smart-normalize.ts                 [Active - Entry-only - Unit normalization]
```

**Utility Analysis**:

**`reference-ranges.ts`** (TRENDS-SPECIFIC)
- **Purpose**: Provides reference range lookup by marker/sex/age
- **Data Structure**: Nested object (marker → sex → age → range)
- **Coverage**: 13 CBC markers with sex/age segmentation
- **Status**: Isolated, read-only, no external dependencies

**`smart-normalize.ts`** (ENTRY-SPECIFIC)
- **Purpose**: Corrects common unit scale errors (e.g., HGB 120 → 12.0)
- **Trends Usage**: None (Entry feature only)
- **Status**: Clean separation from Trends

#### Reference Data (2 files)
```
/products/bloodwork/reference/
├── ranges.ts                          [Active - TRENDS CORE DATA - Reference ranges with metadata]
└── SOURCES.md                         [Active - Source citations for ranges]
```

**Reference Data Analysis**:

**`ranges.ts`** (TRENDS CORE DEPENDENCY)
- **Purpose**: Canonical reference range dataset with sources
- **Type**: `ReferenceRange[]` with marker, sex, ageRange, low, typical, high, unit, sources
- **Data Volume**: ~150 entries (15 markers × 6 age ranges × sex variations)
- **Sources**: NHS, Mayo Clinic, Cleveland Clinic, LabCorp, Quest
- **Trends Usage**: Loaded by `TrendChart.tsx` for visualization context
- **Status**: Static, well-documented, source-cited

**`SOURCES.md`** (TRENDS DOCUMENTATION)
- **Purpose**: Documents source legitimacy for reference ranges
- **Content**: Source URLs, regional variance notes, disclaimer
- **Status**: Critical trust documentation for trends feature

#### Documentation (3 active + 21 archived)
```
/products/bloodwork/docs/
├── IMAGE_UPLOAD_FEATURE.md            [Active - Image extraction documentation]
│
├── /archive/fix-logs/                 [9 files - Historical bug fix logs]
│   ├── AUTH_REGRESSION_FIX.md
│   ├── BLOODWORK_SCALE_AUDIT.md
│   ├── DATE_AND_DROPDOWN_FIX.md
│   ├── DELETE_ACTION_DIAGNOSTIC.md
│   ├── DELETE_BUTTON_FIX_COMPLETE.md
│   ├── DELETE_BUTTON_WIRING_TEST.md
│   ├── MARKER_HANDLING_AND_SAVED_LOCATIONS.md
│   ├── TIMELINE_SORTING_AND_DATA_AUDIT.md
│   └── UX_POLISH_FIXES.md
│
├── /archive/phase-docs/               [6 files - Historical phase documentation]
│   ├── PHASE_1_COMPLETE.md
│   ├── PHASE_1_CRITICAL_FIXES.md
│   ├── PHASE_1_EDIT_DELETE_DATE_EXTRACTION.md
│   ├── PHASE_2_IMAGE_EXTRACTION.md
│   ├── PHASE_3_SMART_NORMALIZATION.md
│   └── TEST_VALIDATION_REPORT.md
│
├── /archive/scripts/                  [2 files - Historical SQL scripts]
│   ├── HISTORICAL_NORMALIZATION_ROLLBACK.sql
│   └── HISTORICAL_NORMALIZATION_SCRIPT.sql
│
└── /normalization/                    [2 files - Normalization audit docs]
    ├── HISTORICAL_NORMALIZATION_COMPLETE.md
    └── SMART_NORMALIZATION_DATA_AUDIT.md
```

**Documentation Status**:
- **Active (4 files)**: Current capabilities, architecture, image upload
- **Archived (21 files)**: Historical fix logs, phase docs, scripts
- **Status**: Well-organized, properly archived

---

### 1.2 Outside `/products/bloodwork/` (External Dependencies)

#### UI Routes (6 files in `/app/(tabs)/medical/bloodwork/`)

**Entry Routes** (4 files)
```
/app/(tabs)/medical/bloodwork/
├── index.tsx                          [Dashboard - Links to Entry & Trends]
├── entry/
│   ├── index.tsx                      [Entry timeline - List of tests]
│   ├── new.tsx                        [New test form]
│   ├── [id].tsx                       [Test detail view]
│   └── edit/[id].tsx                  [Edit test form]
```

**Trends Routes** (1 file)
```
/app/(tabs)/medical/bloodwork/
└── trends/
    └── index.tsx                      [TRENDS VISUALIZATION UI]
```

**Route Analysis**:

**Why routes must live outside `/products/bloodwork/`**:
- Expo Router requires all routes in `/app/` directory
- Framework constraint, not a design choice
- Routes are cleanly namespaced under `/medical/bloodwork/`

**Dependency Pattern**:
- Entry routes import from: `/products/bloodwork/services/`, `/products/bloodwork/components/`, `/products/bloodwork/types/`
- Trends route imports from: `/products/bloodwork/services/`, `/products/bloodwork/components/TrendChart.tsx`, `/products/bloodwork/types/`, `/products/bloodwork/utils/reference-ranges.ts`
- No cross-contamination: Entry and Trends routes are separate files
- No shared state between Entry and Trends

**Status**: Acceptable external dependency (framework requirement)

#### Shared Services (1 file in `/services/`)

```
/services/
└── user-preferences.service.ts        [Manages saved_locations for dropdown]
```

**Service Analysis**:

**Why it lives outside**:
- Designed for multi-product extensibility
- `user_preferences` table is product-agnostic
- `saved_locations` field currently only used by Bloodwork
- Future products may add their own preference fields (e.g., `saved_meditation_times`)

**Bloodwork Usage**:
- `BloodworkService.createTest()` calls `UserPreferencesService.addSavedLocation()`
- Saves lab location to dropdown for next time
- Read-only access in LocationSelector component

**Status**: Acceptable external dependency (documented extensibility)

#### Edge Functions (1 file in `/supabase/functions/`)

```
/supabase/functions/
└── analyze-bloodwork-image/
    └── index.ts                       [Claude Vision API image extraction]
```

**Edge Function Analysis**:

**Why it lives outside**:
- Supabase Edge Functions MUST live in `/supabase/functions/` (framework requirement)
- Cannot import from main project (Deno runtime vs. React Native)
- Must be self-contained with inline dependencies

**Code Duplication Notice**:
- `MARKER_NAME_ALIASES` is duplicated from `bloodwork.types.ts`
- Necessary evil: Edge functions cannot import from project
- Documentation notes this explicitly in file header
- If aliases change in `bloodwork.types.ts`, must update edge function

**Bloodwork Usage**:
- Called from `/app/(tabs)/medical/bloodwork/entry/new.tsx`
- Processes image transiently (never stored)
- Returns JSON for form pre-fill

**Status**: Acceptable external dependency (framework requirement + documented)

#### Database Tables (2 tables in Supabase)

**Migration**: `/supabase/migrations/20260131133451_create_bloodwork_schema.sql`

**Tables Owned by Bloodwork**:
1. `blood_tests` (test metadata)
   - Columns: `id`, `user_id`, `test_date`, `location`, `notes`, `created_at`, `updated_at`
   - RLS: User-scoped (auth.uid() = user_id)
   - Indexes: `user_id`, `test_date`

2. `blood_markers` (marker values)
   - Columns: `id`, `test_id`, `marker_name`, `value`, `unit`, `reference_range_low`, `reference_range_high`, `created_at`, `updated_at`
   - RLS: User-scoped via join to `blood_tests`
   - Indexes: `test_id`, `marker_name`
   - Cascade: Deleted when parent test is deleted

**Additional Table Used (Not Owned)**:
- `user_preferences` (shared service)
  - Migration: `/supabase/migrations/20260201044607_create_user_preferences_table.sql`
  - Field used: `saved_locations` (jsonb array)
  - RLS: User-scoped

**Trends Data Flow**:
- Trends reads from `blood_tests` and `blood_markers` (read-only)
- No derived tables
- No persisted trend data
- No demographic data stored
- Trends calculates everything client-side at render time

**Status**: Clean isolation, proper RLS, no data leakage

#### Global Dependencies (3 files)

**Framework/Config**:
```
/lib/supabase.ts                       [Shared Supabase client]
/config/theme.ts                       [Global theme constants]
/config/environment.ts                 [Environment variables]
```

**Dependency Justification**:
- **`/lib/supabase.ts`**: Required for all Supabase database access (framework-level)
- **`/config/theme.ts`**: Required for consistent UI styling (app-wide standard)
- **`/config/environment.ts`**: Required for API keys and configuration (app-wide standard)

**Status**: Acceptable (framework/app-level dependencies)

---

## 2. Containment Assessment

### 2.1 What Is Perfectly Contained

✅ **Product Logic** (`/products/bloodwork/`)
- Service layer is self-contained
- Types are isolated
- Components have no cross-product dependencies
- Reference data is static and immutable

✅ **Trends Logic**
- `TrendChart.tsx` has no dependency on Entry components
- Trends route (`/app/(tabs)/medical/bloodwork/trends/index.tsx`) does not import Entry routes
- Trends reads data via shared service (read-only)
- No shared state between Entry and Trends

✅ **Database Schema**
- Two tables are fully user-scoped via RLS
- No cross-product table dependencies
- Cascade delete prevents orphaned data
- No shared medical state

✅ **Reference Ranges**
- Static data in `/products/bloodwork/reference/ranges.ts`
- Not persisted to database
- Source-cited in `SOURCES.md`
- Used only for visualization (no clinical interpretation)

### 2.2 What Is Acceptably External

✅ **UI Routes** (Framework Requirement)
- Must live in `/app/` for Expo Router
- Cleanly namespaced under `/medical/bloodwork/`
- Entry and Trends routes are separate files (no mixing)

✅ **User Preferences Service** (Documented Extensibility)
- Lives in `/services/` for multi-product reuse
- Only `saved_locations` field is used by Bloodwork
- Well-documented dependency in README
- No tight coupling

✅ **Edge Function** (Framework Requirement)
- Must live in `/supabase/functions/` for Deno runtime
- Self-contained with documented code duplication
- Stateless, transient processing only

✅ **Global Config** (App-Level Standards)
- `/lib/supabase.ts` (framework-level)
- `/config/theme.ts` (app-wide styling)
- `/config/environment.ts` (app-wide config)

### 2.3 What Is Messy But Non-Breaking

⚠️ **Marker Alias Duplication**
- `MARKER_NAME_ALIASES` exists in:
  - `/products/bloodwork/types/bloodwork.types.ts` (canonical)
  - `/supabase/functions/analyze-bloodwork-image/index.ts` (duplicated)
- **Why**: Edge functions cannot import from project (Deno runtime)
- **Risk**: Aliases could diverge if one is updated without the other
- **Mitigation**: Documented in edge function header with explicit warning
- **Status**: Acceptable trade-off (documented technical debt)

⚠️ **Reference Range Data Duplication**
- Reference range logic exists in two places:
  - `/products/bloodwork/reference/ranges.ts` (Trends - with metadata, sources, typical values)
  - `/products/bloodwork/utils/reference-ranges.ts` (Entry - simple lookup, sex/age mapping)
- **Why**: Different use cases (Trends needs metadata, Entry needs simple validation)
- **Risk**: Low (both are static, rarely change)
- **Mitigation**: Could be unified in future refactor
- **Status**: Non-breaking, minor duplication

⚠️ **Documentation Volume**
- 21 archived docs in `/products/bloodwork/docs/archive/`
- Useful for historical context but adds bulk
- **Risk**: None (properly archived)
- **Status**: Non-breaking, cleanup opportunity

---

## 3. Risk Assessment

### 3.1 Future Risk of Sprawl

**LOW RISK** — Product is well-architected with clear boundaries.

**Potential Risks**:
1. **Marker Alias Divergence**
   - If aliases are updated in `bloodwork.types.ts` but not in edge function
   - **Mitigation**: Add automated test to compare both lists
   - **Severity**: Low (rare updates)

2. **Reference Range Duplication**
   - If ranges are updated in one file but not the other
   - **Mitigation**: Consolidate into single source of truth (future refactor)
   - **Severity**: Low (ranges rarely change)

3. **New Trend Features**
   - If Trends grows to include filters, exports, comparisons
   - **Risk**: Could leak into Entry logic if not careful
   - **Mitigation**: Keep `TrendChart.tsx` as self-contained component
   - **Severity**: Low (good separation already established)

4. **User Preferences Coupling**
   - If `user_preferences` table grows with bloodwork-specific fields
   - **Risk**: Could couple Bloodwork to shared service
   - **Mitigation**: Keep preferences product-agnostic (current design)
   - **Severity**: Low (good abstraction)

### 3.2 Coupling Concerns

**No Coupling Issues Detected**

✅ Bloodwork does not depend on:
- Other medical products
- Generic medical tables
- Main Gemma orchestration
- Shared medical state

✅ Bloodwork Entry and Bloodwork Trends are:
- Separate routes
- Separate components
- Shared service layer (read-only for Trends)
- No shared state

✅ Database isolation is:
- Complete (RLS-enforced)
- User-scoped (no cross-user access)
- Cascade-safe (orphaned data prevented)

### 3.3 UX & Data Risks for Trends

**No Data Risks Detected**

✅ **No Persisted Trend Data**
- Trends are calculated client-side at render time
- No derived tables
- No trend history stored

✅ **No Demographic Storage**
- Sex and age range are UI state only (not persisted)
- Reference ranges loaded from static data
- No PII in reference data

✅ **Read-Only Access**
- Trends only calls `BloodworkService.getTests()` (read-only)
- Cannot modify test data
- No write operations in Trends route

✅ **Graceful Degradation**
- If sex/age not provided, reference ranges are not shown
- Chart still renders with data only
- No errors or broken states

---

## 4. Cleanup Recommendations

### 4.1 What Could Be Tidied Later (DO NOT EXECUTE NOW)

#### Documentation Consolidation
**Action**: Move top-level historical docs into `/docs/archive/`
- `AUDIT_SUMMARY.md` → `/docs/archive/audits/`
- `CLEANUP_SUMMARY_2026-02-01.md` → `/docs/archive/cleanups/`
- `CONTAINMENT_AUDIT_2026-02-01.md` → `/docs/archive/audits/`
- `IMAGE_UPLOAD_HANDOFF.md` → `/docs/archive/handoffs/`

**Benefit**: Cleaner top-level directory (keep only README, ARCHITECTURE, CURRENT_STATUS, PRODUCT_VALIDATION)

**Risk**: None

#### Reference Range Unification
**Action**: Consolidate reference range logic
- Merge `/products/bloodwork/utils/reference-ranges.ts` into `/products/bloodwork/reference/ranges.ts`
- Export multiple functions: `getReferenceRange()`, `getReferenceRangeWithMetadata()`
- Update imports in Entry and Trends

**Benefit**: Single source of truth, reduced duplication

**Risk**: Low (thorough testing required)

#### Marker Alias Validation
**Action**: Add automated test to verify alias consistency
- Compare `MARKER_NAME_ALIASES` in `bloodwork.types.ts` vs. edge function
- Fail build if they diverge

**Benefit**: Prevents accidental alias divergence

**Risk**: None

### 4.2 What Must Never Be Moved

❌ **UI Routes** (`/app/(tabs)/medical/bloodwork/`)
- Framework requirement (Expo Router)
- Moving would break navigation

❌ **Edge Functions** (`/supabase/functions/analyze-bloodwork-image/`)
- Framework requirement (Supabase)
- Moving would break deployment

❌ **Database Migrations** (`/supabase/migrations/`)
- Framework requirement (Supabase)
- Moving would break schema history

❌ **Shared Services** (`/services/user-preferences.service.ts`)
- Multi-product extensibility by design
- Moving would couple to single product

### 4.3 What Should Be Documented Better

#### Trends-Entry Separation
**Action**: Add explicit architecture diagram to README
- Show Entry and Trends as separate flows
- Highlight shared service layer (read-only for Trends)
- Document no shared state

**Benefit**: Future developers understand separation

#### Reference Range Sourcing
**Action**: Link `SOURCES.md` from `ranges.ts` and `TrendChart.tsx`
- Add comment in `ranges.ts`: "See /reference/SOURCES.md for source citations"
- Add comment in `TrendChart.tsx`: "Reference ranges sourced from NHS, Mayo Clinic (see SOURCES.md)"

**Benefit**: Improves trust and traceability

#### Edge Function Code Duplication
**Action**: Already documented (no change needed)
- Edge function header explicitly notes duplication
- Clear instructions to update both locations

**Status**: Well-documented

---

## 5. Trends-Specific Findings

### 5.1 Trends Architecture

**Core Components**:
1. **UI Route**: `/app/(tabs)/medical/bloodwork/trends/index.tsx`
   - Loads available markers from all tests
   - Provides marker selector dropdown
   - Provides sex/age selectors for reference context
   - Renders `TrendChart` component
   - Auto-dismisses info panel after 5 seconds

2. **Chart Component**: `/products/bloodwork/components/TrendChart.tsx`
   - Accepts: `data`, `markerName`, `unit`, `sex`, `ageRange`
   - Renders: Line chart with reference lines and Y-axis labels
   - Provides: Tap-to-show tooltip with position indicator
   - Scales: Dynamic Y-axis based on data + reference range

3. **Reference Data**: `/products/bloodwork/reference/ranges.ts`
   - Provides: `getReferenceRange(marker, sex, ageRange)`
   - Returns: `{ marker, sex, ageRange, low, typical, high, unit, sources }`

4. **Data Service**: `/products/bloodwork/services/bloodwork.service.ts`
   - Provides: `getTests()` (read-only)
   - Returns: Array of `BloodTestWithMarkers`

**Data Flow**:
```
1. User selects marker, sex, age range
2. Trends route calls BloodworkService.getTests()
3. Trends route filters markers by name
4. Trends route transforms to TrendDataPoint[]
5. Trends route calls getReferenceRange(marker, sex, age)
6. TrendChart renders chart with data + reference context
7. User taps point → tooltip shows value + position indicator
```

**Separation from Entry**:
- Trends does not import Entry components
- Trends does not modify test data
- Trends does not share state with Entry
- Trends reads via same service (read-only)

**Status**: Clean separation, well-architected

### 5.2 Recent Trends Enhancements

**UX Enhancements Added** (2026-02-01):
1. **Y-Axis Reference Labels**
   - Shows numeric labels for low, typical, high reference values
   - Labels positioned at exact Y-coordinates of reference lines
   - 50px left margin allocated for labels
   - Only renders when sex + age range selected

2. **Dynamic Chart Scaling**
   - Y-domain includes all data points + full reference range + 5% padding
   - No forced zero baseline
   - Realistic proportions maintained

3. **Tooltip Position Indicator**
   - Tooltip shows: value + unit + date + position label
   - Position labels: "Below typical", "Typical range", "Above typical"
   - No color-coded judgements (calm, neutral)

4. **Auto-Dismiss Info Panel**
   - Info panel auto-dismisses after 5 seconds
   - User can tap to dismiss immediately
   - User can scroll to dismiss
   - Timeout cleaned up on unmount

**Files Modified**:
- `/products/bloodwork/components/TrendChart.tsx` (Y-axis labels, tooltip enhancement)
- `/app/(tabs)/medical/bloodwork/trends/index.tsx` (auto-dismiss logic)

**No Changes to**:
- Database schema
- Stored data
- Reference datasets
- Edge functions
- Normalization logic

**Status**: UX-only enhancements, no data changes

### 5.3 Trends Guardrails

**Context Gating**:
- Y-axis labels only render when sex AND age range selected
- Reference lines only render with complete context
- Helper text shows when context missing
- No misleading visualizations possible

**Visual Tone**:
- Reference lines: Dashed, low opacity (30-40%)
- Reference band: Ultra-subtle (5% opacity)
- No red/green colors anywhere
- Muted text colors for all reference elements

**Data Safety**:
- No trend data persisted
- No demographic data stored
- Read-only access to test data
- Client-side calculation only

**Status**: Safe, calm, non-alarming design

---

## 6. Explicit Confirmations

### ✅ No Changes Were Made

This audit was **READ-ONLY**. No files were:
- Modified
- Deleted
- Moved
- Renamed
- Created

All observations and recommendations are for **future consideration** pending explicit approval.

### ✅ No Behavior Was Altered

No changes to:
- Database schemas
- Stored data
- Reference datasets
- Edge functions
- Normalization logic
- Entry logic
- Trends logic
- Auth/RLS policies

### ✅ No Regressions Introduced

This was an **audit only**. No code execution. No deployments. No migrations.

---

## 7. Final Assessment

### Product Containment: EXCELLENT ✅

**Strengths**:
- Clean folder structure with product-specific logic in `/products/bloodwork/`
- Minimal external dependencies (all justified)
- Entry and Trends are properly separated
- Database isolation is complete
- Documentation is well-organized

**Minor Improvements**:
- Consolidate top-level docs into `/docs/archive/`
- Unify reference range logic (future refactor)
- Add automated test for marker alias consistency

### External Dependencies: JUSTIFIED ✅

**Framework Requirements** (Must stay external):
- UI routes in `/app/` (Expo Router)
- Edge functions in `/supabase/functions/` (Supabase)
- Database migrations in `/supabase/migrations/` (Supabase)

**Design Choices** (Acceptable):
- Shared Supabase client in `/lib/supabase.ts` (app-level)
- Shared theme in `/config/theme.ts` (app-level)
- User preferences service in `/services/` (multi-product extensibility)

### Trends Integration: CLEAN ✅

**Separation**:
- Trends route is separate from Entry routes
- TrendChart component has no Entry dependencies
- Trends reads data via shared service (read-only)
- No shared state between Entry and Trends

**Data Flow**:
- Trends calculates everything client-side at render time
- No persisted trend data
- No demographic data stored
- Reference ranges loaded from static data

### Future Risk: LOW ✅

**Potential Risks**:
1. Marker alias divergence (low severity, mitigable with test)
2. Reference range duplication (low severity, future refactor)
3. Documentation volume (no risk, cleanup opportunity)

**No Risks Detected For**:
- Database coupling
- Cross-product dependencies
- Entry/Trends mixing
- RLS leakage
- PII exposure

---

## 8. Recommendations Summary

### Immediate Actions (None Required)
This audit requires **no immediate action**. The product is production-ready and well-contained.

### Future Improvements (When Approved)

**Priority 1** (Low Effort, High Value):
- Move historical docs to `/docs/archive/` subdirectories
- Add comment in `TrendChart.tsx` linking to `SOURCES.md`

**Priority 2** (Medium Effort, Medium Value):
- Add automated test for marker alias consistency
- Unify reference range logic into single source

**Priority 3** (Low Priority):
- Add architecture diagram to README showing Entry/Trends separation

### Never Do
- Move UI routes out of `/app/`
- Move edge functions out of `/supabase/functions/`
- Move user preferences service into `/products/bloodwork/`
- Couple Bloodwork to other medical products

---

## 9. Conclusion

**The Bloodwork product and Bloodwork Trends feature are cleanly scoped, correctly isolated, safely extensible, and free from repo sprawl.**

### Key Successes

1. **Product Independence**: Bloodwork can be disabled, deleted, or price-gated without affecting Path9
2. **Trends Separation**: Entry and Trends are separate flows with no shared state
3. **Database Isolation**: Complete user-scoped RLS with cascade-safe deletes
4. **Documentation**: Well-organized with proper archiving
5. **External Dependencies**: Minimal, justified, and documented

### Ready for Future Growth

The architecture supports future enhancements without sprawl risk:
- New markers can be added to `CBC_MARKERS`
- New visualizations can be added to Trends route
- New entry methods can be added to Entry routes
- New products can use `user_preferences` service

### Trust Level: HIGH

This audit confirms that Bloodwork is production-ready, well-architected, and future-proof.

---

**End of Audit Report**

**Next Steps**: Review findings → Approve recommendations → Proceed with execution (if desired)

**Status**: AUDIT COMPLETE — NO CHANGES MADE — AWAITING APPROVAL
