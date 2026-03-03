# Bloodwork Management Product

**Status**: Phase 1 - Manual Entry MVP
**Owner**: Bloodwork Product Team
**Created**: 2026-01-31

---

## Product Definition

**Purpose**: Help users rebuild blood test continuity when historical records are lost or scattered across multiple providers.

**Core Value**: Give users calm, clear visibility into their blood test history without medical judgment or interpretation.

---

## What This Product Does (Scope)

### Phase 1 (Current)
- Accept manual entry of blood test results
- Support partial panels (all markers optional)
- Store structured numeric marker data (CBC panel initially)
- Display test history in chronological timeline
- Allow deletion of tests
- Gentle validation (warns, never blocks)
- PHI safety warnings for free-text fields
- Persistent "For tracking only" disclaimers
- Zero judgment language (no status badges, colors, or interpretation)

### Future Phases (Not Yet Built)
- Document upload (PDF, photos)
- AI-assisted extraction
- Educational marker explanations (bounded AI)
- Trend visualization
- Appointment preparation support

---

## What This Product Does NOT Do (Boundaries)

This is **not** a medical records system. Bloodwork Management:

- Does NOT store original medical documents long-term
- Does NOT provide clinical interpretation
- Does NOT diagnose conditions
- Does NOT recommend treatments
- Does NOT predict outcomes
- Does NOT replace healthcare providers
- Does NOT integrate with EHR systems
- Does NOT handle non-blood-test medical records

---

## Data Model

### Tables Owned by This Product

1. **`blood_tests`**
   - Test date, location/lab
   - User-scoped via RLS
   - Timestamps for audit trail

2. **`blood_markers`**
   - Individual marker values (WBC, HGB, etc.)
   - Linked to parent test
   - Value, unit, reference range
   - User-editable

3. **`marker_definitions`** (Future)
   - Metadata about markers
   - Educational content
   - Standard reference ranges

### Data Ownership Rules

- All data is user-scoped (RLS enforced)
- No joins or dependencies on other medical tables
- No shared state with other Path9 products
- User can delete all bloodwork data without affecting other products

---

## Privacy & Trust Model

### PHI Minimization by Design

- **No document storage**: When document upload is added, files are processed transiently and immediately discarded
- **Structured data only**: Only numeric values, dates, and units are stored
- **User control**: Users can view, edit, or delete any test at any time
- **Explicit consent**: Clear messaging about what data is stored

### Privacy Statement (User-Facing)

> "Path9 is not a medical records system. Bloodwork Management helps you organize and understand your blood test numbers. We do not store your original lab reports. Only the numeric values you choose to save are retained."

---

## AI Guardrails (When AI is Added)

When AI features are introduced, they operate under **stricter rules** than main Gemma:

### AI May:
- Explain what a marker measures (educational)
- Describe factual numeric changes over time
- Compare values to standard healthy ranges
- Help prepare questions for doctors

### AI Must NEVER:
- Diagnose conditions
- Interpret clinical meaning
- Predict health outcomes
- Recommend treatments
- Judge results as "good" or "bad"
- Create urgency or alarm

### Implementation:
- Separate AI conversation context (not main Gemma orchestrator)
- Dedicated prompts with medical safety boundaries
- Explicit content filtering for forbidden phrases
- Clear visual separation in UI

---

## Product Independence

### Can Be:
- Disabled without breaking Path9
- Price-gated independently in the future
- Deleted entirely without affecting Medical pillar
- Extended with new features without touching other products

### Dependencies

#### Internal Dependencies (Path9 Codebase)
- **`/lib/supabase`** - Shared Supabase client configuration
- **`/config/environment`** - Environment variables and configuration
- **`/services/user-preferences.service`** - Manages saved lab locations
  - Lives outside product because it's designed for multi-product extensibility
  - Currently only bloodwork uses the `saved_locations` field
  - Acceptable shared service (documented dependency)

#### Framework Dependencies
- **`expo-router`** - Navigation framework (requires UI routes in `/app/`)
- **`expo-image-picker`** - Native image upload functionality
- **`@supabase/supabase-js`** - Supabase client library

#### External Services
- **Supabase Edge Function:** `analyze-bloodwork-image`
  - Uses Claude Vision API for image extraction
  - Lives in `/supabase/functions/` (required by Supabase)
  - Stateless, transient processing only
  - Images never persisted
- **Anthropic Claude Vision API** - For document extraction (ANTHROPIC_API_KEY required)

#### Database Dependencies
- **`auth.users`** table - User authentication (Supabase Auth)
- **`profiles`** table - User profiles
- **RLS (Row Level Security)** - User data isolation

### No Dependencies On
- Other medical products
- Generic medical tables
- Main Gemma orchestration
- Shared medical state

---

## Technical Architecture

