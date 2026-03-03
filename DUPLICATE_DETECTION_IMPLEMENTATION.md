# Duplicate Detection Implementation

## Overview

Implemented comprehensive duplicate detection to handle reminder letters without creating duplicate data in the system. This prevents appointment reminders, duplicate diagnoses, and repeated care team contacts from polluting the user's timeline.

## Problem Solved

Healthcare providers frequently send:
- Initial appointment letters
- One or more reminder letters for the same appointment/test
- Follow-up notifications

Without duplicate detection, each letter would create:
- ❌ Duplicate appointments
- ❌ Duplicate timeline events
- ❌ Duplicate care team contacts
- ❌ Repeated "new information" noise for users

## Implementation Details

### 1. Duplicate Appointment Detection

**File:** `products/condition/services/letter-prepopulation.service.ts`

**Method:** `checkDuplicateAppointment()`

**Detection Logic:**
- Queries appointments within ±24 hours of the proposed appointment (broad search)
- Matches on ALL of:
  - Same event_category (investigation/diagnosis/treatment/administrative)
  - Similar time (within **15 minutes**)
  - Description overlap (first 30 characters similarity)
- Returns `true` if duplicate found, `false` otherwise

**Time Tolerance:**
- Search window: ±24 hours (to find potential matches)
- Duplicate threshold: **15 minutes** (to distinguish true duplicates from reschedules)

**Critical Edge Case Handling:**
- ✅ **True reminder** (14:30 → 14:30): 0 min difference → **Duplicate, skipped**
- ✅ **Formatting variation** (14:30 → 14:32): 2 min difference → **Duplicate, skipped**
- ✅ **Reschedule** (14:30 → 15:00): 30 min difference → **NOT duplicate, created**
- ✅ **Large reschedule** (14:30 → 16:00): 90 min difference → **NOT duplicate, created**

### 2. Duplicate Diagnosis Detection

**File:** `products/condition/services/letter-prepopulation.service.ts`

**Method:** `checkDuplicateDiagnosis()`

**Detection Logic:**
- Queries diagnoses on the exact same date
- Matches on:
  - Normalized diagnosis name (case-insensitive, trimmed)
  - Substring matching (handles variations in phrasing)
- Returns `true` if duplicate found, `false` otherwise

### 3. Idempotent Prepopulation

**Modified:** `prepopulateFromLetter()` method

**Behavior:**
- Checks for duplicates BEFORE inserting any data
- If duplicate detected:
  - ✅ Skips the insert
  - ✅ Increments `duplicates_skipped` counter
  - ✅ Continues processing other items
  - ❌ Does NOT create duplicate records
  - ❌ Does NOT throw errors

**Result Tracking:**
```typescript
interface PrepopulationResult {
  timeline_created: number;      // New events added
  contacts_created: number;       // New contacts added
  questions_created: number;      // New questions added
  duplicates_skipped: number;     // Duplicates detected and skipped
  errors: string[];               // Any errors encountered
}
```

### 4. User-Facing Display

**File:** `app/(tabs)/medical/condition/letters/[id].tsx`

**Changes:**
- Displays prepopulation result after processing
- Shows count of new items added
- **Crucially:** Shows count of duplicates skipped with clear messaging

**UI States:**

**Before Processing:**
```
AI Extracted Data
• 1 timeline event
• 1 care team contact
• 3 consultation questions

[Review & Accept Suggestions]
```

**After Processing (No Duplicates):**
```
✓ Letter processed successfully
• 1 new event added to timeline
• 1 new contact added
• 3 questions added
```

**After Processing (With Duplicates):**
```
✓ Letter processed successfully
• 0 new events added to timeline
• 1 new contact added

ℹ️ 1 item was recognized as existing data and not duplicated
```

### 5. Data Persistence

**Storage:** Prepopulation result stored in `extraction_json.prepopulation_result`

**Benefits:**
- No schema changes required
- Uses existing JSONB column
- Queryable for analytics
- Preserved for audit trail

## Care Team Contacts (Already Handled)

The existing `checkDuplicateCareTeamMember()` method was already in place and correctly prevents duplicate contacts by matching on:
- user_id
- provider_name (exact match)
- role (exact match)

## Consultation Questions (Already Handled)

The existing `checkDuplicateQuestion()` method was already in place and correctly prevents duplicate questions by:
- Normalizing question text (lowercase, trimmed)
- Exact string matching
- Filtering by domain (condition)

## Verification Points

### ✅ No New Database Tables
- All changes use existing tables
- Only JSONB field updates

### ✅ No Schema Changes
- Uses existing `extraction_json` JSONB column
- No migrations required

