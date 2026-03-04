# Path9 Vision vs Reality Audit
**Date**: December 29, 2025
**Goal**: Assess where we are vs. where we need to be for a fully working app in 7 days

---

## What Path9 Is Meant To Be

### Core Vision
**Tagline**: "Your companion through chaos to clarity"

**Purpose**: Help people living with blood cancer move from **chaos → clarity → control** through:
- **Education** - Understanding what's happening
- **Enablement** - Building capacity to cope
- **Empowerment** - Taking back agency

### Target User
People who are:
- Newly diagnosed with blood cancer (CLL, AML, lymphoma, myeloma)
- Overwhelmed by medical information
- Scared and disoriented
- Need emotional support WITHOUT toxic positivity
- Need to understand medical jargon
- Need to prepare for appointments
- Need to track their journey

### Core Value Propositions

1. **Gemma - The Compassionate AI Companion**
   - Calm, gentle, non-judgmental presence
   - Never rushed, never performative
   - Medical boundaries (explains, never advises)
   - Emotional safety (normalizes fear, grief, anger)
   - Success = user becomes MORE independent, not dependent

2. **Chaos → Clarity → Control Journey**
   - Phase 1: Chaos (disoriented, scared, overwhelmed)
   - Phase 2: Clarity (starting to understand, asking questions)
   - Phase 3: Control (confident, self-advocating, leading own care)

3. **Five Pathways**
   - Medical: Understand diagnosis, appointments, timeline
   - Nutrition: Learn what to eat during treatment
   - Meditation: Find stillness amidst chaos
   - Movement: Safe activity despite fatigue
   - Mindfulness: Process emotions, journal, breathe

4. **Key Outcomes**
   - Fear reduced through plain-English explanations
   - Orientation restored via appointment role explanations
   - Single source of truth for medical timeline
   - Cognitive clarity via diagnosis translation
   - Predictability via next-steps visibility

---

## What We've Built (Reality Check)

### ✅ Infrastructure (100% Complete)

**Database**: 34 tables deployed, RLS enabled, user isolation enforced
- User profiles
- Medical journey (diagnosis, appointments, timeline, care team)
- Nutrition pathway (profiles, insights, interactions)
- Meditation pathway (sessions, preferences, prompts)
- Movement pathway (profiles, activities, insights)
- Mindfulness pathway (emotions, journal, check-ins)
- Canon system (documents, chunks, applicability)
- Audit system (113 events logged)

**Edge Functions**: 26 functions deployed and ACTIVE
- Core: orchestrate, gemma-respond, api-gateway, health
- Safety: safety-guardrails, reset-password
- Medical: translate-medical, understand-appointment, infer-timeline, generate-education
- Nutrition: nutrition-profile, nutrition-insight, nutrition-questions, nutrition-reality, smoothie-generator, supplement-checker
- Meditation: meditation-session, meditation-selector, meditation-adapt, stillness-starter
- Movement: movement-activity, movement-reality-explainer, permission-to-rest, walking-medicine-guide
- Mindfulness: emotion-check-in, normalize-emotion, breath-guide, meaning-explorer
- Shared: journal-entry, journal-summary, select-content

**AI Integration**: Anthropic Claude 3.5 Sonnet configured and responding
- LLM adapter with provider abstraction
- Gemma's personality system (4 system prompts)
- Knowledge canon retrieval
- Safety guardrails (input & output validation)
- 7 successful conversations with real users

**Status**: FULLY OPERATIONAL ✅

---

### ✅ Gemma's Personality (100% Complete)

**System Prompts**:
1. `gemma-core-system.txt` - WHO Gemma is (calm, gentle, restraint over output)
2. `boundary-safety.txt` - Medical and spiritual boundaries
3. `state-template.txt` - User journey context hydration
4. `knowledge-canon-usage.txt` - How to use behavioral principles

