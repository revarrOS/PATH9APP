# Canonical Repository Structure — Visual Map

**Effective:** 2026-02-02
**Status:** Locked

---

## Complete Directory Structure

```
/project
├── README.md                           # Project overview
├── INFRASTRUCTURE.md                   # Database & deployment
├── TESTING_GUIDE.md                    # Testing strategy
│
├── /app                                # Expo Router application
│   ├── index.tsx                       # Main entry
│   ├── sign-in.tsx                     # Authentication
│   ├── _layout.tsx                     # Root layout
│   ├── +not-found.tsx                  # 404 handler
│   └── /(tabs)                         # Tab navigation
│       ├── index.tsx                   # Home tab
│       ├── library.tsx
│       ├── meditation.tsx
│       ├── mindfulness.tsx
│       ├── movement.tsx
│       ├── my-path.tsx
│       ├── nutrition.tsx
│       └── /medical                    # Medical tab
│           └── /bloodwork              # Bloodwork UI routes
│               ├── index.tsx           # Bloodwork hub
│               ├── /entry
│               ├── /trends
│               ├── /analysis
│               ├── /consultation-prep
│               ├── /appointments
│               ├── /key-contacts
│               └── /support-access
│
├── /products                           # Product domains
│   └── /bloodwork                      # Bloodwork domain (SELF-CONTAINED)
│       ├── README.md                   # Product overview
│       ├── ARCHITECTURE.md             # Technical design
│       ├── CURRENT_STATUS.md           # Build status
│       ├── PRODUCT_VALIDATION.md       # Validation criteria
│       ├── /ai                         # Bloodwork AI logic
│       ├── /appointments               # Appointment tracking
│       ├── /components                 # Shared UI components
│       ├── /consultation-prep          # Question builder
│       ├── /key-contacts               # Care team contacts
│       ├── /reference                  # Medical reference data
│       ├── /services                   # Business logic
│       ├── /support-access             # Trusted support
│       ├── /tests                      # Domain tests
│       ├── /types                      # TypeScript types
│       ├── /utils                      # Utilities
│       └── /docs                       # Feature docs
│           ├── /archive
│           └── /normalization
│
├── /gemma                              # Gemma AI Companion (CANONICAL HOME)
│   ├── /core                           # Global Gemma identity
│   │   ├── GEMMA_IDENTITY.md           # Core identity document
│   │   ├── /prompts                    # System prompts
│   │   │   ├── gemma-core-system.txt
│   │   │   ├── boundary-safety.txt
│   │   │   ├── state-template.txt
│   │   │   └── knowledge-canon-usage.txt
│   │   ├── /canon                      # Knowledge canon
│   │   │   ├── goal-setting-basics.md
│   │   │   ├── habit-formation-principles.md
│   │   │   ├── overcoming-resistance.md
│   │   │   └── reflection-practices.md
│   │   └── /docs                       # Gemma architecture
│   │       ├── GEMMA_ARCHITECTURE_LOCKED_2026-02-02.md
│   │       ├── GEMMA_CANON_CONTRACT.md
│   │       ├── GEMMA_CONVERSATION.md
│   │       ├── GEMMA_DEPLOYMENT_VERIFICATION_2026-02-02.md
│   │       ├── GEMMA_DEPTH_LADDER.md
│   │       ├── GEMMA_GLOBAL_PARITY_2026-02-02.md
│   │       ├── GEMMA_GLOBAL_ROLLOUT.md
│   │       ├── GEMMA_IMPLEMENTATION_STATUS.md
│   │       ├── GEMMA_INTENT_DECISION_MATRIX.md
│   │       ├── GEMMA_LEVEL_UP_2026-02-02.md
│   │       ├── GEMMA_LIBERATION_SUMMARY.md
│   │       ├── GEMMA_RULES_OF_BEING.md
│   │       ├── GEMMA_SYSTEM_MAP.md
│   │       └── FIXING_GEMMA_PERSONALITY.md
│   ├── /domains                        # Domain-specific extensions
│   │   └── /bloodwork                  # Bloodwork Gemma rules
│   │       ├── README.md
│   │       └── BLOODWORK_ANALYSIS_GEMMA.md
│   └── /tests                          # Gemma tests
│       ├── gemma-conversation-tests.md
│       └── knowledge-canon-tests.md
│
├── /supabase                           # Database & edge services
│   ├── /migrations                     # Database schema
│   │   └── *.sql                       # Migration files
│   └── /functions                      # Edge functions
│       ├── /_shared                    # Shared utilities
│       ├── /orchestrate                # AI orchestration hub
│       ├── /gemma-respond              # Global Gemma
│       ├── /bloodwork-ai-respond       # Bloodwork Gemma
│       ├── /bloodwork-key-contacts     # Key contacts API
│       ├── /bloodwork-support-access   # Support access API
│       ├── /analyze-bloodwork-image    # Image extraction
│       └── ... (other services)
│
├── /services                           # Global services
│   ├── api.service.ts                  # API client
│   ├── audit.service.ts                # Audit logging
│   ├── auth.service.ts                 # Authentication
│   ├── medical-journey.service.ts      # Medical journey
│   ├── orchestration.service.ts        # Orchestrate client
│   ├── profile.service.ts              # User profiles
│   ├── user-preferences.service.ts     # Preferences
│   ├── index.ts                        # Exports
│   └── /_inactive                      # Deprecated
│
├── /docs                               # Documentation
│   ├── /architecture                   # System design
│   │   ├── ARCHITECTURE_OVERVIEW.md
│   │   ├── ARCHITECTURE_PIVOT_SUMMARY.md
│   │   ├── EDGE_SERVICES_FRAMEWORK.md
│   │   ├── EDGE_SERVICES_BUILD_PLAN.md
│   │   └── EDGE_SERVICES_TAXONOMY.md
│   ├── /archive                        # Historical artifacts
│   │   ├── /build-logs
│   │   ├── /audits
│   │   └── /dated-docs
│   ├── BLOOD_CANCER_KNOWLEDGE_ARCHITECTURE.md
│   ├── CANONICAL_STRUCTURE_MAP.md      # This file
│   ├── CLEANUP_COMPLETE_2026-02-02.md
│   ├── LLM_ADAPTER.md
│   ├── MEDICAL_JOURNEY_UX.md
│   ├── NEW_PROJECT_SETUP.md
│   ├── PROMPT_ENFORCEMENT_ENGINE.md
│   ├── QUICK_START_GUIDE.md
│   ├── REPO_STRUCTURE_LOCK_2026-02-02.md
│   ├── SERVICE_FAMILY_TRANSLATORS.md
│   ├── SET_SECRETS_NOW.md
│   ├── SUPABASE_SECRETS_SETUP.md
│   └── VERTICAL_SLICE_MEDICAL_DAY_1-7.md
│
├── /tests                              # Global system tests
│   ├── edge-services-tests.md
│   ├── llm-adapter-tests.md
│   └── prompt-enforcement-tests.md
│
├── /config                             # Configuration
│   ├── environment.ts                  # Environment setup
│   └── theme.ts                        # Theme configuration
│
├── /contexts                           # React contexts
│   └── AuthContext.tsx
│
├── /components                         # Global UI components
│   ├── AppointmentCard.tsx
│   ├── DiagnosisExplainer.tsx
│   ├── NextStepsStrip.tsx
│   ├── ProgressIndicator.tsx
│   └── TimelineVisualization.tsx
│
├── /hooks                              # React hooks
│   └── useFrameworkReady.ts
│
├── /lib                                # Libraries
│   └── supabase.ts
│
├── /types                              # Global types
│   ├── env.d.ts
│   ├── prompts.ts
│   └── request-envelope.ts
│
├── /scripts                            # Database seeds
│   ├── seed-blood-cancer-medical-facts-example.sql
│   └── seed-medical-journey.sql
│
└── /assets                             # Static assets
    └── /images
```

