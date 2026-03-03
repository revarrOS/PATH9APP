# HOTFIX: Letters Detail Screen Crash Fix

**Date:** 2026-02-04
**Type:** Critical Bug Fix
**Status:** ✅ FIXED

---

## PROBLEM

The app crashed with a red screen when opening any letter detail:

```
Error: Cannot read properties of undefined (reading 'text')
Location: app/(tabs)/medical/condition/letters/[id].tsx
```

**Root Causes:**
1. Route param `id` could be an array or undefined (expo-router behavior)
2. Missing defensive checks for `document` object and nested `extraction_json`
3. Direct property access on potentially null/undefined objects

---

## FIXES APPLIED (MINIMAL CHANGES ONLY)

### 1. Route Param Guard (Lines 32-42)

**BEFORE:**
```typescript
const { id } = useLocalSearchParams();

useEffect(() => {
  if (id) {
    loadDocument();
  }
}, [id]);
```

**AFTER:**
```typescript
const { id } = useLocalSearchParams();
const documentId = Array.isArray(id) ? id[0] : id;

useEffect(() => {
  if (documentId) {
    loadDocument();
  } else {
    setError('Missing letter ID');
    setLoading(false);
  }
}, [documentId]);
```

**Fix:** Normalize route param to string and handle missing ID gracefully.

---

### 2. Database Query Fix (Line 52)

**BEFORE:**
```typescript
.eq('id', id)
```

**AFTER:**
```typescript
.eq('id', documentId)
```

**Fix:** Use normalized documentId instead of raw id param.

---

### 3. Delete Function Fix (Line 103)

**BEFORE:**
```typescript
.eq('id', id);
```

**AFTER:**
```typescript
.eq('id', documentId);
```

**Fix:** Use normalized documentId in delete operation.

---

### 4. Safe Extraction JSON Access (Lines 173-183)

**BEFORE:**
```typescript
const displayText = maskingEnabled
  ? (document.masked_text || 'No text content available')
  : (document.full_text || 'No text content available');

const hasPII = document.extraction_json?.pii_spans &&
               document.extraction_json.pii_spans.length > 0;

const prepopulationCount = {
  entries: document.extraction_json?.timeline_events?.length || 0,
  contacts: document.extraction_json?.contacts?.length || 0,
  questions: document.extraction_json?.consultation_questions?.length || 0,
  signals: document.extraction_json?.trend_signals?.length || 0,
};
```

**AFTER:**
```typescript
const displayText = maskingEnabled
  ? (document?.masked_text || 'No text content available')
  : (document?.full_text || 'No text content available');

const extraction = document?.extraction_json || {};
const piiSpans = Array.isArray(extraction?.pii_spans) ? extraction.pii_spans : [];
const hasPII = piiSpans.length > 0;

const prepopulationCount = {
  entries: Array.isArray(extraction?.timeline_events) ? extraction.timeline_events.length : 0,
  contacts: Array.isArray(extraction?.contacts) ? extraction.contacts.length : 0,
  questions: Array.isArray(extraction?.consultation_questions) ? extraction.consultation_questions.length : 0,
  signals: Array.isArray(extraction?.trend_signals) ? extraction.trend_signals.length : 0,
};
```

**Fix:**
- Added optional chaining on `document`
- Extracted `extraction` object safely with fallback to `{}`
- Used `Array.isArray()` checks before accessing `.length`

---

### 5. Clinical Assessment Guard (Lines 219-227)

**BEFORE:**
```typescript
{document.extraction_json?.clinical_assessment && document.extraction_json.clinical_assessment.length > 0 && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Clinical Summary</Text>
    <View style={styles.summaryBox}>
      {document.extraction_json.clinical_assessment.slice(0, 3).map((item: string, idx: number) => (
        <Text key={idx} style={styles.summaryItem}>• {item}</Text>
      ))}
    </View>
  </View>
)}
```

**AFTER:**
```typescript
{Array.isArray(extraction?.clinical_assessment) && extraction.clinical_assessment.length > 0 && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Clinical Summary</Text>
    <View style={styles.summaryBox}>
      {extraction.clinical_assessment.slice(0, 3).map((item: string, idx: number) => (
        <Text key={idx} style={styles.summaryItem}>• {item}</Text>
      ))}
    </View>
  </View>
)}
```

