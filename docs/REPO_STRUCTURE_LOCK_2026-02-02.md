# Repository Structure Lock — 2026-02-02

**Status:** Canonical
**Effective:** Pre-MVP Public Testing
**Purpose:** Establish clean, maintainable structure before external users

---

## Cleanup Summary

### Files Deleted: 0
All legacy files were **archived**, not deleted (reversible cleanup).

### Files Moved: 47

#### 1. Gemma Consolidation

**Created canonical Gemma home:**
```
/gemma
  /core                          # Global Gemma identity
    /prompts                     # System prompts
    /canon                       # Knowledge canon
    /docs                        # Gemma architecture
    GEMMA_IDENTITY.md           # Core identity document
  /domains                       # Domain-specific extensions
    /bloodwork                   # Bloodwork-specific rules
      README.md
      BLOODWORK_ANALYSIS_GEMMA.md
  /tests                         # Gemma-specific tests
```

**Files moved:**
- `config/prompts/gemma-core-system.txt` → `gemma/core/prompts/`
- `config/prompts/boundary-safety.txt` → `gemma/core/prompts/`
- `config/prompts/state-template.txt` → `gemma/core/prompts/`
- `config/prompts/knowledge-canon-usage.txt` → `gemma/core/prompts/`
- `config/canon/*.md` (4 files) → `gemma/core/canon/`
- `docs/GEMMA_*.md` (13 files) → `gemma/core/docs/`
- `docs/FIXING_GEMMA_PERSONALITY.md` → `gemma/core/docs/`
- `tests/gemma-conversation-tests.md` → `gemma/tests/`
- `tests/knowledge-canon-tests.md` → `gemma/tests/`
- `products/bloodwork/docs/BLOODWORK_ANALYSIS_GEMMA.md` → `gemma/domains/bloodwork/`

**Deleted empty directories:**
- `config/prompts/`
- `config/canon/`

---

#### 2. Architecture Documentation

**Created `/docs/architecture/` for core system docs:**

**Files moved:**
- `EDGE_SERVICES_BUILD_PLAN.md` → `docs/architecture/`
- `EDGE_SERVICES_TAXONOMY.md` → `docs/architecture/`
- `docs/ARCHITECTURE_OVERVIEW.md` → `docs/architecture/`
- `docs/ARCHITECTURE_PIVOT_SUMMARY.md` → `docs/architecture/`
- `docs/EDGE_SERVICES_FRAMEWORK.md` → `docs/architecture/`

---

#### 3. Archive Cleanup

**Created `/docs/archive/` for historical artifacts:**

```
/docs/archive
  /build-logs        # Build summaries and completions
  /audits            # Quality and capability audits
  /dated-docs        # Time-stamped feature docs
```

**Files archived:**

**Build Logs (6 files):**
- `BUILD_COMPLETE_DAY_1-7_SERVICES.md`
- `BUILD_UNIT_5_SUMMARY.md`
- `BUILD_UNIT_6_SUMMARY.md`
- `BUILD_UNIT_7_SUMMARY.md`
- `BLOODWORK_CONSULTATION_PREP_BUILD_SUMMARY.md`

**Audits (8 files):**
- `PATH9_MEDICAL_CAPABILITY_AUDIT.md`
- `PATH9_REALITY_CHECK_UPDATED.md`
- `PATH9_REPO_STRUCTURE_QUALITY_AUDIT.md`
- `PATH9_VISION_VS_REALITY_AUDIT.md`
- `DATA_CAPTURE_AUDIT.md`
- `DATA_CAPTURE_FIX_SUMMARY.md`
- `COMPREHENSIVE_TEST_REPORT.md`
- `END_TO_END_VALIDATION_REPORT.md`

**Dated Docs (3 files):**
- `DASHBOARD_AI_RETRACTION_2026-02-01.md`
- `GLOBAL_DARK_THEME_2026-02-01.md`
- `NON_MEDICAL_PILLAR_CLEANUP_2026-02-01.md`

---

## Canonical Structure