---

## Key Principles

### 1. Separation of Concerns

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `/app` | UI routes | Screens, navigation |
| `/products` | Domain logic | Bloodwork, future products |
| `/gemma` | AI companion | Identity, prompts, extensions |
| `/supabase` | Data & services | Database, edge functions |
| `/services` | Global utilities | Auth, API client |
| `/docs` | Knowledge | Architecture, guides |

### 2. Self-Contained Domains

Each product domain contains:
- UI components
- Business logic
- AI rules (Gemma extensions)
- Types
- Tests
- Documentation

**No scattered logic.**

### 3. Core vs. Extension

- **Gemma core** (`/gemma/core`) = Immutable identity
- **Gemma domains** (`/gemma/domains/{domain}`) = Domain enhancements
- Domains extend, never override

### 4. Clean History

- Active work → Primary locations
- Legacy artifacts → `/docs/archive`
- Deprecated code → `/_inactive` or deleted

---

## Navigation Guide

### "Where do I find...?"

| Looking for... | Location |
|----------------|----------|
| **Bloodwork product** | `/products/bloodwork` |
| **Bloodwork UI** | `/app/(tabs)/medical/bloodwork` |
| **Bloodwork AI rules** | `/gemma/domains/bloodwork` |
| **Bloodwork edge services** | `/supabase/functions/bloodwork-*` |
| **Core Gemma identity** | `/gemma/core/GEMMA_IDENTITY.md` |
| **Gemma prompts** | `/gemma/core/prompts` |
| **Gemma knowledge canon** | `/gemma/core/canon` |
| **System architecture** | `/docs/architecture` |
| **Database schema** | `/supabase/migrations` |
| **Global services** | `/services` |
| **Global UI components** | `/components` |
| **Historical docs** | `/docs/archive` |

