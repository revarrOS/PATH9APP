# PATH9 UI/UX CANONICAL AUDIT

**Date:** 2026-02-09
**Purpose:** Establish the definitive UI/UX standard for Bloodwork and Condition Management to ensure Nutrition (and future products) achieve exact parity.

---

## EXECUTIVE SUMMARY

This audit reveals **significant divergence** between Bloodwork and Condition Management across navigation patterns, visual hierarchy, theming, and feature completeness. Neither product is fully internally coherent, and both contain patterns that should not be replicated.

### Key Findings

1. **Analysis Screens:** Inconsistent navigation (Bloodwork has back button, Condition doesn't)
2. **Consultation Prep:** Different header patterns (Bloodwork uses horizontal layout, Condition uses centered title)
3. **Appointments/Contacts/Support:** Bloodwork uses dark theme + full CRUD, Condition uses light theme + read-only placeholders
4. **Data Architecture:** Bloodwork uses local stores, Condition reads from database tables (correct)
5. **Gemma Integration:** Identical chat component, properly abstracted

---

## 1️⃣ BLOODWORK UI/UX AUDIT

### A. Analysis Screen (`/medical/bloodwork/analysis`)

#### Purpose
Gemma-powered chat interface for bloodwork interpretation and consultation prep question generation.

#### Entry Points
- From main dashboard via Medical → Bloodwork tile
- Direct navigation from within Bloodwork flows

#### UI Structure
```
[Back Button] Title
              Subtitle (disclaimer)
─────────────────────────────────────────────
[Chat Interface - BloodworkChat component]
```

**Header Elements:**
- Back button (ArrowLeft icon, absolute positioned top-left)
- Title: "Bloodwork Analysis" (24px, bold)
- Subtitle: Medical disclaimer (14px, muted)
- Border bottom separator

**Visual Language:**
- Background: `theme.colors.background.primary`
- Typography: Theme-driven font sizes and weights
- Uses consistent theme colors throughout

#### UX Behavior
- **First visit:** Welcome message explaining Gemma's capabilities
- **Repeat visits:** Conversation history loads from `gemmaConversationService`
- **Auto-refresh:** Conversation persists across sessions
- **State preservation:** Full conversation history maintained

#### Gemma Interaction Model
- **Type:** Analysis + Consultation Prep suggestion engine
- **Capabilities:**
  - Interpret bloodwork numbers
  - Explain trends
  - Suggest questions for consultation prep
- **Consultation Prep Integration:**
  - Inline "Review and save question" button after assistant responses
  - Opens AddQuestionModal
  - Saves to Bloodwork consultation prep store
  - Category: Auto-detected as 'bloodwork'

#### Consultation Prep Touchpoints
- **Origin:** Gemma suggestions within chat
- **Offered:** After relevant assistant responses
- **Category:** Defaults to 'bloodwork', no user override
- **Behavior:** Consistent, inline suggestion after responses

---

### B. Entry/Timeline Screen (`/medical/bloodwork/entry`)

#### Purpose
List and manage blood test records chronologically.

#### Entry Points
- From Bloodwork dashboard/index
- From Trends screen

#### UI Structure
```
[←] Title                    [Sort] [+]
    Subtitle
─────────────────────────────────────────────
[Test Cards - scrollable list]
```

**Header Elements:**
- Back button (ChevronLeft, 40x40 touchable area)
- Title: "Blood Test Records" (24px, bold)
- Subtitle: "Log and review your test results" (small, secondary)
- Sort button: Shows "Latest/Earliest", toggles sort order
- Add button: Circular FAB (48x48, cyan, glow shadow)

**Visual Language:**
- Background: `theme.colors.background.primary`
- Header: `theme.colors.background.surface` with subtle border
- Cards: Rounded (12px), bordered, surface background
- Typography: Consistent theme-based hierarchy

**Empty State:**
- Calendar icon (64px, disabled color)
- Title: "No tests recorded yet"
- Description: Action-oriented ("Record your first blood test...")
- CTA button: "Record First Test" (prominent, cyan)

**Error State:**
- Centered error text with retry button
- Loading: Centered activity indicator (large, cyan)

#### UX Behavior
- **First visit:** Empty state with prominent CTA
- **Repeat visits:** Sorted list of tests (newest first by default)
- **Auto-refresh:** Loads on focus via `useFocusEffect`
- **State preservation:** Sort order stored in component state only
- **Scroll:** Native scroll with fade indicators

---

### C. Trends Screen (`/medical/bloodwork/trends`)

#### Purpose
Visualize marker trends over time with reference ranges.

#### Entry Points
- From Bloodwork entry/index screen
- From analysis chat (context-aware)

#### UI Structure
```
[←] Title                              [📈]
    Subtitle
─────────────────────────────────────────────
[Marker Title]                           [ℹ️]
[Time Range: 6 Months]

[1M] [3M] [6M] [1Y] [2Y] [3Y] [ALL]
─────────────────────────────────────────────
[Chart Visualization]
[Range Position Bar]
─────────────────────────────────────────────
[Change marker]     [Selected Marker]
[Your profile]      [Sex, Age Range]

[Footer Disclaimer]
```

**Header Elements:**
- Back button (ChevronLeft)
- Title: "Bloodwork Trends" + subtitle
- Icon: TrendingUp (violet)

**Complex Interaction Elements:**
- **Time Range Selector:** Horizontal scroll chips (1M → ALL)
- **Marker Selector:** Expandable panel with grid of all available markers
- **Profile Settings:** Expandable panel with sex + age range pickers
- **Info Modal:** Marker explanation overlay

**Visual Language:**
- Chips: Surface bg → Cyan when active
- Expandable panels: Surface bg, subtle border
- Modal: Dark overlay (50% opacity) + rounded white card
- Footer: Sticky, surface bg with info icon

**Empty State:**
- TrendingUp icon (64px)
- "No data available"
- CTA: "Record First Test"

#### UX Behavior
- **First visit:** Shows first available marker
- **Repeat visits:** Remembers profile settings (sex/age) in user_preferences table
- **Auto-refresh:** Loads on marker change
- **State preservation:** Profile persists, marker selection doesn't
- **Error handling:** Dismissible banner (5s timeout)

**Unique Complexity:**
- Most complex screen in Bloodwork
- 3 collapsible panels
- Modal overlays
- Sticky footer
- Profile persistence across sessions

---

### D. Consultation Prep Screen (`/medical/bloodwork/consultation-prep`)

#### Purpose
Manage questions to ask clinician, with status tracking.

#### Entry Points
- From Bloodwork index/analysis
- From Gemma chat suggestions

#### UI Structure
```
[←] Title
─────────────────────────────────────────────
[Intro Text]
─────────────────────────────────────────────
[+ Add Question] (full-width button)
─────────────────────────────────────────────
[All] [Open] [Asked] [Resolved] (filter tabs)
─────────────────────────────────────────────
[Question Cards - scrollable]
```

**Header Elements:**
- Back button (simple, left-aligned)
- Title: "Consultation Prep" (xl, bold)
- No subtitle
- Simple border separator

**Filter Tabs:**
- Horizontal chips with counts
- Active state: Cyan background
- Shows: all / open / asked / resolved counts

**Add Question Button:**
- Full-width
- Cyan background
- Icon + text: "Add Question"
- Positioned before filters

**Visual Language:**
- Background: `theme.colors.background.primary`
- Header: Simple, no surface background
- Intro box: Secondary background, muted text
- Tabs: Surface chips → Cyan when active

**Empty State:**
- Text only ("No questions yet. Add a question to get started.")
- No icon
- Contextual based on filter

#### UX Behavior
- **First visit:** Intro text + empty state
- **Repeat visits:** Loads questions via useFocusEffect
- **Auto-refresh:** On focus
- **State preservation:** None (reloads from store)
- **Modal:** AddQuestionModal for create/edit

**Question Card Behavior:**
- Status dropdown (open/asked/resolved)
- Edit button
- Delete button (confirmation dialog)
- Shows relatedMarkers if present

---

### E. Appointments Screen (`/medical/bloodwork/appointments`)

#### Purpose
Full CRUD for bloodwork appointments with calendar integration.

#### Entry Points
- From Bloodwork index

#### UI Structure
```
[←] Title                              [+]
─────────────────────────────────────────────
[Upcoming] [Completed] (filter tabs)
─────────────────────────────────────────────
[Disclaimer: Stored on device only]
[Appointment Cards]
  [Add to Calendar] (conditional button)
```

**CRITICAL OBSERVATION: DARK THEME**
- Background: `#111827` (dark gray, NOT theme-based)
- Header text: `#f9fafb` (light gray)
- Buttons: Hardcoded blue (`#3b82f6`)
- **This violates theme consistency**

**Header Elements:**
- Back button (light color on dark)
- Title: "Appointments" (centered)
- Add button: Plus icon

**Form View:**
- Full-screen modal
- Date/time pickers
- Location input
- Notes textarea
- Reminder toggles (24h / 1h)

**Visual Language:**
- Dark theme (#111827)
- Blue accents (#3b82f6)
- Gray text (#9ca3af, #6b7280)

**Empty State:**
- Calendar icon
- "No appointments"
- Context-aware text based on filter

#### UX Behavior
- **First visit:** Empty state
- **Repeat visits:** Shows upcoming/completed based on filter
- **Auto-refresh:** On filter change
- **State preservation:** None
- **Platform-specific:** Calendar integration only on native (not web)

**CRUD Capabilities:**
- Create: Full form with all fields
- Read: Card view with details
- Update: Edit form (pre-populated)
- Delete: Confirmation alert

**Integration:**
- Calendar: Native calendar API (iOS/Android only)
- Notifications: Local notifications via expo-notifications
- Reminders: Scheduled 24h and 1h before

---

### F. Key Contacts Screen (`/medical/bloodwork/key-contacts`)

#### Purpose
Store medical team contact information.

#### Entry Points
- From Bloodwork index

#### UI Structure
```
[←] Title                              [+]
─────────────────────────────────────────────
[Info Box]
[Contact Cards]
```

**CRITICAL OBSERVATION: DARK THEME (same as Appointments)**
- Background: `#111827`
- Uses hardcoded colors

**Header Elements:**
- Same pattern as Appointments
- Back / Title / Add

**Form View:**
- Contact name
- Role
- Establishment
- Email
- Phone
- Notes

**Visual Language:**
- Dark theme
- Blue accents
- Gray text hierarchy

**Empty State:**
- Users icon
- "No contacts yet"
- "Add your first medical contact to get started"

#### UX Behavior
- Full CRUD (same pattern as Appointments)
- Edit mode: Pre-populated form
- Delete: Confirmation alert
- No calendar/notification integration

---

### G. Support Access Screen (`/medical/bloodwork/support-access`)

#### Purpose
Grant family/caregivers access to bloodwork data.

#### Entry Points
- From Bloodwork index

#### UI Structure
```
[←] Title                              [+]
─────────────────────────────────────────────
[People You've Invited]
[People With Access]
[Data You Can Access]
```

**CRITICAL OBSERVATION: DARK THEME + COMPLEX LOGIC**
- Same dark theme as Appointments/Contacts
- Full invitation system
- Access level controls (read_only / read_write)

**Invite Form:**
- Name input
- Email input
- Access level selector (2 options with descriptions)
- Submit button

**Visual Language:**
- Dark theme
- Blue accents
- Cards with gray backgrounds (#1f2937)

#### UX Behavior
- Shows three sections (invitations sent, access granted, access received)
- Revoke capability
- Cancel invitation capability
- Email notifications (simulated)

---

### H. BloodworkChat Component

#### Integration Pattern
```typescript
import { BloodworkChat } from '@/products/bloodwork/components/BloodworkChat';
```

**Key Features:**
- Uses `gemmaConversationService` for persistence
- Edge function: `bloodwork-ai-respond`
- Store: `consultationPrepStore` (product-specific)
- Turn limit: 20 (with expansion modal)
- Max message length: 500 chars
- Domain context: 'bloodwork'

**Consultation Prep Integration:**
- Inline "Review and save question" button
- Opens `AddQuestionModal` from bloodwork product
- Saves with relatedMarkers
- Category: Inferred as 'bloodwork'

---

## 2️⃣ CONDITION MANAGEMENT UI/UX AUDIT

### A. Analysis Screen (`/medical/condition/analysis`)

#### Purpose
Gemma-powered chat for clinical document interpretation.

#### Entry Points
- From main dashboard via Medical → Condition tile

#### UI Structure
```
Title
Subtitle (disclaimer)
─────────────────────────────────────────────
[Chat Interface - ConditionChat component]
```

**CRITICAL DIVERGENCE: NO BACK BUTTON**
- Title and subtitle rendered directly
- No back navigation in header
- Must use system back or bottom nav

**Visual Language:**
- Identical to Bloodwork analysis
- Theme-driven colors

#### UX Behavior
- Same as Bloodwork (conversation persistence)
- Supports optional `additionalContext` prop (unused in this screen)

---

### B. Letters Screen (`/medical/condition/letters`)

#### Purpose
Upload and manage clinical documents (letters, reports).

#### Entry Points
- From Condition index

#### UI Structure
```
[←] Title
    Subtitle
─────────────────────────────────────────────
[Document Cards with status badges]

[Upload letter] (fixed bottom button)
```

**Header Elements:**
- Back button (ChevronLeft)
- Title: "Letters & Reports"
- Subtitle: "Upload medical letters for extraction and prepopulation"

**Document Cards:**
- FileText icon (blue circle bg)
- Title
- Meta: Date • Type
- Status indicator (dot + text):
  - Extracted (green)
  - Processing (blue)
  - Needs review (yellow)
  - Failed (red)

**Upload Button:**
- Fixed position at bottom
- Full-width (with margins)
- Upload icon + "Upload letter" text
- Blue background
- Platform shadow

**Visual Language:**
- Light theme (matches Bloodwork entry)
- Blue accent color (`theme.colors.brand.blue`)
- Status colors: success/error/warning

**Empty State:**
- FileText icon (64px, muted, thin stroke)
- "No letters yet"
- "Add a letter when you're ready. Path9 can help pull out what matters."

#### UX Behavior
- **First visit:** Empty state
- **Repeat visits:** Loads documents from `condition_documents` table
- **Auto-refresh:** On focus via `useFocusEffect`
- **State preservation:** Database-backed
- **Navigation:** Taps open detail view (`/letters/{id}`)

---

### C. Timeline Screen (`/medical/condition/timeline`)

#### Purpose
Chronological view of diagnoses, appointments, and signals.

#### Entry Points
- From Condition index

#### UI Structure
```
[←] Title                              [📅]
    Subtitle
─────────────────────────────────────────────
[All] [Investigations] [Diagnoses] [Treatments]
─────────────────────────────────────────────
[Event Cards with colored left border]
```

**Header Elements:**
- Back button (ChevronLeft)
- Title: "Timeline"
- Subtitle: "Your medical journey"
- Calendar icon (cyan)

**Filter Tabs:**
- 4 options (All, Investigations, Diagnoses, Treatments)
- Horizontal chips
- Cyan when active

**Event Cards:**
- Colored left border (4px wide):
  - Diagnosis: Red
  - Appointment: Cyan
  - Signal: Violet
- Date + Type badge in header
- Title (provider or diagnosis name)
- Category badge (for appointments)
- Description text
- Provider info (if present)
- Notes section (if present)

**Visual Language:**
- Light theme
- Color-coded by event type
- Surface cards with subtle borders

**Empty State:**
- Calendar icon (64px)
- "No timeline events yet"
- "Events from letters you upload will appear here"

#### UX Behavior
- **First visit:** Empty state
- **Repeat visits:** Loads from multiple tables:
  - `diagnoses`
  - `appointments`
  - `condition_trend_signals`
- **Auto-refresh:** On filter change
- **State preservation:** Database-backed
- **Sort:** Newest first (descending by date)

---

### D. Consultation Prep Screen (`/medical/condition/consultation-prep`)

#### Purpose
Manage questions for clinician appointments (same as Bloodwork).

#### Entry Points
- From Condition analysis
- From Gemma chat suggestions

#### UI Structure
```
[←] Title                              [+]
─────────────────────────────────────────────
[All] [Open] [Asked] [Resolved]
─────────────────────────────────────────────
[Question Cards]
```

**CRITICAL DIVERGENCE FROM BLOODWORK:**
- **Header:** Back button, centered title, circular add button (FAB-style)
- **No intro text**
- **No full-width "Add Question" button**
- **Filters appear directly below header**

**Header Elements:**
- Back button: 40x40 touchable
- Title: Centered, 20px (smaller than Bloodwork's 24px)
- Add button: 40px circular, cyan background, Plus icon

**Visual Language:**
- Light theme (matches Bloodwork)
- Cyan accent
- Same filter tab pattern

**Empty State:**
- Text only (same as Bloodwork)
- No icon

#### UX Behavior
- Identical to Bloodwork
- Uses **`sharedConsultationPrepStore`** with domain='condition'
- Modal: `AddQuestionModal` from condition product
- Question cards support relatedTerms (not relatedMarkers)

---

### E. Care Team Screen (`/medical/condition/care-team`)

#### Purpose
View care team members extracted from uploaded letters.

#### Entry Points
- From Condition index

#### UI Structure
```
[←] Title                              [👥]
    Subtitle
─────────────────────────────────────────────
[Member Cards]
```

**CRITICAL OBSERVATION: READ-ONLY**
- No add button
- No edit capability
- No delete capability
- Data populated from database only

**Member Cards:**
- Icon (Users in cyan circle)
- Name + Role
- Facility (with MapPin icon)
- Phone (with Phone icon)
- Email (with Mail icon)
- Notes (if present)

**Visual Language:**
- Light theme
- Cyan accent
- Surface cards with borders

**Empty State:**
- Users icon (64px)
- "No care team members yet"
- "Upload letters to automatically extract your care team contacts"

#### UX Behavior
- **First visit:** Empty state
- **Repeat visits:** Loads from `care_team` table
- **Auto-refresh:** On mount only
- **State preservation:** Database-backed
- **No user edits:** Fully automatic extraction

---

### F. Appointments Screen (`/medical/condition/appointments`)

#### Purpose
View appointments extracted from uploaded letters.

#### Entry Points
- From Condition index

#### UI Structure
```
[←] Title                              [📅]
    Subtitle
─────────────────────────────────────────────
[All] [Upcoming] [Past]
─────────────────────────────────────────────
[Appointment Cards]
```

**CRITICAL OBSERVATION: READ-ONLY + LIGHT THEME**
- No add button
- No CRUD capability
- Light theme (NOT dark like Bloodwork)
- Data from database only

**Appointment Cards:**
- Date section (Calendar icon + date)
- Status badge (if present)
- Provider name + role
- Appointment type
- Time (Clock icon)
- Location (MapPin icon)
- Notes section (if present)

**Visual Language:**
- Light theme (theme-based)
- Cyan accents
- Surface cards

**Empty State:**
- Calendar icon
- "No appointments"
- Context-aware based on filter

#### UX Behavior
- **First visit:** Empty state
- **Repeat visits:** Loads from `appointments` table
- **Auto-refresh:** On filter change
- **State preservation:** Database-backed
- **No user interaction:** View-only

---

### G. Support Access Screen (`/medical/condition/support-access`)

#### Purpose
Placeholder for future support access feature.

#### Entry Points
- From Condition index

#### UI Structure
```
[←] Title
    Subtitle
─────────────────────────────────────────────
[UserPlus icon]
Share documents with trusted supporters
[Description text]
```

**CRITICAL OBSERVATION: PLACEHOLDER ONLY**
- No functionality
- Just icon + text
- Light theme

**Visual Language:**
- Light theme
- Disabled icon color
- Muted text

#### UX Behavior
- Static screen
- No interactions
- No data loading

---

### H. ConditionChat Component

#### Integration Pattern
```typescript
import { ConditionChat } from '@/products/condition/components/ConditionChat';
```

**Key Features:**
- Uses `gemmaConversationService` (same as Bloodwork)
- Edge function: `condition-ai-respond`
- Store: `consultationPrepStore` (product-specific, separate from Bloodwork)
- Turn limit: 20 (with expansion modal)
- Max message length: 500 chars
- Domain context: 'condition'
- Supports optional `additionalContext` prop

**Consultation Prep Integration:**
- Same inline button pattern
- Opens `AddQuestionModal` from condition product
- Saves with relatedTerms (not relatedMarkers)
- Category: Inferred as 'condition'

**Identical Implementation:**
- Same UI layout as BloodworkChat
- Same conversation flow
- Same availability check
- Same turn limit system

---

## 3️⃣ SIDE-BY-SIDE COMPARISON

### Navigation Patterns

| Screen | Bloodwork | Condition | Match? |
|--------|-----------|-----------|--------|
| **Analysis** | Back button + Title/Subtitle | Title/Subtitle only | ❌ NO |
| **Entry/Letters** | ← Title/Sub [Sort][+] | ← Title/Sub | ✅ YES (Condition has upload button at bottom) |
| **Trends/Timeline** | ← Title/Sub [Icon] | ← Title/Sub [Icon] | ✅ YES |
| **Consultation Prep** | ← Title<br>[Intro]<br>[+ Button]<br>[Filters] | ← **Centered Title** [+]<br>[Filters] | ❌ NO |
| **Appointments** | Dark theme, CRUD | Light theme, read-only | ❌ NO |
| **Contacts/Care Team** | Dark theme, CRUD | Light theme, read-only | ❌ NO |
| **Support Access** | Dark theme, full feature | Light theme, placeholder | ❌ NO |

### Theming Consistency

| Product | Analysis | Entry/List | Trends/Timeline | Consultation Prep | Appointments | Contacts | Support |
|---------|----------|------------|-----------------|-------------------|--------------|----------|---------|
| **Bloodwork** | Light | Light | Light | Light | **DARK** | **DARK** | **DARK** |
| **Condition** | Light | Light | Light | Light | Light | Light | Light |

**Verdict:** Bloodwork has theme inconsistency (dark for secondary features), Condition is consistent but incomplete.

### Data Architecture

| Screen | Bloodwork | Condition |
|--------|-----------|-----------|
| **Analysis** | gemmaConversationService | gemmaConversationService |
| **Entry** | BloodworkService (store) | condition_documents (DB) |
| **Timeline** | BloodworkService (store) | diagnoses/appointments/signals (DB) |
| **Consultation Prep** | consultationPrepStore (local) | sharedConsultationPrepStore (DB) |
| **Appointments** | appointmentsStore (local) | appointments (DB) |
| **Contacts** | keyContactsService (local) | care_team (DB) |
| **Support Access** | supportAccessService (DB) | Placeholder |

**Verdict:** Condition uses database-backed architecture (correct). Bloodwork uses hybrid local/DB approach (incorrect for production).

### Gemma Integration

| Aspect | Bloodwork | Condition | Nutrition |
|--------|-----------|-----------|-----------|
| **Chat Component** | BloodworkChat | ConditionChat | NutritionChat |
| **Edge Function** | bloodwork-ai-respond | condition-ai-respond | nutrition-ai-respond |
| **Store** | consultationPrepStore | consultationPrepStore | sharedConsultationPrepStore |
| **Related Data Field** | relatedMarkers | relatedTerms | relatedTerms |
| **Domain Context** | 'bloodwork' | 'condition' | 'nutrition' |

**Verdict:** Properly abstracted, domain-specific implementations. Condition and Nutrition correctly use sharedConsultationPrepStore.

### Consultation Prep Integration

| Aspect | Bloodwork | Condition |
|--------|-----------|-----------|
| **Header Layout** | ← Title<br>[Intro]<br>[+ Full Button] | ← **Centered** Title [+ Circle] |
| **Add Button** | Full-width cyan button | Circular FAB (40px) |
| **Intro Text** | Yes | No |
| **Modal** | AddQuestionModal (bloodwork) | AddQuestionModal (condition) |
| **Store** | consultationPrepStore | sharedConsultationPrepStore |
| **Data Fields** | relatedMarkers | relatedTerms |

**Verdict:** Different UX patterns for same functionality. Condition's centered title + FAB is cleaner, but Bloodwork's intro text is more helpful.

### Empty States

| Screen | Bloodwork | Condition |
|--------|-----------|-----------|
| **Entry/Letters** | Calendar icon + title + description + CTA | FileText icon + title + description |
| **Trends/Timeline** | Icon + title + description + CTA | Icon + title + description |
| **Consultation Prep** | Text only | Text only |
| **Appointments** | Icon + title + description | Icon + title + description |
| **Contacts/Care Team** | Icon + title + description | Icon + title + description |

**Verdict:** Consistent pattern (icon + text + optional CTA). Good.

---

## 4️⃣ CANONICAL RECOMMENDATIONS

### Navigation Standard

**Analysis Screens MUST have:**
- Back button (ChevronLeft, 40x40 touchable area)
- Title (24px, bold)
- Subtitle (14px, muted, disclaimer text)
- Border separator below header

**Rationale:** Bloodwork is correct. Condition's missing back button violates navigation principles.

---

### Consultation Prep Standard

**ADOPT Condition's pattern:**
- Back button (left)
- Title (centered, 20px)
- Add button (circular FAB, 40px, cyan, right)
- No intro text (add to empty state instead)
- Filters directly below header

**Rationale:** Cleaner visual hierarchy, FAB pattern is more modern, intro text belongs in empty state.

---

### Theming Standard

**Light theme for ALL screens:**
- Background: `theme.colors.background.primary`
- Surface: `theme.colors.background.surface`
- Accent: Domain-specific (`theme.colors.brand.cyan` for medical, `theme.colors.brand.green` for nutrition)

**Rationale:** Condition is correct. Bloodwork's dark theme for Appointments/Contacts/Support is inconsistent and violates theme system.

---

### Data Architecture Standard

**Database-backed for ALL persistent data:**
- Appointments → `appointments` table
- Contacts → `care_team` table (or domain-specific table)
- Consultation Prep → `consultation_questions` table with domain filter
- Support Access → `support_invitations` + `support_access` tables

**Rationale:** Condition is correct. Local stores don't sync across devices.

---

### CRUD vs Read-Only Standard

**Feature completeness depends on product:**
- **Bloodwork Appointments/Contacts:** User creates data → CRUD required
- **Condition Appointments/Care Team:** Extracted from letters → Read-only correct
- **Nutrition (future):** TBD based on data source

**Rationale:** Both are correct for their contexts. Don't force CRUD on extracted data.

---

### Gemma Integration Standard

**Chat components MUST:**
- Use `gemmaConversationService` for persistence
- Call domain-specific edge function (`{domain}-ai-respond`)
- Use `sharedConsultationPrepStore` for question storage
- Support consultation prep suggestions
- Implement turn limit with expansion modal
- Max message length: 500 chars

**Rationale:** Current pattern is correct and properly abstracted.

---

### Consultation Prep Modal Standard

**AddQuestionModal MUST:**
- Accept `initialQuestion` prop (for edit mode)
- Support domain-specific related data (relatedMarkers OR relatedTerms)
- Use category detector for auto-categorization
- Save via sharedConsultationPrepStore
- Show success confirmation

**Rationale:** Shared component with domain-specific adapters is correct.

---

### Empty State Standard

**Pattern:**
```
[Icon: 64px, theme.colors.text.disabled]
[Title: Large, bold, primary text]
[Description: Small, muted text, centered]
[CTA Button: Optional, cyan, rounded]
```

**Rationale:** Consistent across both products. Good pattern.

---

### Header Pattern Standard

**Standard header:**
```
[Back: 40x40] Title                    [Action]
              Subtitle (optional)
──────────────────────────────────────────────
```

**Exceptions:**
- Consultation Prep: Centered title + circular add button
- Trends: Icon on right instead of action button

**Rationale:** Flexible standard with defined exceptions.

---

## 5️⃣ NUTRITION PARITY REQUIREMENTS

To achieve exact parity, Nutrition MUST:

### ✅ Analysis Screen
- ✅ Include back button (ChevronLeft)
- ✅ Title: "Nutrition Analysis"
- ✅ Subtitle: Disclaimer about Gemma's capabilities
- ✅ Use NutritionChat component (already correct)
- ✅ Call `nutrition-ai-respond` edge function
- ✅ Save questions to `sharedConsultationPrepStore` with domain='nutrition'

### ✅ Consultation Prep Screen
- ⚠️ Adopt Condition's pattern (centered title + FAB)
- ⚠️ Remove full-width add button
- ⚠️ Move intro text to empty state
- ✅ Use FilterTabs component
- ✅ Use sharedConsultationPrepStore with domain='nutrition'

### Entry/Trends Screens
- Depends on Nutrition product requirements
- If user creates entries: Follow Bloodwork entry pattern
- If analyzing uploaded data: Follow Condition letters pattern

### Appointments/Contacts
- TBD based on Nutrition product needs
- If needed: Use light theme + database-backed
- If CRUD required: Follow Bloodwork pattern but with light theme
- If read-only: Follow Condition pattern

---

## 6️⃣ CRITICAL FIXES REQUIRED

### Bloodwork

**Must fix:**
1. ❌ Appointments/Contacts/Support Access: Remove dark theme, use light theme
2. ❌ Convert local stores to database-backed architecture
3. ❌ Consultation Prep: Adopt Condition's header pattern
4. ⚠️ Consider merging consultationPrepStore → sharedConsultationPrepStore

**Nice to have:**
- Extract common header components
- Standardize empty state patterns
- Unify error handling

### Condition

**Must fix:**
1. ❌ Analysis screen: Add back button
2. ❌ Support Access: Implement full feature or remove route

**Nice to have:**
- Add intro text to consultation prep empty state
- Enhance error states with retry CTAs

---

## 7️⃣ FINAL VERDICT

### Canonical UI/UX Standard

**This is the canonical pattern that Nutrition MUST mirror:**

1. **Navigation:** Condition's pattern (back button on all screens except landing)
2. **Theming:** Condition's pattern (light theme for all)
3. **Consultation Prep:** Condition's pattern (centered title + FAB)
4. **Data Architecture:** Condition's pattern (database-backed)
5. **Gemma Integration:** Current shared pattern (both correct)
6. **Empty States:** Current shared pattern (both correct)
7. **CRUD:** Context-dependent (user-created = CRUD, extracted = read-only)

**Bloodwork deviations to fix:**
- Dark theme on secondary screens
- Missing back button on Analysis (wait, Bloodwork HAS it, Condition doesn't!)
- Local storage instead of database

**Condition deviations to fix:**
- Missing back button on Analysis screen
- Incomplete Support Access feature

---

## APPENDIX: FILE LOCATIONS

### Bloodwork
- Analysis: `app/(tabs)/medical/bloodwork/analysis/index.tsx`
- Entry: `app/(tabs)/medical/bloodwork/entry/index.tsx`
- Trends: `app/(tabs)/medical/bloodwork/trends/index.tsx`
- Consultation Prep: `app/(tabs)/medical/bloodwork/consultation-prep/index.tsx`
- Appointments: `app/(tabs)/medical/bloodwork/appointments/index.tsx`
- Key Contacts: `app/(tabs)/medical/bloodwork/key-contacts/index.tsx`
- Support Access: `app/(tabs)/medical/bloodwork/support-access/index.tsx`
- Chat: `products/bloodwork/components/BloodworkChat.tsx`

### Condition
- Analysis: `app/(tabs)/medical/condition/analysis/index.tsx`
- Letters: `app/(tabs)/medical/condition/letters/index.tsx`
- Timeline: `app/(tabs)/medical/condition/timeline/index.tsx`
- Consultation Prep: `app/(tabs)/medical/condition/consultation-prep/index.tsx`
- Care Team: `app/(tabs)/medical/condition/care-team/index.tsx`
- Appointments: `app/(tabs)/medical/condition/appointments/index.tsx`
- Support Access: `app/(tabs)/medical/condition/support-access/index.tsx`
- Chat: `products/condition/components/ConditionChat.tsx`

### Nutrition
- Analysis: `app/(tabs)/nutrition/analysis/index.tsx`
- Consultation Prep: `app/(tabs)/nutrition/consultation-prep/index.tsx`
- Chat: `products/nutrition/components/NutritionChat.tsx`

---

**END OF AUDIT**