### Folder Structure
```
/products/bloodwork/
├── README.md                    # This file
├── /components/                 # UI components
├── /services/                   # Client-side service layer
├── /types/                      # TypeScript interfaces
├── /migrations/                 # Database migrations
└── /docs/                       # Additional documentation
```

### UI Placement
```
Path9 Dashboard
  → Medical (navigation grouping)
    → Bloodwork Management (this product)
      → Timeline (list of tests)
      → New Test Entry (manual form)
      → Test Detail (view/edit single test)
```

**Important**: "Medical" is a navigation grouping, not a logic owner. All Bloodwork logic remains product-local.

---

## Phase 1 Success Criteria

A real user:
1. Lost historical blood records
2. Manually enters 3 tests with CBC markers (some incomplete panels)
3. Can clearly see dates, values, and reference ranges
4. Encounters no judgment language (no "high", "low", "normal", "abnormal")
5. Sees persistent disclaimers that this is tracking only
6. Receives gentle validation if values look unusual (never blocking)
7. Is warned not to include personal identifiers in notes
8. Feels calmer, not judged or alarmed

**Result**: Phase 1 is complete when a real user can do this comfortably.

---

## Marker Coverage (Phase 1)

### CBC Panel (Complete Blood Count)
- **WBC** (White Blood Cell Count)
- **RBC** (Red Blood Cell Count)
- **HGB** (Hemoglobin)
- **HCT** (Hematocrit)
- **MCV** (Mean Corpuscular Volume)
- **MCH** (Mean Corpuscular Hemoglobin)
- **MCHC** (Mean Corpuscular Hemoglobin Concentration)
- **PLT** (Platelet Count)
- **LYM** (Lymphocytes)
- **MXD** (Mid-Range Cells)
- **NEUT** (Neutrophils)
- **RDW-SD** (Red Cell Distribution Width - Standard Deviation)
- **RDW-CV** (Red Cell Distribution Width - Coefficient of Variation)
- **PDW** (Platelet Distribution Width)
- **MPV** (Mean Platelet Volume)
- **PLCR** (Platelet Large Cell Ratio)

Future phases may include metabolic panels, liver function, kidney function, etc.

---

## Future Roadmap (Not Yet Committed)

### Phase 2: Document Upload
- Camera/file upload
- Transient processing (no long-term storage)
- AI-assisted extraction
- Manual review/confirmation flow

### Phase 3: AI Education
- Marker explanations
- Factual trend descriptions
- Bounded conversation context
- Safety-first guardrails

### Phase 4: Visualization
- Multi-test comparison
- Trend charts
- Reference range visualization
- Time-based filtering

### Phase 5: Appointment Support
- Export for appointments
- Question preparation
- Summary generation
- Care team context

---

## Contact & Governance

**Questions about scope?** Check this README first.
**Proposing changes?** Consider product boundaries and independence.
**Adding dependencies?** Ensure they don't couple to other Path9 products.

This product is designed to stand alone. Keep it that way.

---

## 🔒 Domain Contract & Change Control

**This domain is LOCKED and under strict change control.**

### Domain Boundaries

This domain is **self-contained** and must remain independent:

- ✅ All bloodwork logic lives in `/products/bloodwork/`
- ✅ All bloodwork-specific edge functions are prefixed with `bloodwork-*` or `analyze-bloodwork-*`
- ✅ All bloodwork UI routes live in `/app/(tabs)/medical/bloodwork/`
- ✅ All bloodwork types are defined in `/products/bloodwork/types/`
- ❌ NO imports from `/products/condition/` or other product domains
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
   - `/services/user-preferences.service.ts` - User preferences (`saved_locations`, `bloodwork_sex`, `bloodwork_age_group`)

3. **Database** (via RLS-protected tables):
   - `auth.users` - Authentication
   - `profiles` - User profiles
   - `user_preferences` - Saved locations and bloodwork profile
   - `gemma_conversations` - Gemma message history

**NO OTHER CROSS-DOMAIN DEPENDENCIES ARE PERMITTED.**

### Change Freeze Rules

#### What Requires Approval

- ❌ New features or capabilities
- ❌ New files or folders
- ❌ New edge functions
- ❌ Data model changes
- ❌ AI behavior changes (safety boundaries, prompts, guardrails)
- ❌ UX/UI structural changes
- ❌ Imports from other product domains
- ❌ Architectural refactoring
- ❌ "Improvements" not explicitly requested

#### What Is Allowed (Without Approval)

- ✅ Critical bug fixes only
- ✅ Security patches
- ✅ Documentation clarifications

### Domain Ownership

**Owner:** Bloodwork Management Product Team

All changes to this domain must be:
1. Explicitly requested
2. Scoped to this domain only
3. Documented in domain-specific docs
4. Approved before implementation

### Questions?

Read this README and `/products/bloodwork/ARCHITECTURE.md` before making any changes.

If you're unsure whether a change requires approval, **it does**.

**Domain Locked:** 2026-02-05