**Personality Traits**: All implemented
- Calm, gentle, respectful, plain-spoken, non-judgmental
- Never rushed, never performative
- Medical boundaries enforced (explains, never advises)
- Emotional safety prioritized (normalizes difficult emotions)
- Success = independence, not dependency

**Status**: PERSONALITY IS GEMMA ✅

---

### ⚠️ Mobile UI (70% Complete - GAPS IDENTIFIED)

#### What Works:
1. **Today Screen (Conversation)**
   - Single-turn conversation with Gemma
   - Multiline input (1-1000 chars)
   - Loading states
   - Response display
   - Error handling
   - "Not medical advice" footer

2. **Authentication**
   - Sign in/sign up working
   - Profile auto-creation
   - Session management

3. **Bottom Tab Navigation**
   - Today (active)
   - Medical (static placeholder)
   - Nutrition (static placeholder)
   - Meditation (static placeholder)
   - Mindfulness (static placeholder)
   - Movement (static placeholder)
   - My Path (static placeholder)
   - Library (static placeholder)

#### What's Missing (CRITICAL GAPS):

**GAP 1: No Pathway Screens**
- Medical tab: Empty placeholder
- Nutrition tab: Empty placeholder
- Meditation tab: Empty placeholder
- Mindfulness tab: Empty placeholder
- Movement tab: Empty placeholder

**Impact**: Users can't access 80% of the app's value
**Priority**: P0 - BLOCKER

**GAP 2: No Conversation History**
- Current: Single-turn only, no memory
- Needed: Multi-turn conversation, context retention
- User can't continue previous conversations
- Gemma can't reference past interactions

**Impact**: Conversation feels disconnected
**Priority**: P1 - HIGH

**GAP 3: No Journey Visualization**
- My Path tab is static
- No progress indicators
- No timeline visualization
- No diagnosis explainer
- No appointment cards

**Impact**: User can't see their journey progression
**Priority**: P1 - HIGH

**GAP 4: No Data Capture Flow**
- User tells Gemma about diagnosis → not stored
- User mentions appointment → not saved
- Medical info shared → lost after conversation
- Timeline not auto-generated

**Impact**: Backend services exist but not connected
**Priority**: P0 - BLOCKER

---

### ⚠️ Service Integration (40% Complete - MAJOR GAPS)

#### What Works:
- Orchestrate function receives messages
- Safety guardrails run (input & output)
- LLM calls succeed
- Audit logs everything
- Canon retrieval attempts (80% find nothing - need more content)

#### What's Broken:

**GAP 5: Intent Classification Not Routing**
- Intent classifier exists
- Service router exists
- BUT: orchestrate doesn't actually call specialized services
- Medical translation happens in isolation
- Appointment understanding never triggered
- Timeline inference never runs

**Impact**: Specialized services are orphaned
**Priority**: P0 - BLOCKER

**GAP 6: No Persistent Conversation Context**
- Each message is standalone
- No summary generation
- No journal entry auto-creation
- No emotion tracking from conversations

**Impact**: Gemma has amnesia
**Priority**: P1 - HIGH

---

### ⚠️ Content & Canon (20% Complete - MAJOR GAP)

**Current State**:
- 2 canon documents loaded (habit formation, reflection)
- 6 canon chunks indexed
- 12/15 retrieval attempts find NOTHING
- No blood cancer specific content
- No pathway-specific guidance

**Needed**:
- 20+ canon documents across pathways
- Medical journey: diagnosis phases, treatment stages, side effect coping
- Nutrition: chemo-specific nutrition, supplement safety, nausea management
- Meditation: cancer-specific practices, fear management
- Movement: fatigue management, safe exercise ranges
- Mindfulness: grief processing, identity work, caregiver support

**Impact**: Gemma lacks domain expertise
**Priority**: P1 - HIGH

---

## Gap Analysis: What's Blocking "Fully Working App"

### P0 Blockers (Must Fix in 7 Days)

