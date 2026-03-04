# Medical Journey UX Implementation

## Overview

Complete user experience implementation for the medical pathway, bringing backend services to life with visual components that show users progressing through the chaos phase toward clarity.

## What Was Built

### Visual Components

**1. ProgressIndicator** (`components/ProgressIndicator.tsx`)
- Shows current phase (Chaos → Orientation → Predictability → Recovery → Thriving)
- Displays emotional trend (improving, stable, needs attention)
- Shows days since diagnosis
- Color-coded phase indicators with emojis
- Encouraging messages based on current phase

**2. DiagnosisExplainer** (`components/DiagnosisExplainer.tsx`)
- Displays diagnosis name and stage
- Shows plain-English translation of medical report
- Technical medical text viewable but secondary
- Visual icon treatment with purple accent
- "Get Translation" button if plain English not yet available

**3. AppointmentCard** (`components/AppointmentCard.tsx`)
- Shows appointment date/time with calendar icon
- Displays provider name and role
- **Role Explainer**: "Your oncologist is a cancer specialist who coordinates..."
- Lists preparation tips
- Shows AI-generated questions to ask (up to 8)
- Location and appointment type

**4. NextStepsStrip** (`components/NextStepsStrip.tsx`)
- Horizontal scrolling strip of next 3-5 milestones
- Numbered cards showing upcoming steps
- Visual timeline progression with arrows
- Directly addresses the "predictability" outcome from requirements

**5. TimelineVisualization** (`components/TimelineVisualization.tsx`)
- Vertical timeline showing all 6 phases
- Visual indicators: completed (green), in progress (purple), upcoming (gray)
- Each phase shows:
  - Description
  - Estimated duration
  - Key milestones (first 3)
  - Current phase highlighted with "Current" badge
- Connector lines between phases (green when completed)

### Data Services

**medical-journey.service.ts**
- `getUserDiagnosis()` - Fetch user's diagnosis with plain English summary
- `getUserAppointments()` - Get upcoming appointments (next 5)
- `getUserTimeline()` - Fetch all treatment phases ordered
- `getCurrentPhase()` - Determine if user is in chaos, recovery, etc.
- `getNextMilestones()` - Get next 5 milestones across phases
- `getEmotionalProgress()` - Track anxiety/hope over last 7 days

### My Path Screen (Redesigned)

**Before:**
- Static pillar cards
- No data visualization
- No sense of progression

**After:**
- Dynamic loading from database
- Progress indicator at top
- Next steps strip (horizontal scroll)
- Diagnosis explainer card
- Upcoming appointments with role explanations
- Full timeline visualization
- Pull-to-refresh
- Empty state for new users

## Mapping to Requirements

From the attached requirements image:

| Outcome | UX/UI Feature | Component |
|---------|---------------|-----------|
| Fear reduced, basic understanding | Calm Gemma conversation | DiagnosisExplainer + plain English |
| Orientation | Conversational explainer + role cards | AppointmentCard with role descriptions |
| Single source of truth | One timeline (all hospitals) | TimelineVisualization (consolidated) |
| Cognitive clarity | Plain-English explainer cards | DiagnosisExplainer component |
| Predictability | Timeline strip (next 3-5 steps) | NextStepsStrip component |

### Edge Services Mapping

| Service | Mobile UI | Mode |
|---------|-----------|------|
| Diagnosis translator | DiagnosisExplainer card | Education |
| AI role mapping + appointment context | AppointmentCard with role explainer | Education |
| Email/SMS/manual ingestion + dedupe | *(not yet implemented)* | Education |
| Prompt-bounded medical translation | DiagnosisExplainer plain_english_summary | Education |
| AI timeline generator | TimelineVisualization with 6 phases | Education |

## Live Progression Through Chaos

**How it shows progression:**

1. **Day 1**: User sees "Navigating Chaos 🌪️" phase
2. **Phase 1 Active**: "Diagnosis & Testing" highlighted in purple
3. **Next Steps**: Shows "Complete imaging", "Meet with oncologist", etc.
4. **Days Counter**: "7 days in" shown in progress indicator
5. **Emotional Trend**: "Trending Better 📈" when anxiety decreasing
6. **Visual Timeline**: Green checkmarks for completed phases

**As user progresses:**
- Phases move from gray → purple (in progress) → green (completed)
- Next steps strip updates to show upcoming milestones
- Phase indicator changes: Chaos → Orientation → Predictability
- Days counter increases
- Emotional trend reflects improvement

## Testing the UI

### Step 1: Create Test Data

1. Get your user ID from Supabase:
   ```sql
   SELECT id, email FROM auth.users;
   ```

2. Run the seed script (`scripts/seed-medical-journey.sql`):
   - Open Supabase SQL Editor
   - Replace `YOUR_USER_ID_HERE` with your actual UUID (7 places)
   - Run the script

3. Verify data created:
   ```sql
   SELECT * FROM diagnoses WHERE user_id = 'YOUR_USER_ID_HERE'::uuid;
   SELECT * FROM appointments WHERE user_id = 'YOUR_USER_ID_HERE'::uuid;
   SELECT * FROM treatment_timeline WHERE user_id = 'YOUR_USER_ID_HERE'::uuid;
   ```

### Step 2: View in App

1. Sign in to the app
2. Navigate to "My Path" tab
3. You should see:
   - Progress indicator: "Navigating Chaos" with 7 days
   - Next steps strip with 5 milestones
   - Diagnosis explainer card with plain English
   - 3 upcoming appointments with role explanations
   - Timeline with 6 phases (Phase 1 in progress)

4. Pull down to refresh data

### Step 3: Simulate Progression

