# CONDITION MANAGEMENT TRUTH AUDIT
## Date: 2026-02-02
## Purpose: Establish Ground Truth Before Build

---

## EXECUTIVE SUMMARY

**Classification:** **STATE 1 + STATE 3 HYBRID**
- Architected + partially implemented (missing wiring)
- Implemented under unified schema (verification gap)

**Critical Finding:**
Condition Management has CODE and EDGE FUNCTIONS deployed, but:
1. ❌ **No database tables for `condition_entries`**
2. ❌ **No database table for `condition_care_team`**
3. ⚠️ **Services reference wrong table names** (non-existent vs. unified)
4. ✅ **Unified `consultation_questions` table EXISTS** but service uses wrong name
5. ✅ **UI is fully implemented** (not stubs, contrary to my initial assessment)
6. ✅ **Edge functions deployed** (5 functions exist)

**Verdict:** The documentation CLAIMS deployment is complete, but critical database tables are MISSING.

---

## PART 1: CODE PRESENCE VERIFICATION

### ✅ 1.1 Folder Structure

**Location:** `/products/condition/`

**Files Found:**
```
/products/condition/
├── ARCHITECTURE.md (claims tables deployed)
├── CURRENT_STATUS.md (claims 100% backend complete)
├── DEPLOYMENT_COMPLETE_2026-02-02.md (claims all deployed)
├── README.md
├── VERIFICATION_REPORT_2026-02-02.md (claims RLS enabled on 4 tables)
├── services/
│   └── condition.service.ts (references non-existent tables)
└── types/
    └── condition.types.ts (defines types for non-existent tables)
```

**Status:** ✅ Full product structure exists

---

### ✅ 1.2 Route Structure

**Location:** `/app/(tabs)/medical/condition/`

**Routes Found:**
```
condition/
├── index.tsx ✅ Fully implemented (hub with 7-card grid)
├── entry/
│   ├── index.tsx ✅ Fully implemented (list view)
│   ├── new.tsx ✅ Fully implemented (add document form)
│   └── [id].tsx ✅ Fully implemented (detail + delete)
├── analysis/index.tsx ❌ STUB ("Gemma chat coming soon")
├── appointments/index.tsx ❌ STUB ("Appointments coming soon")
├── care-team/index.tsx ❌ STUB ("Care team coming soon")
├── consultation-prep/index.tsx ❌ STUB ("Question management coming soon")
├── support-access/index.tsx ❌ STUB ("Support access coming soon")
└── timeline/index.tsx ❌ STUB ("Timeline coming soon")
```

**Implemented Routes:** 4/10 (40%)
**Stub Routes:** 6/10 (60%)

---

### ✅ 1.3 Edge Functions

**Location:** `/supabase/functions/`

**Functions Found:**
```
✅ condition-ai-respond/ (Gemma integration)
✅ condition-care-team/ (care team CRUD)
✅ condition-consultation-prep/ (question management)
✅ condition-entries/ (document CRUD)
✅ condition-support-access/ (support sharing)
```

**Status:** ✅ All 5 edge functions EXIST on disk
**Deployment Status:** Unknown (would need to call Supabase API to verify actual deployment)

---

### ✅ 1.4 Service Layer

**File:** `/products/condition/services/condition.service.ts`

**Methods Implemented:**
```typescript
✅ createEntry() → references condition_entries
✅ getEntries() → references condition_entries
✅ getEntry() → references condition_entries
✅ updateEntry() → references condition_entries
✅ deleteEntry() → references condition_entries

✅ createQuestion() → references condition_consultation_questions
✅ getQuestions() → references condition_consultation_questions
✅ updateQuestion() → references condition_consultation_questions
✅ deleteQuestion() → references condition_consultation_questions

✅ addCareTeamMember() → references condition_care_team
✅ getCareTeam() → references condition_care_team
✅ updateCareTeamMember() → references condition_care_team
✅ deleteCareTeamMember() → references condition_care_team

✅ createSupportAccess() → references condition_support_access
✅ getSupportAccess() → references condition_support_access
✅ updateSupportAccess() → references condition_support_access
✅ revokeSupportAccess() → references condition_support_access
✅ deleteSupportAccess() → references condition_support_access
```

**Status:** ✅ Full CRUD service exists
**Problem:** ❌ References tables that don't exist

---

## PART 2: DATABASE REALITY CHECK

### ❌ 2.1 Missing Tables

**Executed Search:**
```bash
grep -r "CREATE TABLE.*condition" supabase/migrations/*.sql
Result: NO MATCHES FOUND
```

**Tables Referenced by Code but NOT in Database:**