---

## Adding New Features

### New Product Domain

1. Create `/products/{domain}`
2. Add domain structure:
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
3. If AI-enabled, create `/gemma/domains/{domain}`

### New Gemma Capability

1. **Core behavior** → `/gemma/core/docs/`
2. **Domain-specific** → `/gemma/domains/{domain}/`
3. **System prompts** → `/gemma/core/prompts/`
4. **Knowledge canon** → `/gemma/core/canon/`

### New Documentation

1. **Architecture** → `/docs/architecture/`
2. **Feature docs** → `/products/{domain}/docs/`
3. **Setup guides** → `/docs/` (root level)
4. **Historical** → `/docs/archive/`

---

## Anti-Patterns (DO NOT DO)

❌ **Scattered domain logic**
```
Bad:
  /utils/bloodwork-helper.ts
  /lib/bloodwork-formatter.ts
  /services/bloodwork.service.ts

Good:
  /products/bloodwork/utils/helper.ts
  /products/bloodwork/utils/formatter.ts
  /products/bloodwork/services/bloodwork.service.ts
```

❌ **Gemma logic outside /gemma**
```
Bad:
  /config/gemma-prompts/
  /lib/gemma-identity.ts
  /utils/gemma-helpers.ts

Good:
  /gemma/core/prompts/
  /gemma/core/GEMMA_IDENTITY.md
  (helpers should be in edge functions or orchestrate)
```

❌ **Documentation clutter**
```
Bad:
  /BUILD_SUMMARY_2026-01-15.md (root)
  /FIX_LOG_AUTH_BUG.md (root)
  /AUDIT_BLOODWORK.md (root)

Good:
  /docs/archive/build-logs/BUILD_SUMMARY_2026-01-15.md
  /products/bloodwork/docs/archive/FIX_LOG_AUTH_BUG.md
  /docs/archive/audits/AUDIT_BLOODWORK.md
```

❌ **Empty config subdirectories**
```
Bad:
  /config/prompts/ (empty)
  /config/canon/ (empty)

Good:
  (directories removed if empty)
```

---

## Enforcement

This structure is **locked** as of 2026-02-02.

Changes require:
1. Explicit approval
2. Documentation update
3. Build verification

**No exceptions.**

---

## Related Documentation

- `docs/REPO_STRUCTURE_LOCK_2026-02-02.md` — Full structure definition
- `docs/CLEANUP_COMPLETE_2026-02-02.md` — Cleanup execution log
- `gemma/core/GEMMA_IDENTITY.md` — Core Gemma identity
- `products/bloodwork/README.md` — Bloodwork overview
- `README.md` — Project overview

---

**Map created:** 2026-02-02
**Structure locked:** Yes
**Ready for:** Public MVP testing