Update timeline phase to show progression:

```sql
-- Mark Phase 1 complete, start Phase 2
UPDATE treatment_timeline
SET status = 'completed', actual_end_date = CURRENT_DATE
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid AND phase_order = 1;

UPDATE treatment_timeline
SET status = 'in_progress', actual_start_date = CURRENT_DATE
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid AND phase_order = 2;
```

Refresh app to see:
- Phase 1 now green with checkmark
- Phase 2 highlighted in purple as "Current"
- Next steps updated to Phase 2 milestones
- Progress indicator may shift toward "Finding Orientation"

## Color System

Inspired by website imagery:

- **Primary Purple**: `#6B46C1` (main accent, current phase)
- **Success Green**: `#48BB78` (completed phases)
- **Warning Orange**: `#ED8936` (chaos phase)
- **Info Blue**: `#4299E1` (stable trend)
- **Neutral Gray**: `#718096` (upcoming phases)
- **Background**: `#F7FAFC` (soft gray)
- **White Cards**: `#FFFFFF` with `#E2E8F0` borders

## Component Architecture

```
MyPathScreen
├── ProgressIndicator (phase, trend, days)
├── NextStepsStrip (milestones array)
├── DiagnosisExplainer (diagnosis object)
├── AppointmentCard[] (appointments array)
└── TimelineVisualization (phases array)
```

All components are self-contained and reusable. They receive data as props and handle their own styling/layout.

## Missing Features (Future Work)

From the requirements image, these are **NOT YET IMPLEMENTED**:

1. **Email/SMS Ingestion**
   - No automated parsing of appointment emails
   - User must manually input appointments (via chat)

2. **Multi-Hospital Deduplication**
   - No logic to detect duplicate appointments across systems
   - Requires NLP to match "Dr. Smith at City Hospital" = "John Smith, MD - City Medical"

3. **Smart Upload + Tracker**
   - No file upload for pathology reports
   - No image recognition of appointment cards
   - Backend translate-medical exists but not connected to upload UI

4. **Real-time Anxiety Detection**
   - Emotional check-ins table exists
   - Safety guardrails service detects distress
   - But no live chart showing anxiety trend over time in UI

5. **Conversational Data Entry**
   - User can chat with Gemma
   - But responses don't automatically populate diagnosis/appointment tables
   - Orchestrate service needs to route to understand-appointment and translate-medical

## Next Steps to Complete Vision

**Phase 1: Connect Chat to Services**
1. Modify orchestrate to detect medical content in user messages
2. Route to translate-medical when diagnosis mentioned
3. Route to understand-appointment when appointment mentioned
4. Store results in database tables automatically

**Phase 2: Add Upload Capability**
1. Add camera/file picker to Today screen
2. Send image to translate-medical service
3. OCR extraction of medical text
4. Display extracted data for user confirmation

**Phase 3: Multi-Source Deduplication**
1. Add fuzzy matching for provider names
2. Detect duplicate appointments by date + provider
3. Merge data from multiple sources
4. Show "single source of truth" badge

**Phase 4: Emotional Trend Visualization**
1. Query emotional_checkins for last 30 days
2. Create line chart showing anxiety over time
3. Highlight interventions offered/accepted
4. Show correlation with treatment phases

## Files Created

**Components (5):**
- `components/ProgressIndicator.tsx` (115 lines)
- `components/DiagnosisExplainer.tsx` (141 lines)
- `components/AppointmentCard.tsx` (208 lines)
- `components/NextStepsStrip.tsx` (94 lines)
- `components/TimelineVisualization.tsx` (177 lines)

**Services (1):**
- `services/medical-journey.service.ts` (123 lines)

**Screens (Modified):**
- `app/(tabs)/my-path.tsx` (completely redesigned, 203 lines)

**Documentation (2):**
- `docs/MEDICAL_JOURNEY_UX.md` (this file)
- `scripts/seed-medical-journey.sql` (seed data for testing)

**Total:** ~1,100 lines of production code

## Success Metrics

**Visual Design:**
- ✅ Clean, premium feel with subtle shadows and rounded corners
- ✅ Purple accent color matching brand (avoiding pure violet)
- ✅ Clear visual hierarchy with proper spacing
- ✅ Responsive typography (title: 32px, body: 15-16px)
- ✅ Icons from lucide-react-native
- ✅ Smooth pull-to-refresh

**Data Flow:**
- ✅ All components receive real database data
- ✅ No hardcoded mock data in UI
- ✅ Loading states and empty states
- ✅ Error handling in services

**User Experience:**
- ✅ Users see live progression through treatment phases
- ✅ Next steps clearly visible (addresses predictability)
- ✅ Role explanations make providers less scary (orientation)
- ✅ Plain English reduces fear (chaos → clarity)
- ✅ Timeline visualization shows "single source of truth"

**Alignment with Requirements:**
- ✅ Delivers 4 of 5 outcomes (fear reduction, orientation, clarity, predictability)
- ✅ Single source of truth *shown* (not yet automated ingestion)
- ✅ Visual progression through chaos phase
- ✅ Education mode throughout
- ✅ Calm, supportive tone in copy

## Conclusion

The medical journey UX is now **functional and visually complete**. Users can see their diagnosis, appointments, and treatment timeline with clear progression indicators. The gap between backend services and user experience is closed.

**What works now:**
- Visual journey map
- Progress through phases
- Next steps visibility
- Diagnosis translation display
- Appointment role explanations

**What needs integration:**
- Automated data capture from chat
- File/image upload for reports
- Multi-source deduplication
- Live emotional trend charts

The foundation is solid. Adding the integration layers will complete the vision from the requirements image.