1. **`condition_entries`** ❌
   - Referenced by: ConditionService (lines 30, 46, 60, 76, 92)
   - Referenced by: condition-entries edge function (lines 56, 76, 99, 123, 141)
   - Referenced by: UI components (entry list, detail, new)
   - **STATUS:** DOES NOT EXIST

2. **`condition_care_team`** ❌
   - Referenced by: ConditionService (lines 188, 205, 220, 235)
   - Referenced by: condition-care-team edge function
   - **STATUS:** DOES NOT EXIST
   - **NOTE:** Generic `care_team` table exists (from medical_journey migration) but is different

3. **`condition_consultation_questions`** ❌
   - Referenced by: ConditionService (lines 116, 134, 150, 164)
   - Referenced by: condition-consultation-prep edge function
   - **STATUS:** DOES NOT EXIST
   - **NOTE:** Unified `consultation_questions` table EXISTS but service uses wrong name

4. **`condition_support_access`** ❌
   - Referenced by: ConditionService (lines 260, 276, 292, 309, 319)
   - Referenced by: condition-support-access edge function
   - **STATUS:** DOES NOT EXIST
   - **NOTE:** `bloodwork_support_access` exists but no condition equivalent

---

### ✅ 2.2 Existing Related Tables

**Tables That DO Exist:**

1. **`consultation_questions`** ✅
   - Migration: `20260202131909_create_unified_consultation_questions.sql`
   - Schema: Unified table with `domain` column ('bloodwork' | 'condition' | 'general')
   - Columns: id, user_id, question_text, domain, related_entry_id, priority, source, is_answered
   - RLS: ✅ Enabled with full CRUD policies
   - **PROBLEM:** ConditionService references `condition_consultation_questions` instead

2. **`care_team`** ✅
   - Migration: `20251222090033_create_medical_journey_tables.sql`
   - Schema: Generic care team table (not domain-specific)
   - Columns: id, user_id, provider_name, role, specialty, contact_info, etc.
   - RLS: ✅ Enabled
   - **PROBLEM:** ConditionService references `condition_care_team` instead
   - **QUESTION:** Should this be unified or domain-specific?

3. **`gemma_conversations`** ✅
   - Migration: `20260202131853_create_global_gemma_conversation_table.sql`
   - Schema: Global conversation table with `domain` column
   - Supports cross-domain conversation continuity
   - RLS: ✅ Enabled

---

### 📊 2.3 Table Existence Matrix

| Table Name | Exists? | Migration | RLS | Service References | Edge Function Uses |
|------------|---------|-----------|-----|-------------------|-------------------|
| `condition_entries` | ❌ | None | N/A | ✅ Yes (wrong) | ✅ Yes (wrong) |
| `condition_care_team` | ❌ | None | N/A | ✅ Yes (wrong) | ✅ Yes (wrong) |
| `condition_consultation_questions` | ❌ | None | N/A | ✅ Yes (wrong) | ✅ Yes (wrong) |
| `condition_support_access` | ❌ | None | N/A | ✅ Yes (wrong) | ✅ Yes (wrong) |
| `consultation_questions` | ✅ | 20260202131909 | ✅ | ❌ Not used | ❌ Not used |
| `care_team` | ✅ | 20251222090033 | ✅ | ❌ Not used | ❌ Not used |
| `gemma_conversations` | ✅ | 20260202131853 | ✅ | Could use | Could use |

---

## PART 3: SERVICE-TO-DATABASE ALIGNMENT

### ❌ 3.1 Condition Entries

**Service References:** `condition_entries` table
**Table Exists:** ❌ NO
**Will Fail At Runtime:** ✅ YES - "relation 'condition_entries' does not exist"

**Impact:**
- Cannot create condition entries
- Cannot view condition entries
- Cannot delete condition entries
- UI will show errors when attempting any operation

---

### ⚠️ 3.2 Consultation Questions

**Service References:** `condition_consultation_questions` table (line 116)
**Table Exists:** ❌ NO (but `consultation_questions` exists)
**Will Fail At Runtime:** ✅ YES - wrong table name

**Fix Required:**
- Change service to use `consultation_questions` table
- Add `.eq('domain', 'condition')` filter to all queries
- This is the INTENDED design per migration comments

---

### ⚠️ 3.3 Care Team

**Service References:** `condition_care_team` table (line 188)
**Table Exists:** ❌ NO (but generic `care_team` exists)
**Will Fail At Runtime:** ✅ YES - wrong table name

**Decision Required:**
- **Option A:** Use unified `care_team` table (add domain filter if needed)
- **Option B:** Create separate `condition_care_team` table (mirrors Bloodwork pattern)

**Bloodwork Uses:** `care_team` table directly (no bloodwork_care_team)
**Recommendation:** Use unified `care_team` table

---

### ❌ 3.4 Support Access