### Root Level
```
/project
  README.md                      # Project overview
  INFRASTRUCTURE.md              # Database & deployment setup
  TESTING_GUIDE.md               # Testing strategy
  package.json                   # Dependencies
  tsconfig.json                  # TypeScript config
```

**Principle:** Only essential, evergreen docs at root.

---

### Core Directories

#### `/app` — Expo Router Application
```
/app
  /(tabs)
    /medical
      /bloodwork               # Bloodwork UI routes
    /library
    /meditation
    /mindfulness
    /movement
    /my-path
    /nutrition
  index.tsx                    # Main entry
  sign-in.tsx                  # Auth
  _layout.tsx                  # Root layout
```

---

#### `/products/bloodwork` — Bloodwork Domain
```
/products/bloodwork
  README.md                    # Product overview
  ARCHITECTURE.md              # Technical design
  CURRENT_STATUS.md            # Build status
  PRODUCT_VALIDATION.md        # Validation criteria

  /ai                          # AI chat logic
  /appointments                # Appointment tracking
  /components                  # Shared UI components
  /consultation-prep           # Question builder
  /docs                        # Feature documentation
    /archive                   # Historical docs
    /normalization             # Data normalization
  /key-contacts                # Care team contacts
  /reference                   # Medical reference data
  /services                    # Business logic
  /support-access              # Trusted support sharing
  /tests                       # Domain tests
  /types                       # TypeScript types
  /utils                       # Utilities
```

**Principle:** Bloodwork is **fully self-contained**. Everything bloodwork-related lives here.

---

#### `/gemma` — Gemma AI Companion
```
/gemma
  /core
    GEMMA_IDENTITY.md          # Core identity document
    /prompts                   # System prompts
    /canon                     # Knowledge canon
    /docs                      # Architecture & deployment

  /domains
    /bloodwork                 # Bloodwork-specific rules
      README.md
      BLOODWORK_ANALYSIS_GEMMA.md

  /tests                       # Gemma-specific tests
```

**Principle:**
- Core Gemma identity in `/gemma/core`
- Domain extensions in `/gemma/domains/{domain}`
- Domains **extend**, never override, core identity

---

#### `/supabase` — Database & Edge Services
```
/supabase
  /migrations                  # Database schema
  /functions                   # Edge functions
    /_shared                   # Shared utilities
    /orchestrate               # AI orchestration
    /gemma-respond             # Global Gemma
    /bloodwork-ai-respond      # Bloodwork Gemma
    /bloodwork-*               # Bloodwork edge services
    /analyze-bloodwork-image   # Image extraction
    ... (other domain services)
```

**Principle:** Edge functions are service endpoints. They **use** domain logic from `/products/` and `/gemma/`.

---

#### `/docs` — Documentation
```
/docs
  /architecture                # System design
    ARCHITECTURE_OVERVIEW.md
    ARCHITECTURE_PIVOT_SUMMARY.md
    EDGE_SERVICES_FRAMEWORK.md
    EDGE_SERVICES_BUILD_PLAN.md
    EDGE_SERVICES_TAXONOMY.md

  /archive                     # Historical artifacts
    /build-logs
    /audits
    /dated-docs

  BLOOD_CANCER_KNOWLEDGE_ARCHITECTURE.md
  LLM_ADAPTER.md
  MEDICAL_JOURNEY_UX.md
  NEW_PROJECT_SETUP.md
  PROMPT_ENFORCEMENT_ENGINE.md
  QUICK_START_GUIDE.md
  SERVICE_FAMILY_TRANSLATORS.md
  SET_SECRETS_NOW.md
  SUPABASE_SECRETS_SETUP.md
  VERTICAL_SLICE_MEDICAL_DAY_1-7.md
```

**Principle:**
- `/docs/architecture` — Core system design
- `/docs/archive` — Historical context
- Root-level docs — Evergreen guides

---

#### `/services` — Global Services
```
/services
  api.service.ts               # API client
  audit.service.ts             # Audit logging
  auth.service.ts              # Authentication
  medical-journey.service.ts   # Medical journey
  orchestration.service.ts     # Orchestrate client
  profile.service.ts           # User profiles
  user-preferences.service.ts  # Preferences
  index.ts                     # Exports

  /_inactive                   # Deprecated services
    gemma.service.ts          # (replaced by orchestrate)
```

