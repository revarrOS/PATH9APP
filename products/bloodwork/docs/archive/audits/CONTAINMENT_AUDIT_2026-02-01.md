# Bloodwork Product Containment & Repo Hygiene Audit

**Date:** 2026-02-01
**Scope:** Complete structural audit of Bloodwork Management product
**Purpose:** Assess containment, identify boundaries, and propose tidy-up actions

---

## Executive Summary

**Overall Assessment:** 🟡 **MOSTLY CONTAINED with minor cleanup needed**

The Bloodwork product is generally well-structured and properly scoped. Most logic lives inside `/products/bloodwork/`, with clear boundaries. However, there are some hygiene issues:

- ✅ **Clean service layer** - well-contained
- ✅ **Clear type definitions** - no leakage
- ✅ **Proper RLS isolation** - secure and scoped
- 🟡 **Documentation sprawl** - too many phase docs
- 🟡 **Duplicate migrations** - 3 copies of same migration
- 🟡 **Shared dependencies** - user-preferences service lives outside product
- ✅ **UI properly placed** - app routes are acceptable external placement

---

## 1️⃣ Files INSIDE `/products/bloodwork/`

### **Components** (3 files) ✅
| File | Purpose | Status |
|------|---------|--------|
| `components/LocationSelector.tsx` | Dropdown for saved lab locations | ✅ Belongs here |
| `components/PHIWarning.tsx` | Privacy warning for free-text fields | ✅ Belongs here |
| `components/TrackingDisclaimer.tsx` | "For tracking only" disclaimer | ✅ Belongs here |

**Assessment:** Clean, minimal, product-specific. All belong here.

---

### **Services** (1 file) ✅
| File | Purpose | Status |
|------|---------|--------|
| `services/bloodwork.service.ts` | CRUD operations for tests and markers | ✅ Belongs here |

**Dependencies:**
- `@/lib/supabase` - acceptable shared infrastructure
- `@/services/user-preferences.service` - 🟡 lives outside product (see below)

**Assessment:** Well-contained. Single responsibility. No leakage.

---

### **Types** (1 file) ✅
| File | Purpose | Status |
|------|---------|--------|
| `types/bloodwork.types.ts` | TypeScript interfaces and CBC marker definitions | ✅ Belongs here |

**Contents:**
- `BloodTest`, `BloodMarker`, `BloodTestWithMarkers` interfaces
- `CreateBloodTestInput`, `UpdateBloodTestInput`, etc.
- `CBCMarkerName` enum (18 markers)
- `CBC_MARKERS` array with typical ranges
- `MARKER_NAME_ALIASES` for normalization

**Assessment:** Complete, self-contained, well-documented.

---

### **Utils** (1 file) ✅
| File | Purpose | Status |
|------|---------|--------|
| `utils/smart-normalize.ts` | Client-side scale normalization logic | ✅ Belongs here |

**Functions:**
- `smartNormalize()` - Applies high-confidence corrections (HGB ÷10, HCT ×100, etc.)
- `wouldNormalize()` - Preview helper for UI

**Assessment:** Pure utility, no external dependencies. Perfect placement.

---

