# Letter Prepopulation Guide

## Overview

The prepopulation system extracts structured data from condition letters and populates it into your timeline, appointments, care team, and consultation prep.

## Part 1: Review Flow (LIVE)

The review flow is now fully deployed and working:

### How It Works

1. **Upload a Letter**
   - Go to: Letters & Reports → Upload letter
   - Upload your PDF medical letter

2. **Wait for Extraction**
   - The system will automatically extract data from your letter
   - Status will change from "Processing" to "Extracted"

3. **Review Suggestions**
   - Open the letter details
   - You'll see an "AI Extracted Data" section with counts:
     - Timeline events
     - Care team contacts
     - Consultation questions
   - Click "Review & Accept Suggestions"

4. **Accept/Edit/Reject**
   - Each suggestion has three options:
     - **Accept**: Add it to your records as-is
     - **Edit**: Modify it before adding (not implemented yet, will skip for now)
     - **Reject**: Don't add this to your records
   - All suggestions are highlighted in yellow (AI badge)
   - Review each one carefully

5. **Save**
   - Once all suggestions are accepted or rejected (none pending)
   - Click the checkmark button at top-right
   - Data flows into:
     - Timeline → `/medical/condition/timeline`
     - Appointments → `/medical/condition/appointments`
     - Care Team → `/medical/condition/care-team`
     - Consultation Prep → `/medical/condition/consultation-prep`

## Part 2: Re-run Prepopulation on Existing Letter

If you already have a letter that was extracted but hasn't been prepopulated yet, use this script:

### Usage

```bash
# Run on most recent extracted letter
node rerun-letter-prepopulation.js

# Run on specific letter by ID
node rerun-letter-prepopulation.js <letter-id>
```

### What It Does

1. Authenticates as test user (you'll need to update credentials in script)
2. Loads the letter and its extraction_json
3. Creates records in:
   - `appointments` table (for appointment-type events)
   - `diagnoses` table (for diagnosis-type events)
   - `condition_trend_signals` table (for other timeline events)
   - `care_team` table (for contacts)
   - `consultation_questions` table (for questions)
4. Skips duplicates automatically
5. Reports results

### Important Notes

- This script bypasses the review UI - use it only for testing or re-running
- In production, users should always use the review flow in the app
- Duplicate detection prevents the same data being added twice

## Data Flow

```
Letter Upload
    ↓
Extraction (AI analyzes PDF)
    ↓
Review Screen (user accepts/rejects)
    ↓
Prepopulation Service
    ↓
├─→ Timeline (appointments, diagnoses, signals)
├─→ Care Team (contacts)
└─→ Consultation Prep (questions)
```

## UX Parity with Bloodwork

The Condition Management review flow matches Bloodwork Management exactly:

- Same layout and spacing
- Same AI badges and highlights
- Same accept/edit/reject pattern
- Same status indicators
- Same empty states
- Same confirmation flow

## Next Steps

1. Upload a letter in the app
2. Wait for extraction to complete
3. Review and accept suggestions
4. Verify data appears in timeline, care team, etc.

That's it - the system is live and ready to use!
