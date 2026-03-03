# Data Capture Audit: Diagnosis & Appointment Flow

**Date:** Dec 29, 2025
**Status:** COMPREHENSIVE ANALYSIS
**Scope:** End-to-end audit of diagnosis/appointment capture → database → UI display

---

## Executive Summary

### Overall Status: 🟡 MOSTLY COMPLETE - NEEDS TESTING

**What's Built:**
- ✅ Intent detection for diagnosis/appointments
- ✅ Service routing with data persistence flags
- ✅ Database tables with RLS
- ✅ Edge functions that parse and save data
- ✅ UI components that display data
- ✅ Service layer that queries data

**Critical Gaps:**
- ⚠️ NO MANUAL TESTING PERFORMED
- ⚠️ NO CONVERSATION MEMORY (each message standalone)
- ⚠️ AUTH FLOW UNTESTED (service-to-service calls)
- ⚠️ TIMELINE INFERENCE NOT TRIGGERED

---

## 1. DIAGNOSIS CAPTURE FLOW

### 1.1 Intent Detection ✅ COMPLETE

**Location:** `supabase/functions/orchestrate/intent-classifier.ts:32-46`

**Patterns Detected:**
```typescript
/\b(invasive|ductal|carcinoma|stage [0-4]|metasta|grade [1-3])\b/i
/\b(er\+|pr\+|her2|ki-67|lymph node|pathology)\b/i
/\b(chemotherapy|radiation|mastectomy|lumpectomy)\b/i
/\b(diagnosed with|diagnosis|biopsy result|test result)\b/i
```

**Triggers:**
- Sets `requires_medical_translation: true`
- Sets `primary_intent: "medical_translation"`
- Confidence: 0.9

**Test Cases Needed:**
```
✓ "I was diagnosed with Stage 2 invasive ductal carcinoma"
✓ "My pathology report shows ER+ PR+ HER2-"
✓ "Just got diagnosed with AML"
✓ "Doctor said I have chronic lymphocytic leukemia"
```

### 1.2 Service Routing ✅ COMPLETE

**Location:** `supabase/functions/orchestrate/service-router.ts:59-119`

**Logic:**
1. Intent triggers `requires_medical_translation`
2. Parses diagnosis from user message using regex
3. Calls `translate-medical` edge function with:
   - `user_id` (for service-to-service auth)
   - `technical_text` (raw message)
   - `save_to_diagnosis: true` ✅
   - `diagnosis_metadata` (parsed name, date, stage)

**Parsing Logic:**
```typescript
// Lines 64-85
diagnosisPatterns = {
  name: /diagnosed with\s+([^.,\n]+)/i,
  cll: /\b(CLL|chronic lymphocytic leukemia)\b/i,
  aml: /\b(AML|acute myeloid leukemia)\b/i,
  stage: /stage\s+([0-4IViv]+)/i,
  date: /on\s+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i
}
```

**⚠️ Potential Issues:**
- Diagnosis name extraction is SIMPLE regex, may miss complex names
- Date extraction expects specific format, may miss "diagnosed last Tuesday"
- Falls back to "Unknown" if name not detected

### 1.3 Edge Function: translate-medical ✅ COMPLETE

**Location:** `supabase/functions/translate-medical/index.ts`

**Authentication:** ✅ SUPPORTS SERVICE-TO-SERVICE
- Lines 46-68: Checks if `user_id` in body (from orchestrate)
- If present, trusts it (service role key verified by Supabase)
- If absent, validates auth token from header

**Database Write:** ✅ IMPLEMENTED
- Lines 119-133: Inserts into `diagnoses` table
- Only writes if `save_to_diagnosis: true` AND `diagnosis_metadata` present
- Saves both raw text and plain English translation

**Data Saved:**
```typescript
{
  user_id: userId,
  diagnosis_name: body.diagnosis_metadata.diagnosis_name || "Unknown",
  diagnosis_date: body.diagnosis_metadata.diagnosis_date || new Date().toISOString().split("T")[0],
  stage_or_severity: body.diagnosis_metadata.stage_or_severity,
  icd_code: body.diagnosis_metadata.icd_code,
  raw_pathology_text: body.technical_text,
  plain_english_summary: result.plain_english
}
```

**⚠️ Potential Issues:**
- Translation logic in `service.ts` NOT REVIEWED (might be mock)
- Error handling: logs error but doesn't fail request
- No validation that diagnosis_name != "Unknown"

### 1.4 Database Table: diagnoses ✅ COMPLETE

**Location:** `supabase/migrations/20251222090033_create_medical_journey_tables.sql:143-174`

