# Gemma - Personal Development Companion

Mobile-first application with AI-powered conversation and secure backend.

**STATUS: ✅ Units 1-7 Complete**
- ✅ Unit 1: Infrastructure Skeleton
- ✅ Unit 2: Policy & Audit Isolation
- ✅ Unit 3: Prompt Enforcement Engine
- ✅ Unit 4: Knowledge Canon
- ✅ Unit 5: LLM Adapter
- ✅ Unit 6: Single-Turn Conversation Endpoint
- ✅ Unit 7: Minimal Mobile UI Shell

**CURRENT PHASE:** Human tone testing via minimal UI

## Architecture Overview

### Backend Services
- **Supabase Database**: PostgreSQL with Row Level Security
- **Authentication**: Email/password auth via Supabase Auth
- **Edge Functions**:
  - `gemma-respond` - Single-turn conversation endpoint
  - `orchestrate` - LLM adapter and prompt assembly
  - `health` - Health check endpoint
- **Knowledge Canon**: Markdown-based content in database
- **Prompt Registry**: System prompts with enforcement
- **Audit System**: Comprehensive event logging (metadata only)

### Frontend
- **Framework**: Expo (React Native)
- **Navigation**: Expo Router with bottom tabs
- **State Management**: React Context API
- **UI Design**: Calm, minimal, neutral colors
- **Screens**: Today (conversation), My Path (static), Library (static)

## Project Structure

```
project/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Bottom tab navigation
│   │   ├── index.tsx             # Today screen (conversation)
│   │   ├── my-path.tsx           # My Path tab (static)
│   │   └── library.tsx           # Library tab (static)
│   ├── index.tsx                 # Loading/redirect screen
│   └── sign-in.tsx               # Authentication screen
├── config/                       # Environment & canon storage
│   ├── canon/                    # Knowledge canon markdown files
│   └── prompts/                  # System prompt files
├── contexts/                     # React contexts
│   └── AuthContext.tsx           # Authentication state
├── lib/                          # Core libraries
│   └── supabase.ts               # Supabase client
├── services/                     # Business logic services
│   ├── auth.service.ts           # Authentication
│   ├── profile.service.ts        # User profiles
│   ├── audit.service.ts          # Audit logging
│   ├── orchestration.service.ts  # Orchestration wrapper
│   └── gemma.service.ts          # Gemma conversation API
├── supabase/
│   ├── functions/                # Edge Functions
│   │   ├── gemma-respond/        # Conversation endpoint
│   │   ├── orchestrate/          # LLM adapter & prompts
│   │   └── health/               # Health check
│   └── migrations/               # Database migrations
├── tests/                        # Test documentation
│   ├── gemma-conversation-tests.md
│   └── [other test files]
├── types/                        # TypeScript types
└── docs/                         # Documentation
    └── GEMMA_CONVERSATION.md     # API docs
```

## Database Schema

### Core Tables

#### `profiles`
User profile information with user isolation
- `user_id` (uuid, PK) - Foreign key to auth.users.id
- `created_at`, `updated_at` (timestamptz)
- `timezone`, `locale` (text, nullable)

#### `audit_events`
Comprehensive audit logging (metadata only, no content)
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `event_type` (text) - e.g., policy_pass, llm_call_success
- `created_at` (timestamptz)
- `metadata` (jsonb) - Counts, IDs, versions only

#### `canon_documents` & `canon_chunks`
Knowledge canon storage
- Documents stored as markdown in config/canon/
- Chunks indexed in database for retrieval
- Searchable by journey_phase, pillar, keywords

#### `prompt_registry`
System prompt management
- Core prompts (gemma-core-system, boundary-safety, etc.)
- Version tracking
- Enforcement validation

### Security Requirements

**Database-Level Row Isolation:**
- RLS enabled on all tables
- Strict user isolation enforced at database level
- Users can ONLY access their own rows
- No admin bypass in code
- DELETE policies included for data management

**Audit Logging:**
- No sensitive content stored in metadata
- User-scoped queries only
- Indexed for performance

**Authentication:**
- Automatic profile creation on user signup via trigger
- Session management via Supabase Auth
- JWT-based authentication

## Edge Functions

### `/gemma-respond` (Unit 6)
Single-turn conversation endpoint
- POST only, authentication required
- Accepts user_message (1-1000 chars)
- Returns AI response with metadata
- No history, no memory, single-turn only
- Full audit trail (metadata only)

### `/orchestrate` (Unit 5)
LLM adapter with prompt assembly
- Canon retrieval (0-3 chunks)
- Prompt enforcement (4 core + optional canon)
- LLM call (OpenAI/Anthropic)
- Temperature ≤ 0.3 enforced

### `/health`
Public health check endpoint
- No authentication required
- Returns service status

## Environment Configuration

Three environment configurations:
- **Development**: `.env.development` - `EXPO_PUBLIC_API_ENV=development`
- **Staging**: `.env.staging` - `EXPO_PUBLIC_API_ENV=staging`
- **Production**: `.env.production` - `EXPO_PUBLIC_API_ENV=production`

All environments use the same Supabase instance for this build unit.

## Services

### Gemma Service (`gemma.service.ts`)
- Send message to Gemma
- Constructs request envelope
- Calls /gemma-respond endpoint
- Returns response with metadata

### Authentication Service (`auth.service.ts`)
- Sign up, sign in, sign out
- Session management