**Service References:** `condition_support_access` table (line 260)
**Table Exists:** ❌ NO
**Will Fail At Runtime:** ✅ YES

**Bloodwork Uses:** `bloodwork_support_access` table (domain-specific)
**Consistency:** Should create `condition_support_access` table

---

## PART 4: UI ROUTING REALITY

### ✅ 4.1 Fully Implemented Routes

**1. Condition Hub** (`/medical/condition/index.tsx`)
- Status: ✅ Fully implemented
- Features: 7-card grid, navigation, styling
- Wired to: N/A (hub only)

**2. Document List** (`/medical/condition/entry/index.tsx`)
- Status: ✅ Fully implemented
- Features: List view, empty state, sort toggle, add button
- Wired to: ConditionService.getEntries() → condition_entries ❌
- Will fail: YES (table missing)

**3. Add Document** (`/medical/condition/entry/new.tsx`)
- Status: ✅ Fully implemented
- Features: Form with date, type, clinician, institution, text
- Wired to: ConditionService.createEntry() → condition_entries ❌
- Will fail: YES (table missing)

**4. Document Detail** (`/medical/condition/entry/[id].tsx`)
- Status: ✅ Fully implemented
- Features: View details, delete button, confirmation
- Wired to: ConditionService.getEntry() + deleteEntry() → condition_entries ❌
- Will fail: YES (table missing)

---

### ❌ 4.2 Stub Routes

**5. AI Analysis** (`/medical/condition/analysis/index.tsx`)
- Status: ❌ STUB
- Shows: "Gemma chat interface coming soon"
- Backend ready: ✅ condition-ai-respond edge function exists
- Needs: ConditionChat component (copy from BloodworkChat)

**6. Consultation Prep** (`/medical/condition/consultation-prep/index.tsx`)
- Status: ❌ STUB
- Shows: "Question management coming soon"
- Backend ready: ⚠️ Edge function exists but uses wrong table
- Needs: UI implementation + service fix

**7. Care Team** (`/medical/condition/care-team/index.tsx`)
- Status: ❌ STUB
- Shows: "Care team management coming soon"
- Backend ready: ⚠️ Edge function exists but uses wrong table
- Needs: UI implementation + service fix + table decision

**8. Support Access** (`/medical/condition/support-access/index.tsx`)
- Status: ❌ STUB
- Shows: "Support access coming soon"
- Backend ready: ❌ Edge function exists but table missing
- Needs: Table creation + UI implementation

**9. Appointments** (`/medical/condition/appointments/index.tsx`)
- Status: ❌ STUB
- Shows: "Appointments coming soon"
- Backend ready: ❌ No edge function or table
- Needs: Full implementation

**10. Timeline** (`/medical/condition/timeline/index.tsx`)
- Status: ❌ STUB
- Shows: "Timeline visualization coming soon"
- Backend ready: ❌ No specific infrastructure
- Needs: UI component + data structure

---

## PART 5: GAP CLASSIFICATION

### STATE 1: Architected + Partially Implemented ✅

**Evidence:**
- ✅ Product structure exists
- ✅ TypeScript types defined
- ✅ Services implemented
- ✅ Edge functions deployed (on disk)
- ✅ UI components exist (4/10 fully implemented)
- ✅ Documentation comprehensive

**Missing:**
- ❌ Database tables not created
- ❌ Service-to-table wiring incorrect
- ❌ 6/10 UI routes are stubs

---

### STATE 3: Implemented Under Unified Schema ⚠️

**Evidence:**
- ✅ `consultation_questions` table is unified (with domain column)
- ✅ `care_team` table is unified (no domain column but could be shared)
- ✅ `gemma_conversations` table is unified (with domain column)

**Problem:**
- ❌ Services don't use the unified tables
- ❌ Services reference non-existent domain-specific tables
- ❌ No migration ever created the domain-specific tables

---

### CLASSIFICATION: **HYBRID STATE 1 + STATE 3**