### **Documentation** (18 files) 🟡
| File | Lines | Purpose | Keep? |
|------|-------|---------|-------|
| `README.md` | 247 | Main product overview | ✅ YES |
| `PRODUCT_VALIDATION.md` | ? | Phase 1 validation plan | ✅ YES |
| `IMAGE_UPLOAD_HANDOFF.md` | ? | Feature handoff doc | ✅ YES |
| **Phase Docs (6 files)** | 2,463 | Historical build logs | 🟡 ARCHIVE |
| `docs/PHASE_1_COMPLETE.md` | 359 | Phase 1 summary | 🟡 ARCHIVE |
| `docs/PHASE_1_CRITICAL_FIXES.md` | 142 | Fix log | 🟡 ARCHIVE |
| `docs/PHASE_1_EDIT_DELETE_DATE_EXTRACTION.md` | 183 | Feature log | 🟡 ARCHIVE |
| `docs/PHASE_2_IMAGE_EXTRACTION.md` | 610 | Image upload build | 🟡 ARCHIVE |
| `docs/PHASE_3_SMART_NORMALIZATION.md` | 581 | Normalization build | 🟡 ARCHIVE |
| `docs/TEST_VALIDATION_REPORT.md` | 386 | Phase 1 testing | 🟡 ARCHIVE |
| **Fix Logs (7 files)** | 2,995 | Debugging/audit reports | 🟡 ARCHIVE |
| `docs/AUTH_REGRESSION_FIX.md` | 331 | Auth debugging | 🟡 ARCHIVE |
| `docs/BLOODWORK_SCALE_AUDIT.md` | 612 | Scale error audit | 🟡 ARCHIVE |
| `docs/DATE_AND_DROPDOWN_FIX.md` | 377 | UX fixes | 🟡 ARCHIVE |
| `docs/DELETE_ACTION_DIAGNOSTIC.md` | 368 | Delete debugging | 🟡 ARCHIVE |
| `docs/DELETE_BUTTON_FIX_COMPLETE.md` | 338 | Delete fix summary | 🟡 ARCHIVE |
| `docs/DELETE_BUTTON_WIRING_TEST.md` | 429 | Delete testing | 🟡 ARCHIVE |
| `docs/TIMELINE_SORTING_AND_DATA_AUDIT.md` | 277 | Data audit | 🟡 ARCHIVE |
| `docs/UX_POLISH_FIXES.md` | 580 | UX polish log | 🟡 ARCHIVE |
| `docs/MARKER_HANDLING_AND_SAVED_LOCATIONS.md` | 278 | Feature notes | 🟡 ARCHIVE |
| **Normalization Docs (3 files)** | 525 | Historical data fix | ✅ KEEP |
| `docs/SMART_NORMALIZATION_DATA_AUDIT.md` | 406 | Initial audit | ✅ KEEP |
| `docs/HISTORICAL_NORMALIZATION_COMPLETE.md` | 286 | Completion report | ✅ KEEP |
| `docs/HISTORICAL_NORMALIZATION_SCRIPT.sql` | 179 | Correction SQL | ✅ KEEP |
| `docs/HISTORICAL_NORMALIZATION_ROLLBACK.sql` | 138 | Rollback SQL | ✅ KEEP |
| `docs/IMAGE_UPLOAD_FEATURE.md` | 239 | Image upload spec | ✅ KEEP |

**Total:** 6,782 lines across 18 docs

**Assessment:** 🟡 **Documentation sprawl**
- 13 files (4,458 lines) are historical build/debug logs
- These are valuable archives but clutter the active docs
- Should be moved to `docs/archive/` subdirectory

---

### **Migrations** (1 file) 🟡
| File | Purpose | Status |
|------|---------|--------|
| `migrations/20250131_create_bloodwork_schema.sql` | Bloodwork schema definition | 🟡 DUPLICATE |

**Issue:** This is a **duplicate**. The same migration exists in:
1. `/products/bloodwork/migrations/20250131_create_bloodwork_schema.sql`
2. `/supabase/migrations/20260131133451_create_bloodwork_schema.sql`
3. `/supabase/migrations/20260131175343_20260131133451_create_bloodwork_schema.sql`

**Recommendation:** Delete the copy in `/products/bloodwork/migrations/`. Applied migrations should only live in `/supabase/migrations/`.

---

## 2️⃣ Files OUTSIDE Product (But Connected)

### **UI Routes** (4 files in `/app/(tabs)/medical/bloodwork/`) ✅
| File | Purpose | Status |
|------|---------|--------|
| `bloodwork/index.tsx` | Timeline list view | ✅ Acceptable placement |
| `bloodwork/new.tsx` | New test entry form | ✅ Acceptable placement |
| `bloodwork/[id].tsx` | Test detail view | ✅ Acceptable placement |
| `bloodwork/edit/[id].tsx` | Edit test form | ✅ Acceptable placement |