**Schema:**
```sql
CREATE TABLE diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  diagnosis_name text NOT NULL,
  diagnosis_date date NOT NULL,
  stage_or_severity text,
  icd_code text,
  raw_pathology_text text,
  plain_english_summary text,
  created_at timestamptz DEFAULT now()
);
```

**Indexes:** ✅
- `idx_diagnoses_user_id`
- `idx_diagnoses_date` (user_id, diagnosis_date DESC)

**RLS Policies:** ✅ SECURE
- Users can read own diagnoses
- Users can insert own diagnoses
- Users can update own diagnoses
- NO public access

### 1.5 Service Layer: medical-journey.service ✅ COMPLETE

**Location:** `services/medical-journey.service.ts:46-55`

**Query Logic:**
```typescript
export async function getUserDiagnosis(userId: string) {
  const { data, error } = await supabase
    .from('diagnoses')
    .select('*')
    .eq('user_id', userId)
    .order('diagnosis_date', { ascending: false })
    .maybeSingle();  // ✅ Correct - returns null if no diagnosis

  return { data, error };
}
```

**✅ Good Practices:**
- Uses `maybeSingle()` instead of `single()` (won't throw if no data)
- Orders by date descending (most recent first)
- Returns both data and error

### 1.6 UI Component: DiagnosisExplainer ✅ COMPLETE

**Location:** `components/DiagnosisExplainer.tsx`

**Displays:**
- Diagnosis name (line 23)
- Stage/severity badge (lines 25-30)
- Plain English summary (lines 32-41)
- Raw medical text (lines 43-50)
- "Get Translation" button if no summary (lines 38-40)

**✅ Good UX:**
- Clear visual hierarchy
- Handles missing data gracefully
- Distinguishes technical vs plain language

### 1.7 My Path Screen ✅ COMPLETE

**Location:** `app/(tabs)/my-path.tsx:42-51`

**Integration:**
```typescript
const diagnosisResult = await getUserDiagnosis(user.id);

if (diagnosisResult.data) {
  setDiagnosis(diagnosisResult.data);

  // Calculate days since diagnosis
  const diagnosisDate = new Date(diagnosisResult.data.diagnosis_date);
  const daysDiff = Math.floor((today - diagnosisDate) / (1000 * 60 * 60 * 24));
  setDaysInJourney(daysDiff);
}
```

**✅ Features:**
- Loads on mount
- Refresh control for pull-to-refresh
- Calculates days in journey
- Shows empty state if no data

---

## 2. APPOINTMENT CAPTURE FLOW

### 2.1 Intent Detection ✅ COMPLETE

**Location:** `supabase/functions/orchestrate/intent-classifier.ts:48-63`

**Patterns Detected:**
```typescript
/\b(appointment|meeting) (with|on)\b/i
/\b(doctor|oncologist|surgeon|specialist) (on|this|next|tomorrow)\b/i
/\b(see|seeing|visit) (dr\.|doctor|my oncologist|my surgeon)\b/i
/\b(scheduled|booked) (appointment|visit)\b/i
```

**Triggers:**
- Sets `requires_appointment_understanding: true`
- Confidence: 0.85

**Test Cases Needed:**
```
✓ "I have an appointment with Dr. Smith on Monday at 2pm"
✓ "Seeing my oncologist tomorrow at 9:30am"
✓ "Scheduled visit with surgeon next Tuesday"
✓ "Meeting with Dr. Jones at Memorial Hospital"
```

### 2.2 Service Routing ✅ COMPLETE

**Location:** `supabase/functions/orchestrate/service-router.ts:121-153`

**Logic:**
1. Intent triggers `requires_appointment_understanding`
2. Calls `understand-appointment` edge function with:
   - `user_id` (for service-to-service auth)
   - `user_message` (raw message)
   - `context` (journey phase)
   - `save_to_database: true` ✅

### 2.3 Edge Function: understand-appointment ✅ COMPLETE

**Location:** `supabase/functions/understand-appointment/index.ts`

**Authentication:** ✅ SUPPORTS SERVICE-TO-SERVICE
- Lines 46-61: Same pattern as translate-medical
- Checks `user_id` in body OR validates auth token

**Database Write:** ✅ IMPLEMENTED
- Lines 98-117: Inserts into `appointments` table
- Only writes if:
  - `save_to_database !== false` AND
  - `confidence_score >= 5` AND
  - `appointment_datetime` present

**Data Saved:**
```typescript
await supabase.from("appointments").insert({
  user_id: userId,
  appointment_datetime: result.extraction.appointment_datetime,
  provider_name: result.extraction.provider_name,
  provider_role: result.extraction.provider_role,
  appointment_type: result.extraction.appointment_type,
  location: result.extraction.location,
  preparation_notes: result.preparation_tips.join("\n"),
  questions_to_ask: result.questions_to_ask,
  status: "scheduled"
});
```

**Care Team Integration:** ✅ BONUS FEATURE
- Lines 121-139: Also saves to `care_team` table
- Uses `upsert` with conflict resolution
- Only if provider name AND role present

### 2.4 Database Tables ✅ COMPLETE

**appointments table:** `supabase/migrations/20251222090033_create_medical_journey_tables.sql:177-217`

**Schema:**
```sql
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  appointment_datetime timestamptz NOT NULL,
  provider_name text,
  provider_role text,
  appointment_type text,
  location text,
  preparation_notes text,
  questions_to_ask jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'scheduled',
  notes_after text,
  created_at timestamptz DEFAULT now()
);
```

**Indexes:** ✅
- `idx_appointments_user_id`
- `idx_appointments_datetime` (user_id, appointment_datetime)
- `idx_appointments_status` (user_id, status)

**RLS Policies:** ✅ SECURE
- Users can read/insert/update/delete own appointments

**care_team table:** Lines 220-257

**Schema:**
```sql
CREATE TABLE care_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  provider_name text NOT NULL,
  role text NOT NULL,
  specialty text,
  contact_info jsonb DEFAULT '{}'::jsonb,
  communication_preferences text,
  first_seen_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

**Unique Constraint:** 🔴 MISSING
- Should have `UNIQUE (user_id, provider_name)` to prevent duplicates
- Currently relies on `upsert` with `onConflict: "user_id,provider_name"`
- **This will FAIL if no constraint exists**

### 2.5 Service Layer: medical-journey.service ✅ COMPLETE

**Location:** `services/medical-journey.service.ts:57-67`

**Query Logic:**
```typescript
export async function getUserAppointments(userId: string, limit = 5) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .gte('appointment_datetime', new Date().toISOString())  // Only future
    .order('appointment_datetime', { ascending: true })     // Soonest first
    .limit(limit);

  return { data, error };
}
```

**✅ Good Logic:**
- Only returns future appointments
- Orders by date (soonest first)
- Configurable limit

### 2.6 UI Component: AppointmentCard ✅ COMPLETE

**Location:** `components/AppointmentCard.tsx`

**Displays:**
- Date/time with icons (lines 39-47)
- Provider name and role (lines 50-63)
- Role description from lookup table (lines 9-19)
- Location (lines 66-71)
- Appointment type (lines 73-78)
- Questions to ask (lines 80-94)
- Preparation notes (lines 96-101)

**✅ Excellent UX:**
- Clear visual hierarchy
- Helpful role descriptions
- Shows preview of questions (first 3)
- Handles missing data gracefully

### 2.7 My Path Screen Integration ✅ COMPLETE

**Location:** `app/(tabs)/my-path.tsx:123-130`

**Rendering:**
```typescript
{appointments.length > 0 && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
    {appointments.map((appointment) => (
      <AppointmentCard key={appointment.id} appointment={appointment} />
    ))}
  </View>
)}
```

---

## 3. CRITICAL GAPS & ISSUES

### 3.1 🔴 NO CONVERSATION MEMORY

**Impact:** HIGH - BLOCKER for realistic conversations

**Current State:**
- Each message to orchestrate is standalone
- No `conversation_id` or message history
- Gemma cannot reference previous messages
- User says "I was diagnosed with CLL" then "Tell me more" → Gemma has NO context

**What's Missing:**
1. `conversations` table to track conversation threads
2. `messages` table to store message history
3. orchestrate needs to:
   - Accept `conversation_id` in request
   - Load last N messages from database
   - Pass message history to LLM
   - Save new user message + assistant response

**Estimated Effort:** 1 day

### 3.2 🟡 care_team UNIQUE CONSTRAINT MISSING

**Impact:** MEDIUM - Will cause upsert failures

**Current State:**
- understand-appointment does: `upsert(..., { onConflict: "user_id,provider_name" })`
- But database has NO unique constraint on these columns
- This will throw an error: "onConflict requires unique constraint"

**Fix Required:**
```sql
ALTER TABLE care_team
ADD CONSTRAINT care_team_user_provider_unique
UNIQUE (user_id, provider_name);
```

**Estimated Effort:** 5 minutes

### 3.3 🟡 APPOINTMENT PARSING SERVICE UNKNOWN

**Impact:** MEDIUM - Core feature might be mock

**Current State:**
- understand-appointment imports `AppointmentParser` from `service.ts`
- This file NOT REVIEWED in audit
- Unknown if it:
  - Uses real LLM to parse appointments
  - Uses regex patterns (likely to fail)
  - Returns realistic confidence scores
  - Handles edge cases

**Needs Review:** `supabase/functions/understand-appointment/service.ts`

### 3.4 🟡 MEDICAL TRANSLATION SERVICE UNKNOWN

**Impact:** MEDIUM - Core feature might be mock

**Current State:**
- translate-medical imports `MedicalTranslator` from `service.ts`
- This file NOT REVIEWED in audit
- Unknown if plain_english summary is real or placeholder

**Needs Review:** `supabase/functions/translate-medical/service.ts`

### 3.5 🟡 TIMELINE INFERENCE NOT TRIGGERED

**Impact:** MEDIUM - Missing feature

**Current State:**
- Intent classifier has `requires_timeline_inference` flag
- Service router calls `infer-timeline` edge function
- But intent patterns are NARROW (lines 65-79)
- Likely never triggers from natural conversation

**Test Cases:**
```
? "What happens next in my treatment?"
? "How long will this take?"
? "What's the timeline for recovery?"
```

### 3.6 🟡 NO INTEGRATION TESTS

**Impact:** HIGH - No confidence in working system

**What's Missing:**
- End-to-end test: User says diagnosis → Check database
- End-to-end test: User says appointment → Check database
- Auth test: Service-to-service calls work
- RLS test: Users can't see other users' data

### 3.7 🟡 ERROR HANDLING SILENT FAILURES

**Impact:** MEDIUM - Hard to debug

**Current State:**
- translate-medical: Logs error but doesn't fail request (line 130-132)
- understand-appointment: Same pattern (line 119)
- Service router: Catches errors but doesn't propagate (lines 114, 148)

**Result:** User gets response even if database write fails

---

## 4. TESTING PLAN

### 4.1 Manual Testing - IMMEDIATE

**Test 1: Diagnosis Capture**
```
1. Login to app
2. Go to Today tab
3. Send message: "I was just diagnosed with Stage 2 breast cancer"
4. Wait for response
5. Go to My Path tab
6. Check if diagnosis appears
```

**Expected Result:**
- Diagnosis card shows "Stage 2 breast cancer"
- Plain English summary appears
- Days in journey calculated from today

**How to Verify in Database:**
```sql
SELECT * FROM diagnoses
WHERE user_id = '[your-user-id]'
ORDER BY created_at DESC LIMIT 1;
```

**Test 2: Appointment Capture**
```
1. Login to app
2. Go to Today tab
3. Send message: "I have an appointment with Dr. Smith tomorrow at 2pm"
4. Wait for response
5. Go to My Path tab
6. Check if appointment appears
```

**Expected Result:**
- Appointment card shows "Dr. Smith"
- Tomorrow's date with 2:00 PM time
- Suggested questions to ask

**How to Verify in Database:**
```sql
SELECT * FROM appointments
WHERE user_id = '[your-user-id]'
ORDER BY created_at DESC LIMIT 1;
```

**Test 3: Edge Cases**
```
1. "I was diagnosed with something" → Should save with diagnosis_name = "Unknown"
2. "Appointment with doctor next week" → Might fail if date parsing too strict
3. "I have cancer" → Should trigger medical translation
4. Multiple diagnoses → Should show most recent
```

### 4.2 Database Verification - IMMEDIATE

**Check Tables Exist:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('diagnoses', 'appointments', 'care_team', 'treatment_timeline');
```