### ✅ Idempotent Writes
- Duplicate appointments: Skipped
- Duplicate diagnoses: Skipped
- Duplicate contacts: Skipped (existing)
- Duplicate questions: Skipped (existing)

### ✅ User Experience
- Users see clear feedback when duplicates detected
- No duplicate data in timeline
- No duplicate appointments
- No duplicate contacts
- Silent success preferred, informative when needed

### ✅ Gemma Compatibility
- Gemma can reference appointments correctly
- No "new" framing for duplicate data
- Letter available for context, but no duplicate events

## Testing & Verification

### Automated Test Script

**File:** `test-duplicate-reschedule.js`

Comprehensive test covering all edge cases:
1. True reminder (same time)
2. Slight formatting variation (2 min difference)
3. Reschedule (30 min difference)
4. Large reschedule (90 min difference)

### Test Results (Verified 2026-02-05)

```
Step 4: Testing REMINDER letter detection (14:30)...
  Time difference: 0.0 minutes
  Similar time (<15 min): true
  → Is duplicate: true
✅ CORRECT: Reminder letter detected as DUPLICATE (will be skipped)

Step 5: Testing RESCHEDULE letter detection (15:00)...
  Time difference: 30.0 minutes
  Similar time (<15 min): false
  → Is duplicate: false
✅ CORRECT: Reschedule letter NOT detected as duplicate (will create new appointment)

Step 6: Testing SLIGHT TIME VARIATION (14:32)...
  Time difference: 2.0 minutes
  Similar time (<15 min): true
  → Is duplicate: true
✅ CORRECT: Slight time variation detected as DUPLICATE

Step 7: Testing LARGER RESCHEDULE (16:00)...
  Time difference: 90.0 minutes
  Similar time (<15 min): false
  → Is duplicate: false
✅ CORRECT: Large reschedule NOT detected as duplicate
```

**Result:** ✅ All edge cases passing

### Manual Testing Scenario

**Test Case:** Upload same appointment letter twice

**Expected Behavior:**

**First Upload:**
```
Result:
- timeline_created: 1
- contacts_created: 1
- questions_created: 3
- duplicates_skipped: 0
```

**Second Upload (Reminder):**
```
Result:
- timeline_created: 0
- contacts_created: 0
- questions_created: 0
- duplicates_skipped: 4
```

**Third Upload (Reschedule to different time):**
```
Result:
- timeline_created: 1
- contacts_created: 0 (already exists)
- questions_created: 0 (already exist)
- duplicates_skipped: 2
```

**Timeline View:** Shows 2 appointments (original + reschedule)
**Appointments View:** Shows 2 appointments (user can cancel the old one)
**Care Team View:** Still shows 1 contact (not duplicated)

## Edge Cases Handled

1. **Time Variations:** ±24 hour window catches slight date/time formatting differences
2. **Description Variations:** 30-character substring matching handles minor wording changes
3. **Multiple Reminders:** Each reminder is checked against all existing data
4. **Partial Duplicates:** If 2 of 3 items are duplicates, only the new 1 is added
5. **Mixed Content:** New content in reminder letter is still extracted and added

## Files Modified

1. `products/condition/services/letter-prepopulation.service.ts`
   - Added `checkDuplicateAppointment()`
   - Added `checkDuplicateDiagnosis()`
   - Updated `prepopulateFromLetter()` to use duplicate checks

2. `app/(tabs)/medical/condition/letters/review/[id].tsx`
   - Store prepopulation result in extraction_json

3. `app/(tabs)/medical/condition/letters/[id].tsx`
   - Display prepopulation result
   - Show duplicate detection stats
   - Added UI for processed data state

## Data Hygiene Benefits

- ✅ Clean timeline without duplicates
- ✅ Accurate appointment count
- ✅ No duplicate care team contacts
- ✅ Clear audit trail of what was skipped
- ✅ User confidence in system intelligence
- ✅ Reduced cognitive load (no manual deduplication needed)

## Monitoring & Observability

The `duplicates_skipped` counter in prepopulation results enables:
- Analytics on reminder letter frequency
- Detection of unusual duplicate patterns
- Quality assurance on extraction accuracy
- User behavior insights

## Future Enhancements (Out of Scope)

Possible improvements if needed:
- Fuzzy matching for provider names
- Machine learning for semantic similarity
- User confirmation UI for close matches
- Merge suggestions for near-duplicates

## Compliance Notes

- No PII in duplicate detection logs
- All checks use user-isolated queries (user_id filtering)
- RLS policies enforced on all queries
- No cross-user data leakage possible