**Imports from product:**
- ✅ `@/products/bloodwork/services/bloodwork.service`
- ✅ `@/products/bloodwork/types/bloodwork.types`
- ✅ `@/products/bloodwork/components/*`
- ✅ `@/products/bloodwork/utils/smart-normalize`

**External dependencies:**
- `expo-router` - framework requirement
- `expo-image-picker` - native functionality
- `@/config/environment` - shared config
- `@/services/user-preferences.service` - 🟡 see below

**Justification:** Expo Router requires routes to live in `/app/`. This placement is **necessary and acceptable**.

**Assessment:** ✅ Clean imports, proper scoping. No concerns.

---

### **Shared Services** (1 file in `/services/`) 🟡

#### `/services/user-preferences.service.ts`

**Purpose:** Manage saved lab locations (max 5, auto-save on test create/edit)

**Used by:**
- ✅ `products/bloodwork/services/bloodwork.service.ts`
- ✅ `products/bloodwork/components/LocationSelector.tsx`
- ✅ `app/(tabs)/medical/bloodwork/new.tsx`

**Database table:** `user_preferences`
- Single table, user-scoped
- Currently ONLY stores `saved_locations` (bloodwork-specific)
- Could be extended for other product preferences in future

**Why it lives outside:**
- `user_preferences` table is designed to be extensible (could store other preferences)
- Service is generic enough to support other products
- Naming is intentionally product-agnostic

**Assessment:** 🟡 **Acceptable but document the dependency**

**Options:**
1. **Keep as-is** - document as a shared service that bloodwork uses
2. **Move inside product** - rename to `bloodwork-preferences.service.ts`
3. **Clarify ownership** - add comment that bloodwork owns `saved_locations` field

**Recommendation:** Keep as-is, but document in bloodwork README that it depends on this shared service.

---

### **Database Tables** (3 tables in `public` schema)

#### Owned by Bloodwork Product:
1. **`blood_tests`** (7 rows)
   - Primary table for test records
   - RLS: user-scoped, full CRUD
   - Cascade delete to `blood_markers`
   - ✅ Clean, isolated

2. **`blood_markers`** (118 rows)
   - Marker values for each test
   - RLS: user-scoped via JOIN to `blood_tests`
   - ✅ Clean, isolated

#### Shared (but bloodwork-dependent):
3. **`user_preferences`** (1 row)
   - Currently ONLY used by bloodwork
   - Stores `saved_locations` JSONB array
   - RLS: user-scoped
   - 🟡 Designed to be extensible for other products

**Assessment:** ✅ Proper isolation, clean RLS policies, no cross-contamination.

---

## 3️⃣ Functions (Edge Functions & Helpers)

### **Edge Functions** (1 function in `/supabase/functions/`)

#### `analyze-bloodwork-image/index.ts` (300 lines)

**Purpose:** Extract marker values from blood test images using Claude Vision API

**Functionality:**
- Accepts base64 image
- Calls Anthropic Claude Vision API
- Extracts marker values, units, reference ranges
- Normalizes marker names using `MARKER_ALIASES` (duplicated from types)
- Returns structured JSON for UI pre-fill

**Dependencies:**
- `ANTHROPIC_API_KEY` environment variable
- Hardcoded CBC marker list (18 markers)
- Marker alias map (duplicated from `bloodwork.types.ts`)

**Issues:**
- 🟡 **Duplication:** `MARKER_ALIASES` is duplicated from `products/bloodwork/types/bloodwork.types.ts`
- ✅ **Placement:** Correct - edge functions must live in `/supabase/functions/`
- ✅ **Scoping:** Only used by bloodwork product

**Assessment:** 🟡 Minor duplication, but acceptable. Edge functions can't import from `/products/`.

**Recommendation:** Add a comment noting the duplication and why it exists.

---

### **Client-Side Helpers**

#### `products/bloodwork/utils/smart-normalize.ts`

**Functions:**
- `smartNormalize(markerValues)` - Applies scale corrections
- `wouldNormalize(markerName, value)` - Preview helper