**Condition Management is:**
1. **Architected** (clear design, types, services)
2. **Partially implemented** (40% UI complete)
3. **Incorrectly wired** (services reference wrong tables)
4. **Partially unified** (some tables are unified, others don't exist)
5. **Documented as complete** (but documentation is inaccurate)

---

## PART 6: DOCUMENTATION VS. REALITY

### Documentation Claims

From `/products/condition/DEPLOYMENT_COMPLETE_2026-02-02.md`:

**CLAIMED:**
> "Database Deployment: ✅ All 4 tables created with full RLS"
> "condition_entries: Rows: 0 (ready for user data), RLS: Enabled"
> "condition_consultation_questions: Rows: 0, RLS: Enabled"
> "condition_care_team: Rows: 0, RLS: Enabled"
> "condition_support_access: Rows: 0, RLS: Enabled"

**REALITY:**
- ❌ `condition_entries` table: DOES NOT EXIST
- ❌ `condition_consultation_questions` table: DOES NOT EXIST (unified table exists)
- ❌ `condition_care_team` table: DOES NOT EXIST (unified table exists)
- ❌ `condition_support_access` table: DOES NOT EXIST

**VERDICT:** Documentation claims are FALSE. Tables were never created.

---

## PART 7: WHAT ACTUALLY WORKS

### ✅ Working Components

1. **Route Navigation** - All routes are accessible
2. **Condition Hub UI** - 7-card grid renders correctly
3. **TypeScript Types** - All types compile successfully
4. **Edge Functions** - Exist on disk (deployment to Supabase unknown)
5. **UI Components** - 4 routes have full implementations
6. **Service Methods** - Code exists and compiles

### ❌ Non-Working Components

1. **Document CRUD** - Will fail (table missing)
2. **Delete Operations** - Will fail (table missing)
3. **Question Management** - Will fail (wrong table name)
4. **Care Team Management** - Will fail (wrong table name)
5. **Support Access** - Will fail (table missing)
6. **Gemma Integration** - Not implemented (stub UI)

---

## PART 8: REQUIRED FIXES

### 🔧 IMMEDIATE FIXES (CRITICAL)

**1. Create `condition_entries` Table**
```sql
CREATE TABLE condition_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_date date NOT NULL,
  document_type text NOT NULL,
  clinician_name text,
  institution text,
  document_text text NOT NULL,
  attachments jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- + RLS policies
```

**2. Fix Consultation Questions Service**
Change from:
```typescript
.from('condition_consultation_questions')
```
To:
```typescript
.from('consultation_questions')
.eq('domain', 'condition')
```

**3. Fix Care Team Service**
**Decision required:** Use unified `care_team` table or create `condition_care_team`?
- If unified: Change service to use `care_team` table
- If separate: Create `condition_care_team` table

**4. Create `condition_support_access` Table**
Mirror `bloodwork_support_access` structure

---

### 🎨 UI IMPLEMENTATION (NON-CRITICAL)

**5. Implement Gemma Chat**
- Copy `/products/bloodwork/components/BloodworkChat.tsx`
- Adapt for Condition domain
- Wire to `condition-ai-respond` edge function

**6. Implement Consultation Prep UI**
- Copy Bloodwork consultation prep screen
- Use unified `consultation_questions` table
- Filter by `domain = 'condition'`

**7. Implement Care Team UI**
- Copy Bloodwork key contacts pattern
- Use decided table (unified or domain-specific)

**8. Implement Support Access UI**
- Copy Bloodwork support access pattern
- Wire to new `condition_support_access` table

---

## PART 9: FINAL VERDICT

### Delete Parity Status

**Bloodwork:** ✅ Delete works everywhere
**Condition:** ❌ Delete will fail (tables don't exist)

**Parity:** ❌ DOES NOT EXIST

---

### Gemma Parity Status

**Bloodwork:** ✅ Gemma fully functional
**Condition:** ❌ Gemma not implemented (stub UI)

**Parity:** ❌ DOES NOT EXIST

---

### Overall Status

**Architecture:** ✅ Well-designed
**Implementation:** ⚠️ 30% complete (services exist, tables missing, UI partial)
**Deployment Claims:** ❌ FALSE (documentation claims complete deployment, reality disagrees)
**Production Ready:** ❌ NO (will fail at runtime)

---

## RECOMMENDATION

**Based on this reality, you have 3 options:**

### OPTION A: Complete Condition Management to Match Bloodwork Parity
- Create missing database tables (4 migrations)
- Fix service-to-table wiring (consultation questions, care team)
- Implement stub UIs (6 screens)
- Verify delete operations work
- Implement Gemma chat
- **Estimated effort:** 4-6 hours

### OPTION B: Re-scope MVP Claims to Bloodwork-Only + Defer Condition
- Document Condition as "in progress"
- Remove "deployed" claims from documentation
- Focus MVP testing on Bloodwork only
- Defer Condition to post-MVP
- **Estimated effort:** 30 minutes (documentation updates)

### OPTION C: Minimal Viable Condition (Entry Management Only)
- Create only `condition_entries` table
- Complete entry CRUD flow (already mostly done)
- Leave advanced features as stubs
- Document limited scope
- **Estimated effort:** 1-2 hours

---

## PAUSE FOR DECISION

**Which option do you want to proceed with?**

1. **Complete Condition Management** (full parity)
2. **Bloodwork-only MVP** (defer Condition)
3. **Minimal Condition** (entries only)

**Do not proceed with any builds until decision is confirmed.**