### Profile Service (`profile.service.ts`)
- User profile CRUD operations

### Audit Service (`audit.service.ts`)
- Event logging (metadata only)
- User-scoped queries

### Orchestration Service (`orchestration.service.ts`)
- Wrapper for orchestrate endpoint
- Used by gemma-respond internally

## Current Features (Units 1-7)

### Backend (Units 1-6)
- [x] Infrastructure skeleton with RLS
- [x] Policy enforcement & audit system
- [x] Prompt enforcement engine
- [x] Knowledge canon retrieval
- [x] LLM adapter (OpenAI/Anthropic)
- [x] Single-turn conversation endpoint
- [x] Comprehensive audit logging (metadata only)
- [x] NO message/response storage

### Mobile UI (Unit 7)
- [x] Bottom tab navigation (Today, My Path, Library)
- [x] Today screen - conversation with Gemma
- [x] Multiline input (1-1000 chars)
- [x] Send button with loading state
- [x] Response card (no history)
- [x] Calm "Thinking…" state
- [x] "Not medical advice" footer
- [x] My Path tab - 5 pillar cards (static)
- [x] Library tab - 3 practice items (static)
- [x] Sign in/sign up screen

### Out of Scope
- ❌ No chat history
- ❌ No conversation memory
- ❌ No journaling
- ❌ No uploads or notifications
- ❌ No onboarding flow
- ❌ No progress tracking

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
# Copy and update .env files with your Supabase credentials
cp .env.example .env.development
```

3. Start development server:
```bash
npm run dev
```

4. Test on device:
- Install Expo Go app
- Scan QR code
- Sign in and test conversation

### Testing Gemma

1. Sign up with email/password
2. Navigate to Today tab
3. Type a message (e.g., "I'm feeling overwhelmed today")
4. Press Send
5. Wait 2-6 seconds for response
6. Evaluate Gemma's tone (should be warm, calm, non-prescriptive)

## Documentation

- [BUILD_UNIT_7_SUMMARY.md](./BUILD_UNIT_7_SUMMARY.md) - Mobile UI implementation
- [BUILD_UNIT_6_SUMMARY.md](./BUILD_UNIT_6_SUMMARY.md) - Conversation endpoint
- [BUILD_UNIT_5_SUMMARY.md](./BUILD_UNIT_5_SUMMARY.md) - LLM adapter
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) - Infrastructure details
- [docs/GEMMA_CONVERSATION.md](./docs/GEMMA_CONVERSATION.md) - API documentation
- [tests/gemma-conversation-tests.md](./tests/gemma-conversation-tests.md) - Test cases

## Environment Variables

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Server-side (Edge Functions)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## Architecture Principles

- **Safety First**: Temperature ≤ 0.3, prompt enforcement, content validation
- **Privacy**: NO message/response storage, audit logs contain metadata only
- **Simplicity**: Single-turn only, minimal features, calm design
- **User Isolation**: RLS on all tables, strict user-scoped queries
- **Auditability**: Comprehensive event logging for debugging

---

## 🔒 Repository Lockdown & Change Control

**CRITICAL: This repository is under strict change control.**

### Change Freeze (Effective 2026-02-05)

All production domains are **locked** and no structural changes are permitted without explicit approval.

#### Locked Domains

1. **Condition Management** (`/products/condition/`)
   - Self-contained, production-ready
   - No new files, services, or functions without approval
   - No cross-domain imports permitted
   - Changes require explicit instruction

2. **Bloodwork Management** (`/products/bloodwork/`)
   - Self-contained, production-ready
   - No new files, services, or functions without approval
   - No cross-domain imports permitted
   - Changes require explicit instruction

#### What Requires Approval

- ❌ New features or capabilities
- ❌ UX/UI changes to production domains
- ❌ Data model or schema changes
- ❌ AI behavior or logic changes
- ❌ Architectural refactoring
- ❌ New dependencies or libraries
- ❌ Cross-domain coupling
- ❌ "While you're here" improvements

#### What Is Allowed

- ✅ Bug fixes (with clear justification)
- ✅ Security patches (critical only)
- ✅ Performance optimization (if approved)
- ✅ Documentation updates (non-structural)

### Enforcement Rules

1. **No Structural Changes**: File organization, folder structure, and architectural boundaries are frozen.

2. **Domain Isolation**: Condition and Bloodwork domains must remain independent with zero cross-domain business logic.

3. **Read Domain READMEs**: Before making ANY change to `/products/condition/` or `/products/bloodwork/`, read their respective README files for domain contracts.

4. **No Activation of Inactive Code**: Code marked as `INACTIVE / FUTURE` must not be wired, integrated, or activated without explicit approval. See:
   - `/gemma/INACTIVE_NOTICE.md`
   - Header comments in `/app/(tabs)/meditation.tsx`, `movement.tsx`, `nutrition.tsx`, etc.
   - Header comments in `/components/*.tsx`

5. **Explicit Instructions Required**: All changes must be requested explicitly. No proactive improvements.

### Why This Lockdown Exists

This freeze ensures:
- Domain boundaries remain clean
- No hidden coupling introduced
- Production stability maintained
- Change impact is fully understood
- Future scaling is predictable

### Questions?

Before making ANY change, ask: "Does this require approval?" If in doubt, it does.

**Last Updated:** 2026-02-05

---

## License

Proprietary