**Called from:**
- `app/(tabs)/medical/bloodwork/new.tsx` (before save)
- Inline validation in new.tsx (lines 54-63)

**Assessment:** ✅ Perfect placement. Pure utility, no side effects.

---

## 4️⃣ Database Schema Audit

### **Tables Created by Bloodwork**

#### `blood_tests`
```sql
Columns: id, user_id, test_date, location, notes, created_at, updated_at
Primary Key: id
Foreign Keys: user_id → auth.users(id) ON DELETE CASCADE
Indexes:
  - idx_blood_tests_user_id
  - idx_blood_tests_test_date
RLS Policies: 4 (SELECT, INSERT, UPDATE, DELETE) ✅
Triggers: update_updated_at_column ✅
```

**Assessment:** ✅ No unused columns, all necessary, clean structure.

---

#### `blood_markers`
```sql
Columns: id, test_id, marker_name, value, unit, reference_range_low, reference_range_high, created_at, updated_at
Primary Key: id
Foreign Keys: test_id → blood_tests(id) ON DELETE CASCADE
Indexes:
  - idx_blood_markers_test_id
  - idx_blood_markers_marker_name
RLS Policies: 4 (SELECT, INSERT, UPDATE, DELETE via JOIN) ✅
Triggers: update_updated_at_column ✅
```

**Assessment:** ✅ No unused columns, all necessary, clean structure.

---

#### `user_preferences` (shared but bloodwork-specific currently)
```sql
Columns: user_id, saved_locations, created_at, updated_at
Primary Key: user_id
Foreign Keys: user_id → auth.users(id) ON DELETE CASCADE
Indexes: None (primary key index implicit)
RLS Policies: 3 (SELECT, INSERT, UPDATE) ✅
Triggers: None
```

**Fields:**
- `saved_locations` - JSONB array, max 5 locations (bloodwork feature)

**Assessment:** ✅ Clean. Designed for extensibility but currently bloodwork-only.

---

### **Database Functions**

#### `update_updated_at_column()`
- Shared trigger function used by both `blood_tests` and `blood_markers`
- ✅ Proper placement (shared infrastructure)

---

### **RLS Policy Summary**

| Table | Policies | Authentication | Ownership Check | Status |
|-------|----------|----------------|-----------------|--------|
| `blood_tests` | 4 | ✅ authenticated | ✅ auth.uid() = user_id | ✅ SECURE |
| `blood_markers` | 4 | ✅ authenticated | ✅ JOIN to blood_tests | ✅ SECURE |
| `user_preferences` | 3 | ✅ authenticated | ✅ auth.uid() = user_id | ✅ SECURE |

**Assessment:** ✅ All policies follow best practices. No `USING (true)`. Proper user isolation.

---

## 5️⃣ Documentation & Scripts Audit

### **Migration Files**

| Location | Filename | Status |
|----------|----------|--------|
| `/supabase/migrations/` | `20260131133451_create_bloodwork_schema.sql` | ✅ Applied |
| `/supabase/migrations/` | `20260131175343_20260131133451_create_bloodwork_schema.sql` | ❌ DUPLICATE |
| `/products/bloodwork/migrations/` | `20250131_create_bloodwork_schema.sql` | ❌ DUPLICATE |
| `/supabase/migrations/` | `20260201044607_create_user_preferences_table.sql` | ✅ Applied |

**Issue:** 3 copies of essentially the same migration (only trailing newline differs)

**Recommendation:**
1. Delete `/products/bloodwork/migrations/20250131_create_bloodwork_schema.sql`
2. Keep only the applied migration in `/supabase/migrations/20260131133451_create_bloodwork_schema.sql`
3. Delete `/supabase/migrations/20260131175343_20260131133451_create_bloodwork_schema.sql` (duplicate)

---

### **SQL Scripts** (in docs/)

| File | Purpose | Keep? |
|------|---------|-------|
| `docs/HISTORICAL_NORMALIZATION_SCRIPT.sql` | One-time data correction (already applied) | ✅ YES (archive) |
| `docs/HISTORICAL_NORMALIZATION_ROLLBACK.sql` | Rollback script (safety measure) | ✅ YES (archive) |