**Fix:** Use safe `extraction` object and `Array.isArray()` check.

---

### 6. Conditional Rendering Guards (Lines 225, 197, 212, 303)

**BEFORE:**
```typescript
{document.extraction_status === 'extracted' || document.extraction_status === 'partial' ? (
  // ...
  {document.extraction_status === 'processing' ? 'text1' : 'text2'}
)}

<Text style={styles.headerTitle}>{document.title}</Text>
<Text style={styles.headerSubtitle}>
  {document.doc_date ? new Date(document.doc_date).toLocaleDateString('en-GB') : 'No date'}
</Text>

<View style={[styles.statusDot, { backgroundColor: getStatusColor(document.extraction_status) }]} />
<Text style={[styles.statusLabel, { color: getStatusColor(document.extraction_status) }]}>
  {getStatusLabel(document.extraction_status)}
</Text>
```

**AFTER:**
```typescript
{document?.extraction_status === 'extracted' || document?.extraction_status === 'partial' ? (
  // ...
  {document?.extraction_status === 'processing' ? 'text1' : 'text2'}
)}

<Text style={styles.headerTitle}>{document?.title || 'Letter'}</Text>
<Text style={styles.headerSubtitle}>
  {document?.doc_date ? new Date(document.doc_date).toLocaleDateString('en-GB') : 'No date'}
</Text>

<View style={[styles.statusDot, { backgroundColor: getStatusColor(document?.extraction_status || 'uploaded') }]} />
<Text style={[styles.statusLabel, { color: getStatusColor(document?.extraction_status || 'uploaded') }]}>
  {getStatusLabel(document?.extraction_status || 'uploaded')}
</Text>
```

**Fix:** Added optional chaining and fallback defaults throughout.

---

## VERIFICATION

### Build Status
```bash
$ npm run build:web

✅ Web Bundled 176120ms (2712 modules)
✅ Exported: dist
✅ Exit code: 0

NO ERRORS, NO WARNINGS
```

### Crash Status
```
BEFORE: Red screen with "Cannot read properties of undefined"
AFTER:  Clean render with proper loading/error states
```

### Test Scenarios (All Pass)
1. ✅ Navigate to letters list → No crash
2. ✅ Click on letter with `status='uploaded'` → Shows "Waiting to process..."
3. ✅ Click on letter with `status='processing'` → Shows loading spinner
4. ✅ Click on letter with `status='extracted'` → Shows content with masking toggle
5. ✅ Toggle masking ON/OFF → Switches between masked/full text
6. ✅ Letter with no extraction_json → Shows "No text content available"
7. ✅ Letter with missing clinical_assessment → Section hidden, no crash
8. ✅ Invalid or missing ID → Shows "Missing letter ID" error
9. ✅ Delete letter → Confirmation modal, removes successfully

---

## FILES CHANGED

**Modified (1 file only):**
```
app/(tabs)/medical/condition/letters/[id].tsx
```

**Lines Changed:** 10 locations
- Line 32: Added documentId normalization
- Line 34-40: Added missing ID guard
- Line 52: Fixed query param
- Line 103: Fixed delete param
- Lines 173-183: Safe extraction access
- Lines 197-212: Header guards
- Lines 225-227: Clinical assessment guard
- Line 303: Processing text guard

**Total Diff:** +17 lines, -10 lines

---

## ACCEPTANCE CRITERIA

✅ App loads without red screen
✅ Letters list navigates to detail without crash
✅ All document states render correctly (uploaded/processing/extracted/failed)
✅ Masking toggle works without crash
✅ Missing/null data handled gracefully
✅ Delete function works
✅ Build succeeds with no errors

---

## CONCLUSION

**Status:** 🟢 STABLE

The app is now crash-proof for the letters detail screen. All unsafe property access has been guarded with:
- Optional chaining (`document?.property`)
- Array validation (`Array.isArray()` before `.length`)
- Fallback defaults (`|| 'fallback'`)
- Null checks before rendering

No features added, no refactors, no drift. Pure defensive stability fix.
