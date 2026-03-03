# Condition Management — Medical Companion OS

**Domain:** Narrative Condition Tracking & Longitudinal Understanding
**Status:** Production (2026-02-02)
**Mirror:** Bloodwork Management (90% structural parity)

---

## Purpose

Condition Management helps users understand their medical journey through **unstructured clinical documents** over time.

While Bloodwork answers "What do my numbers look like?", Condition answers "What is happening to me, according to my clinicians?"

---

## Core Capabilities

### 1. Document-Based Entries
- Consultant letters
- Clinic summaries
- Biopsy reports
- Diagnostic updates
- Follow-up letters

**Not numeric data. Narrative clinical records.**

### 2. Narrative Trends
- Timeline-based progression view
- Stability vs. change markers
- Language shift detection
- Milestone tracking

**Not charts. Story progression.**

### 3. AI Analysis (Gemma)
- Explains what changed since last update
- Identifies patterns in clinical language
- Converts confusion into questions
- Prepares for consultations

**Same Gemma. Different lens.**

### 4. Consultation Prep
- AI-suggested questions based on condition changes
- User-added questions
- Priority organization
- Linked to specific entries

**Identical to Bloodwork implementation.**

### 5. Care Team Management
- Key clinical contacts
- Specialist network
- Contact preferences

**Identical to Bloodwork implementation.**

### 6. Trusted Support Access
- Share condition timeline with family/caregivers
- Granular permissions
- Revocable access

**Identical to Bloodwork implementation.**

---

## Structure

```
/products/condition
  /ai                      # AI analysis boundaries & system prompts
  /components              # UI components
  /consultation-prep       # Question builder
  /docs                    # Feature documentation
  /entries                 # Document entry management
  /key-contacts            # Care team contacts
  /reference               # Clinical reference data
  /services                # Business logic
  /support-access          # Trusted support sharing
  /tests                   # Domain tests
  /types                   # TypeScript types
  /utils                   # Utilities
```

---

## Key Differences from Bloodwork

| Aspect | Bloodwork | Condition |
|--------|-----------|-----------|
| **Input** | Numeric markers | Clinical documents |
| **Trends** | Line charts | Narrative timeline |
| **Changes** | Value deltas | Language shifts |
| **Gemma Focus** | Explain numbers | Explain narrative |
| **Entry Flow** | Manual/OCR | Document upload |

**Everything else is identical.**

---

## Design Principles

### 1. Mirror Bloodwork Structure
Condition Management deliberately mirrors Bloodwork to:
- Reduce cognitive load for users
- Reuse proven patterns
- Maintain consistency
- Enable rapid understanding

### 2. Narrative, Not Numeric
- No charts for condition progression
- Timeline-based views
- Change markers, not deltas
- Story comprehension, not quantification

### 3. Clinical Document Respect
- Preserve original language
- Attribute to clinician
- Date and context always visible
- Never edit or paraphrase source

### 4. Gemma as Bridge
- Same warm, peer voice
- Same boundaries (no diagnosis/treatment)
- Different input type (narrative vs. numeric)
- Same output (understanding + questions)

---

## User Journey

### Adding an Entry
1. User receives clinic letter
2. User uploads document or pastes text
3. System captures metadata (date, clinician, type)
4. Entry saved and visible in timeline

### Understanding Changes
1. User views timeline
2. Gemma highlights what changed
3. User asks clarifying questions
4. Gemma converts confusion → consultation questions

### Preparing for Appointment
1. User reviews condition timeline
2. Gemma suggests relevant questions
3. User adds own questions
4. Questions organized by priority

---

## Integration Points

### Database
- `condition_entries` — Document storage
- `condition_metadata` — Author, date, type
- `condition_consultation_questions` — Prep questions
- `condition_care_team` — Key contacts
- `condition_support_access` — Trusted support

### Edge Functions
- `condition-ai-respond` — Gemma analysis
- `condition-entries` — CRUD operations
- `condition-consultation-prep` — Question management
- `condition-key-contacts` — Care team
- `condition-support-access` — Access control

### Gemma
- Core canon: `/gemma/core`
- Domain rules: `/gemma/domains/condition`

---

## Related Documentation

- `ARCHITECTURE.md` — Technical design
- `CURRENT_STATUS.md` — Build status
- `docs/CONDITION_ENTRIES.md` — Entry management
- `docs/CONDITION_TRENDS.md` — Timeline & progression
- `docs/CONDITION_AI_ANALYSIS.md` — Gemma integration
- `docs/CONDITION_CONSULTATION_PREP.md` — Question builder
- `/gemma/domains/condition/README.md` — Gemma rules

---

## Parity Statement

**Condition Management mirrors Bloodwork Management in structure, behavior, and UX, with only the documented variances.**

Areas of parity:
- Consultation Prep (100%)
- Key Contacts (100%)
- Support Access (100%)
- AI boundaries (100%)
- UI patterns (95%)
- Data architecture (90%)

Areas of intentional variance:
- Input type (documents vs. numbers)
- Trend visualization (timeline vs. charts)
- Gemma analysis focus (narrative vs. numeric)

---

**Built:** 2026-02-02
**Reference:** Bloodwork Management
**Status:** Production-ready

---

## 🔒 Domain Contract & Change Control

**This domain is LOCKED and under strict change control.**

### Domain Boundaries

This domain is **self-contained** and must remain independent:

- ✅ All condition management logic lives in `/products/condition/`
- ✅ All condition-specific edge functions are prefixed with `condition-*`
- ✅ All condition UI routes live in `/app/(tabs)/medical/condition/`
- ✅ All condition types are defined in `/products/condition/types/`
- ❌ NO imports from `/products/bloodwork/` or other product domains
- ❌ NO shared medical business logic outside this folder

### Permitted Cross-Domain Dependencies

The ONLY allowed cross-domain dependencies are:

1. **Infrastructure** (read-only):
   - `/lib/supabase.ts` - Supabase client
   - `/config/theme.ts` - Design system
   - `/config/environment.ts` - Environment variables
   - `/contexts/AuthContext.tsx` - Authentication state

2. **Shared Services** (explicitly designed for multi-product use):
   - `/services/gemma-conversation.service.ts` - Message storage
   - `/services/user-preferences.service.ts` - User preferences (future)

3. **Database** (via RLS-protected tables):
   - `auth.users` - Authentication
   - `profiles` - User profiles
   - `gemma_conversations` - Gemma message history

**NO OTHER CROSS-DOMAIN DEPENDENCIES ARE PERMITTED.**

### Change Freeze Rules

#### What Requires Approval

- ❌ New features or capabilities
- ❌ New files or folders
- ❌ New edge functions
- ❌ Data model changes
- ❌ AI behavior changes
- ❌ UX/UI structural changes
- ❌ Imports from other product domains
- ❌ Architectural refactoring
- ❌ "Improvements" not explicitly requested

#### What Is Allowed (Without Approval)

- ✅ Critical bug fixes only
- ✅ Security patches
- ✅ Documentation clarifications

### Domain Ownership

**Owner:** Condition Management Product Team

All changes to this domain must be:
1. Explicitly requested
2. Scoped to this domain only
3. Documented in domain-specific docs
4. Approved before implementation

### Questions?

Read this README and `/products/condition/ARCHITECTURE.md` before making any changes.

If you're unsure whether a change requires approval, **it does**.

**Domain Locked:** 2026-02-05