**Assessment:** ✅ Important historical artifacts. Move to `docs/archive/scripts/`.

---

### **Documentation Structure Recommendation**

**Current:** Flat list of 18 files (6,782 lines)

**Proposed:**
```
/products/bloodwork/
├── README.md (main product overview)
├── PRODUCT_VALIDATION.md
├── IMAGE_UPLOAD_HANDOFF.md
├── /docs/
│   ├── CURRENT_STATUS.md (high-level summary of what works)
│   ├── /archive/
│   │   ├── /phase-docs/
│   │   │   ├── PHASE_1_COMPLETE.md
│   │   │   ├── PHASE_1_CRITICAL_FIXES.md
│   │   │   ├── PHASE_2_IMAGE_EXTRACTION.md
│   │   │   ├── PHASE_3_SMART_NORMALIZATION.md
│   │   │   └── TEST_VALIDATION_REPORT.md
│   │   ├── /fix-logs/
│   │   │   ├── AUTH_REGRESSION_FIX.md
│   │   │   ├── BLOODWORK_SCALE_AUDIT.md
│   │   │   ├── DATE_AND_DROPDOWN_FIX.md
│   │   │   ├── DELETE_*.md (3 files)
│   │   │   ├── TIMELINE_SORTING_AND_DATA_AUDIT.md
│   │   │   ├── UX_POLISH_FIXES.md
│   │   │   └── MARKER_HANDLING_AND_SAVED_LOCATIONS.md
│   │   └── /scripts/
│   │       ├── HISTORICAL_NORMALIZATION_SCRIPT.sql
│   │       └── HISTORICAL_NORMALIZATION_ROLLBACK.sql
│   └── /normalization/ (active reference)
│       ├── SMART_NORMALIZATION_DATA_AUDIT.md
│       └── HISTORICAL_NORMALIZATION_COMPLETE.md
```

**Benefits:**
- Clear separation of active vs. historical docs
- Easier to find current status
- Preserves valuable debugging history
- Reduces noise in main docs/ folder

---

## 6️⃣ Containment Assessment

### ✅ **What's Clean**

1. **Service Layer**
   - All CRUD logic in `bloodwork.service.ts`
   - No leakage to other services
   - Clear boundaries

2. **Type Definitions**
   - Complete type coverage
   - No shared types with other products
   - Marker definitions well-documented

3. **Database Isolation**
   - RLS properly configured
   - User-scoped data
   - Cascade deletes work correctly
   - No dependencies on other product tables

4. **Utility Functions**
   - `smart-normalize.ts` is pure, testable
   - No side effects
   - Well-documented algorithms

5. **Component Scoping**
   - All 3 components are product-specific
   - Reusable but not generic
   - Clear purpose

---

### 🟡 **What's Acceptable (But Document)**

1. **UI Routes Outside Product**
   - **Reason:** Expo Router requirement
   - **Mitigation:** All imports use product namespace
   - **Action:** Document this pattern in README