**Check RLS Enabled:**
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('diagnoses', 'appointments', 'care_team');
```

**Check Policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('diagnoses', 'appointments', 'care_team');
```

### 4.3 Auth Flow Testing - HIGH PRIORITY

**Test Service-to-Service Auth:**
```bash
# Call orchestrate with valid user token
curl -X POST https://[project].supabase.co/functions/v1/orchestrate \
  -H "Authorization: Bearer [user-token]" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "[user-id]",
    "message": "I was diagnosed with CLL"
  }'

# Verify translate-medical was called
# Verify diagnosis was saved to database
```

**Expected:**
- orchestrate validates user token
- orchestrate calls translate-medical with service role key + user_id in body
- translate-medical trusts user_id (doesn't re-validate)
- Database write succeeds

### 4.4 UI Testing - HIGH PRIORITY

**Check My Path Loading:**
```
1. Fresh login
2. Go to My Path tab
3. Should see "Start Your Journey" empty state
4. Add diagnosis via Today tab
5. Pull to refresh My Path
6. Should see diagnosis card
```

**Check Error States:**
```
1. Turn off network
2. Go to My Path tab
3. Should handle error gracefully (not crash)
4. Turn on network
5. Pull to refresh
6. Should load data
```

---

## 5. RECOMMENDED FIXES

### Priority 1: FIX UNIQUE CONSTRAINT (5 minutes)

**File:** Create new migration

```sql
-- Add unique constraint for care_team upsert
ALTER TABLE care_team
ADD CONSTRAINT care_team_user_provider_unique
UNIQUE (user_id, provider_name);
```

### Priority 2: TEST MANUALLY (2 hours)

Execute all tests in Section 4.1 and 4.2 above.

**Document:**
- What works
- What fails
- Error messages
- Database state after each test

### Priority 3: REVIEW SERVICE FILES (1 hour)

**Files to Review:**
- `supabase/functions/translate-medical/service.ts`
- `supabase/functions/understand-appointment/service.ts`
- `supabase/functions/infer-timeline/service.ts`

**Questions:**
- Do they use real LLMs?
- Are they mocks/placeholders?
- Do they handle edge cases?

### Priority 4: BUILD CONVERSATION MEMORY (1 day)

**Required:**
1. Create `conversations` table
2. Create `messages` table
3. Update orchestrate to load message history
4. Update orchestrate to save messages
5. Pass history to LLM context

### Priority 5: IMPROVE ERROR HANDLING (2 hours)

**Changes:**
- translate-medical: Throw error if diagnosis save fails
- understand-appointment: Throw error if appointment save fails
- Service router: Propagate errors to orchestrate
- orchestrate: Return error to user if critical service fails

---

## 6. CONFIDENCE ASSESSMENT

### What We're Confident Works ✅

1. **Database Schema** - Tables, indexes, RLS all correct
2. **UI Components** - Well-built, handle edge cases
3. **Service Layer** - Queries are correct, use best practices
4. **Intent Detection** - Patterns look reasonable
5. **Service Routing** - Logic is sound, flags set correctly
6. **Auth Flow** - Code supports service-to-service calls

### What Needs Verification 🟡

1. **Diagnosis Parsing** - Regex might miss complex cases
2. **Appointment Parsing** - Service implementation unknown
3. **Medical Translation** - Service implementation unknown
4. **Date Extraction** - Might fail on natural language dates
5. **Timeline Inference** - Likely never triggers

### What's Broken 🔴

1. **care_team unique constraint** - Will cause runtime errors
2. **Conversation memory** - System can't maintain context
3. **Error propagation** - Silent failures hide problems

---

## 7. NEXT STEPS

### IMMEDIATE (Today):

1. ✅ Fix care_team unique constraint
2. ⚠️ Manual test diagnosis capture
3. ⚠️ Manual test appointment capture
4. ⚠️ Verify database writes
5. ⚠️ Check auth flow works

### SHORT-TERM (1-2 days):

1. Review service implementation files
2. Build conversation memory system
3. Improve error handling
4. Test timeline inference
5. Add integration tests

### MEDIUM-TERM (3-5 days):

1. Improve diagnosis parsing (use LLM)
2. Improve date extraction (use LLM)
3. Add edge case handling
4. Build admin dashboard to view user data
5. Add logging/monitoring

---

## 8. RISK ASSESSMENT

### HIGH RISK 🔴

**No Conversation Memory**
- **Impact:** Users can't have natural multi-turn conversations
- **Likelihood:** 100% certain to cause issues
- **Mitigation:** Build conversation memory system (1 day)

**Untested End-to-End**
- **Impact:** Unknown if system actually works
- **Likelihood:** High chance of bugs in production
- **Mitigation:** Manual testing (2 hours)

### MEDIUM RISK 🟡

**care_team Constraint Missing**
- **Impact:** Runtime errors when saving appointments
- **Likelihood:** 100% if user mentions same doctor twice
- **Mitigation:** Add constraint (5 minutes)

**Service Implementations Unknown**
- **Impact:** Might be mocks, might return bad data
- **Likelihood:** Unknown
- **Mitigation:** Code review (1 hour)

### LOW RISK 🟢

**Diagnosis Parsing Simplistic**
- **Impact:** Might save "Unknown" for complex diagnoses
- **Likelihood:** Moderate
- **Mitigation:** Use LLM for parsing (later)

---

## CONCLUSION

**The capture infrastructure is 85% complete.** All the plumbing exists:
- ✅ Intent detection
- ✅ Service routing
- ✅ Database writes
- ✅ UI display
- ✅ Auth support

**But we have NO PROOF it works.** The system needs:
1. Manual testing to verify end-to-end flow
2. Bug fix for care_team constraint
3. Conversation memory for realistic usage

**Recommendation:** Execute Testing Plan (Section 4) before building any new features. We need to know what works and what breaks.