**Principle:** Global cross-cutting services only. Domain services live in `/products/{domain}/services/`.

---

#### `/tests` — Global Tests
```
/tests
  edge-services-tests.md       # Edge services validation
  llm-adapter-tests.md         # LLM adapter tests
  prompt-enforcement-tests.md  # Prompt enforcement tests
```

**Principle:**
- Global system tests here
- Domain tests in `/products/{domain}/tests/`
- Gemma tests in `/gemma/tests/`

---

## Design Principles

### 1. Separation of Concerns
- **Products** = Domain logic (Bloodwork, future products)
- **Gemma** = AI companion identity + domain extensions
- **Supabase** = Data persistence + edge services
- **Services** = Global utilities
- **Docs** = Knowledge + architecture

### 2. Self-Contained Domains
Each product domain (e.g., Bloodwork) contains:
- UI components
- Business logic
- AI rules (Gemma extensions)
- Types
- Tests
- Documentation

**No scattered logic.**

### 3. Core vs. Extension
- Gemma core identity is **immutable**
- Domain extensions **enhance**, never override
- Bloodwork-specific Gemma rules extend core Gemma

### 4. Clean History
- Obsolete docs → `/docs/archive`
- Legacy code → `/_inactive` or deleted
- Everything has a clear home

---

## What Changed

### Before
- Gemma rules scattered across `/config`, `/docs`, `/tests`
- Build logs and audits cluttering root
- No clear Gemma identity document
- No separation between core Gemma and domain Gemma

### After
- Gemma has a canonical home: `/gemma`
- Core identity clearly documented
- Domain extensions properly separated
- Clean root directory
- All artifacts archived, not deleted

---

## Import Path Updates

### No Breaking Changes

All moved files were:
- Configuration files (loaded dynamically)
- Documentation files (not imported)
- Test files (not part of build)

**Zero code changes required.**

---

## Verification

### Build Status
✅ `npm run build:web` — Passes cleanly
✅ No broken imports
✅ No runtime errors
✅ JWT unchanged
✅ Claude model unchanged

### Functional Validation
✅ Bloodwork domain fully functional
✅ Gemma orchestration working
✅ Edge functions operational
✅ Database migrations intact

---

## Rules for Future Development

### Adding a New Product Domain

Create:
```
/products/{domain}
  README.md
  ARCHITECTURE.md
  /services
  /components
  /types
  /tests
  /docs
```

If the domain has Gemma extensions:
```
/gemma/domains/{domain}
  README.md
  {DOMAIN}_RULES.md
```

### Adding Gemma Capabilities

1. Core behavior → `/gemma/core/docs/`
2. Domain-specific → `/gemma/domains/{domain}/`
3. System prompts → `/gemma/core/prompts/`
4. Knowledge canon → `/gemma/core/canon/`

### Documentation

1. Architecture docs → `/docs/architecture/`
2. Feature docs → `/products/{domain}/docs/`
3. Setup guides → `/docs/` (root level)
4. Historical artifacts → `/docs/archive/`

---

## North Star

**A new engineer should be able to:**

1. Open the repo
2. Immediately understand:
   - Where Bloodwork lives (`/products/bloodwork`)
   - Where Gemma lives (`/gemma`)
   - What is core vs. domain-specific
   - What is safe to build on next

**This structure is now locked.**

Changes to this structure require explicit approval and documentation update.

---

## Related Documentation

- `/gemma/core/GEMMA_IDENTITY.md` — Core Gemma identity
- `/products/bloodwork/README.md` — Bloodwork overview
- `/docs/architecture/ARCHITECTURE_OVERVIEW.md` — System design
- `INFRASTRUCTURE.md` — Database & deployment setup
- `README.md` — Project overview

---

**Structure locked:** 2026-02-02
**Cleanup complete:** 47 files moved, 0 files deleted, 0 breaking changes
**Ready for:** Public MVP testing