2. **UserPreferencesService Lives in /services/**
   - **Reason:** Designed for multi-product extensibility
   - **Current Use:** Only bloodwork uses it
   - **Action:** Add note in bloodwork README about this dependency

3. **Edge Function Can't Import Product Types**
   - **Reason:** Supabase edge functions run in Deno, can't access project imports
   - **Duplication:** `MARKER_ALIASES` duplicated
   - **Action:** Add comment explaining why duplication exists

---

### 🔴 **What's Messy (Needs Cleanup)**

1. **Documentation Sprawl**
   - 18 docs, 6,782 lines
   - 13 files are historical build/debug logs
   - Hard to find current status
   - **Action:** Reorganize into archive structure (see above)

2. **Duplicate Migrations**
   - 3 copies of same migration file
   - Confusing to know which is authoritative
   - **Action:** Delete 2 duplicates, keep only applied migration in `/supabase/migrations/`

3. **No CURRENT_STATUS.md**
   - No single source of truth for "what works now"
   - Must read multiple docs to understand current state
   - **Action:** Create a high-level summary doc

---

## 7️⃣ Tidy-Up Proposal (Not Yet Executed)

### **High Priority (Do First)**

#### 1. Delete Duplicate Migrations ❌
```bash
# Delete these 2 duplicates:
rm /products/bloodwork/migrations/20250131_create_bloodwork_schema.sql
rm /supabase/migrations/20260131175343_20260131133451_create_bloodwork_schema.sql

# Keep only:
# /supabase/migrations/20260131133451_create_bloodwork_schema.sql
```

**Reason:** 3 copies of same file causes confusion. Applied migrations should only exist in `/supabase/migrations/`.

---

#### 2. Reorganize Documentation 📁
```bash
# Create archive structure
mkdir -p /products/bloodwork/docs/archive/phase-docs
mkdir -p /products/bloodwork/docs/archive/fix-logs
mkdir -p /products/bloodwork/docs/archive/scripts
mkdir -p /products/bloodwork/docs/normalization

# Move phase docs
mv docs/PHASE_*.md docs/archive/phase-docs/
mv docs/TEST_VALIDATION_REPORT.md docs/archive/phase-docs/

# Move fix logs
mv docs/AUTH_REGRESSION_FIX.md docs/archive/fix-logs/
mv docs/BLOODWORK_SCALE_AUDIT.md docs/archive/fix-logs/
mv docs/DATE_AND_DROPDOWN_FIX.md docs/archive/fix-logs/
mv docs/DELETE_*.md docs/archive/fix-logs/
mv docs/TIMELINE_SORTING_AND_DATA_AUDIT.md docs/archive/fix-logs/
mv docs/UX_POLISH_FIXES.md docs/archive/fix-logs/
mv docs/MARKER_HANDLING_AND_SAVED_LOCATIONS.md docs/archive/fix-logs/

# Move SQL scripts
mv docs/HISTORICAL_NORMALIZATION_*.sql docs/archive/scripts/

# Move normalization docs to active reference
mv docs/SMART_NORMALIZATION_DATA_AUDIT.md docs/normalization/
mv docs/HISTORICAL_NORMALIZATION_COMPLETE.md docs/normalization/

# Keep in main docs/
# - IMAGE_UPLOAD_FEATURE.md (active feature spec)
```

**Reason:** Reduce clutter, preserve history, make current state easier to find.

---

#### 3. Create CURRENT_STATUS.md 📄

**Location:** `/products/bloodwork/CURRENT_STATUS.md`

**Contents:**
- What features are live (manual entry, image upload, smart normalization)
- What data exists (7 tests, 118 markers, 1 user)
- What's tested and verified
- Known issues (none currently)
- Quick links to key docs

**Reason:** Single source of truth for "what works right now."

---

### **Medium Priority (Document Dependencies)**

#### 4. Update README.md 📝

**Add section:**
```markdown
## Dependencies

### Internal Dependencies
- `/lib/supabase` - Shared Supabase client
- `/config/environment` - Environment variables
- `/services/user-preferences.service` - Manages saved lab locations

### External Dependencies
- `expo-router` - Navigation framework
- `expo-image-picker` - Image upload
- Supabase edge function `analyze-bloodwork-image` (Claude Vision API)

### Database Tables Owned
- `blood_tests` (7 rows)
- `blood_markers` (118 rows)

### Database Tables Shared
- `user_preferences` (currently only bloodwork uses `saved_locations` field)
```

**Reason:** Make dependencies explicit and discoverable.

---

#### 5. Add Comment to Edge Function 💬

**File:** `/supabase/functions/analyze-bloodwork-image/index.ts`

**Add at top:**
```typescript
/**
 * Note: MARKER_ALIASES is duplicated from products/bloodwork/types/bloodwork.types.ts
 * This is necessary because edge functions cannot import from the main project.
 * If you update marker aliases in the product types, update them here too.
 */