**1. Build Pathway Screens** (Medical, Nutrition, Meditation, Movement, Mindfulness)
- Components exist (ProgressIndicator, DiagnosisExplainer, etc.)
- Need to wire them to their respective tab screens
- Connect to backend services
- **Est**: 2 days

**2. Connect Orchestrate to Service Families**
- Intent classification works
- But services never get called
- Wire up service router to actually invoke edge functions
- Store results in database
- **Est**: 1 day

**3. Implement Data Capture Flow**
- When user shares diagnosis → save to diagnoses table
- When user mentions appointment → save to appointments table
- When user shares timeline info → update treatment_timeline
- **Est**: 2 days

**4. Build Conversation Memory**
- Store conversation history
- Generate summaries
- Pass context to subsequent messages
- Display history in UI
- **Est**: 1 day

### P1 High Priority (Should Fix in 7 Days)

**5. Expand Canon Content**
- Add 15-20 more documents
- Blood cancer specific
- Pathway specific
- **Est**: 1 day (can parallelize)

**6. Build Journey Visualization**
- Wire My Path tab to display:
  - Progress indicator
  - Timeline visualization
  - Diagnosis explainer
  - Appointment cards
  - Next steps
- **Est**: 1 day

### P2 Nice to Have (Post-Launch)

**7. File Upload for Reports**
- Camera/file picker
- OCR extraction
- Medical translation

**8. Multi-Source Deduplication**
- Fuzzy matching appointments
- Provider name normalization

**9. Emotional Trend Charts**
- Visualize anxiety over time
- Correlate with treatment phases

---

## Recommended 7-Day Plan

### Day 1-2: Core Pathways (Medical Focus)
- Build Medical pathway screen
- Wire DiagnosisExplainer to backend
- Wire AppointmentCard to backend
- Wire TimelineVisualization to backend
- Connect My Path tab to display journey

### Day 3-4: Service Integration
- Fix orchestrate → service router connection
- Implement data capture from conversations
- Store diagnosis, appointments, timeline from chat
- Test full flow: chat → service → database → display

### Day 5: Conversation Memory
- Store conversation history
- Generate summaries
- Pass context between messages
- Display history in Today screen

### Day 6: Other Pathways (Quick Builds)
- Nutrition pathway screen (basic)
- Meditation pathway screen (basic)
- Movement pathway screen (basic)
- Mindfulness pathway screen (basic)

### Day 7: Canon Content & Polish
- Add 15+ canon documents
- Test canon retrieval
- Fix any bugs
- End-to-end testing

---

## Success Criteria: "Fully Working App"

By end of Day 7, user should be able to:

✅ **Sign up** → profile created
✅ **Chat with Gemma** → multi-turn conversation with memory
✅ **Share diagnosis** → saved to database, displayed in Medical tab
✅ **Mention appointment** → saved, displayed with role explanation
✅ **See their timeline** → visual progression through treatment phases
✅ **Access pathways** → Medical, Nutrition, Meditation, Movement, Mindfulness
✅ **Track journey** → My Path shows progress indicators
✅ **Get guidance** → Canon retrieval finds relevant content
✅ **Feel supported** → Gemma's personality shines through

---

## What We're NOT Building (Out of Scope)

❌ File upload (post-launch)
❌ Email/SMS ingestion (post-launch)
❌ Multi-hospital deduplication (post-launch)
❌ Caregiver portal (future)
❌ Provider integration (future)
❌ Voice interface (future)

---

## Bottom Line

**What Works**: Infrastructure, AI, Gemma's personality
**What's Missing**: UI/UX, service integration, content
**What's Blocking**: Pathway screens, data capture, conversation memory

**Can we get to "fully working" in 7 days?**
**YES** - if we focus on P0 blockers and accept basic implementations for pathways.

**Recommendation**: Build Medical pathway deeply, other pathways shallowly. Get the core loop working: chat → capture → display → guide.