const MARKER_ALIASES: Record<string, string> = { /* ... */ };
```

**Reason:** Explain duplication to prevent future confusion.

---

### **Low Priority (Nice to Have)**

#### 6. Consider Moving UserPreferencesService 🤔

**Option A:** Keep as-is (recommended)
- Document in bloodwork README
- Acknowledge it's designed for multi-product use
- Leave for future extensibility

**Option B:** Move into product
- Rename to `bloodwork-preferences.service.ts`
- Move to `/products/bloodwork/services/`
- Update imports in 3 files
- Clarifies ownership but reduces reusability

**Recommendation:** **Option A** - keep as-is, document dependency.

---

#### 7. Add Product Architecture Diagram 📊

**Location:** `/products/bloodwork/docs/ARCHITECTURE.md`

**Contents:**
- Visual diagram showing:
  - UI layer (app routes)
  - Service layer (bloodwork.service, user-preferences.service)
  - Database layer (blood_tests, blood_markers, user_preferences)
  - Edge functions (analyze-bloodwork-image)
  - Utils (smart-normalize)
- Data flow for create/edit operations
- Image upload flow

**Reason:** Makes onboarding and debugging easier.

---

## 8️⃣ Naming & Structure Improvements

### **Current Structure:** ✅ Good
```
/products/bloodwork/
├── README.md
├── /components/ (3 files)
├── /services/ (1 file)
├── /types/ (1 file)
├── /utils/ (1 file)
├── /docs/ (18 files) ← needs tidying
└── /migrations/ (1 file) ← DELETE (duplicate)
```

### **Proposed Structure:** ✅ Better
```
/products/bloodwork/
├── README.md
├── CURRENT_STATUS.md ← NEW
├── PRODUCT_VALIDATION.md
├── IMAGE_UPLOAD_HANDOFF.md
├── /components/ (3 files)
├── /services/ (1 file)
├── /types/ (1 file)
├── /utils/ (1 file)
└── /docs/
    ├── ARCHITECTURE.md ← NEW
    ├── IMAGE_UPLOAD_FEATURE.md (active spec)
    ├── /normalization/ (2 files - active reference)
    └── /archive/
        ├── /phase-docs/ (6 files)
        ├── /fix-logs/ (8 files)
        └── /scripts/ (2 SQL files)
```

---

## 9️⃣ Files That Could Be Safely Removed

### **None** (All files serve a purpose)

**However, some should be MOVED to archive:**
- Phase docs (6 files)
- Fix logs (8 files)
- Historical SQL scripts (2 files)

**Do NOT delete:**
- All files have historical or reference value
- Moving to `/docs/archive/` preserves them without clutter

---

## 🔟 Summary & Recommendations

### **Current State:** 🟡 **MOSTLY CLEAN**

**Strengths:**
- ✅ Service layer is well-contained
- ✅ Types are complete and isolated
- ✅ Database schema is secure and scoped
- ✅ RLS policies follow best practices
- ✅ Smart normalization logic is clean
- ✅ Components are product-specific

**Issues:**
- 🟡 Documentation is sprawling (18 files, 6,782 lines)
- 🟡 Duplicate migrations (3 copies)
- 🟡 Shared dependency (user-preferences) not documented
- 🟡 No high-level status doc

**No Security Issues:** ✅
**No Data Integrity Issues:** ✅
**No Logic Leakage:** ✅

---

### **Recommended Actions (In Order)**

#### **Phase 1: Critical Cleanup** (Do Now)
1. ✅ Delete duplicate migrations (2 files)
2. ✅ Reorganize docs into archive structure
3. ✅ Create `CURRENT_STATUS.md`

#### **Phase 2: Documentation** (Do Soon)
4. ✅ Update README with dependencies section
5. ✅ Add duplication comment to edge function
6. ✅ Create `ARCHITECTURE.md` with diagrams

#### **Phase 3: Optional Improvements** (Consider Later)
7. 🤔 Decide on UserPreferencesService placement
8. 🤔 Add unit tests for smart-normalize
9. 🤔 Consider creating a /tests/ directory

---

### **Success Criteria After Tidy-Up**

✅ **Bloodwork product is easy to reason about in isolation**
- Single CURRENT_STATUS.md explains what works
- README clearly lists dependencies
- Active docs separated from historical logs

✅ **No "mystery" files or logic**
- All files have clear purpose
- Duplication is documented where necessary
- Migrations are authoritative

✅ **Clear boundaries before UI/UX redesign**
- Product-owned vs. shared is explicit
- Dependencies are documented
- No hidden coupling

✅ **Repo feels calm, intentional, and professional**
- Organized documentation
- No duplicate files
- Clear structure

---

## Appendix: Complete File Inventory

### Inside `/products/bloodwork/` (29 files)

**Components:** 3 files
- LocationSelector.tsx
- PHIWarning.tsx
- TrackingDisclaimer.tsx

**Services:** 1 file
- bloodwork.service.ts

**Types:** 1 file
- bloodwork.types.ts

**Utils:** 1 file
- smart-normalize.ts

**Documentation:** 18 files, 6,782 lines
- README.md
- PRODUCT_VALIDATION.md
- IMAGE_UPLOAD_HANDOFF.md
- docs/PHASE_1_COMPLETE.md
- docs/PHASE_1_CRITICAL_FIXES.md
- docs/PHASE_1_EDIT_DELETE_DATE_EXTRACTION.md
- docs/PHASE_2_IMAGE_EXTRACTION.md
- docs/PHASE_3_SMART_NORMALIZATION.md
- docs/TEST_VALIDATION_REPORT.md
- docs/AUTH_REGRESSION_FIX.md
- docs/BLOODWORK_SCALE_AUDIT.md
- docs/DATE_AND_DROPDOWN_FIX.md
- docs/DELETE_ACTION_DIAGNOSTIC.md
- docs/DELETE_BUTTON_FIX_COMPLETE.md
- docs/DELETE_BUTTON_WIRING_TEST.md
- docs/TIMELINE_SORTING_AND_DATA_AUDIT.md
- docs/UX_POLISH_FIXES.md
- docs/MARKER_HANDLING_AND_SAVED_LOCATIONS.md
- docs/SMART_NORMALIZATION_DATA_AUDIT.md
- docs/HISTORICAL_NORMALIZATION_COMPLETE.md
- docs/HISTORICAL_NORMALIZATION_SCRIPT.sql
- docs/HISTORICAL_NORMALIZATION_ROLLBACK.sql
- docs/IMAGE_UPLOAD_FEATURE.md

**Migrations:** 1 file (DUPLICATE - should be deleted)
- migrations/20250131_create_bloodwork_schema.sql

---

### Outside Product (Connected) (9 files)

**UI Routes:** 4 files
- app/(tabs)/medical/bloodwork/index.tsx
- app/(tabs)/medical/bloodwork/new.tsx
- app/(tabs)/medical/bloodwork/[id].tsx
- app/(tabs)/medical/bloodwork/edit/[id].tsx

**Shared Services:** 1 file
- services/user-preferences.service.ts

**Edge Functions:** 1 file
- supabase/functions/analyze-bloodwork-image/index.ts

**Migrations:** 3 files (2 duplicates)
- supabase/migrations/20260131133451_create_bloodwork_schema.sql (✅ keep)
- supabase/migrations/20260131175343_20260131133451_create_bloodwork_schema.sql (❌ delete)
- supabase/migrations/20260201044607_create_user_preferences_table.sql (✅ keep)

---

### Database Objects

**Tables Owned:** 2
- blood_tests
- blood_markers

**Tables Shared:** 1
- user_preferences (bloodwork currently only user)

**Functions:** 1
- update_updated_at_column() (shared infrastructure)

**RLS Policies:** 11 total
- 4 on blood_tests
- 4 on blood_markers
- 3 on user_preferences

**Triggers:** 2
- update_blood_tests_updated_at
- update_blood_markers_updated_at

---

**END OF AUDIT**
