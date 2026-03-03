# Path9 - Build Unit 1: Infrastructure Skeleton

**Status:** LOCKED - NO DRIFT

## Executive Summary

Infrastructure-only foundation with strict user isolation. Database-level security enforced through Row Level Security (RLS). All tests passing.

## Database Schema

### Tables in Public Schema: 2

#### 1. `profiles`
User profile table with strict user isolation.

**Columns (5):**
- `user_id` (uuid, PK) - Foreign key to auth.users.id
- `created_at` (timestamptz, default: now()) - Account creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp
- `timezone` (text, nullable) - User timezone preference
- `locale` (text, nullable) - User locale/language preference

**RLS Policies (4):**
- `Users can read own profile` (SELECT) - `auth.uid() = user_id`
- `Users can insert own profile` (INSERT) - `auth.uid() = user_id`
- `Users can update own profile` (UPDATE) - `auth.uid() = user_id`
- `Users can delete own profile` (DELETE) - `auth.uid() = user_id`

**Constraints:**
- Primary Key: user_id
- Foreign Key: user_id → auth.users.id (ON DELETE CASCADE)

**Triggers:**
- `on_auth_user_created` - Automatically creates profile on user signup
- `update_profiles_updated_at` - Updates updated_at on row modification

---

#### 2. `audit_events`
Minimal audit logging with user isolation. Append-preferred design.

**Columns (5):**
- `id` (uuid, PK, default: gen_random_uuid()) - Unique event identifier
- `user_id` (uuid, FK) - References auth.users.id
- `event_type` (text) - Type of event being logged
- `created_at` (timestamptz, default: now()) - Event timestamp
- `metadata` (jsonb, nullable) - Additional event data

**RLS Policies (4):**
- `Users can read own audit events` (SELECT) - `auth.uid() = user_id`
- `Users can insert own audit events` (INSERT) - `auth.uid() = user_id`
- `Users can update own audit events` (UPDATE) - `auth.uid() = user_id`
- `Users can delete own audit events` (DELETE) - `auth.uid() = user_id`

**Constraints:**
- Primary Key: id
- Foreign Key: user_id → auth.users.id (ON DELETE CASCADE)

**Indexes:**
- `idx_audit_events_user_id` on user_id
- `idx_audit_events_created_at` on created_at DESC

**Security Note:**
Metadata field must NEVER contain:
- Raw journal text
- Medical documents
- Protected Health Information (PHI)
- Sensitive personal content

---

## RLS Test Results

All tests executed successfully with strict user isolation verified.

### Test Suite Results: 9/9 PASSED

| Test | Description | Result |
|------|-------------|--------|
| TEST 1 | User A reads profiles | ✅ PASS - User A sees only their profile (1 row) |
| TEST 2 | User A reads audit_events | ✅ PASS - User A sees only their events (2 rows) |
| TEST 3 | User A tries to read User B profile | ✅ PASS - User A cannot see User B data (0 rows) |
| TEST 4 | User B reads profiles | ✅ PASS - User B sees only their profile (1 row) |
| TEST 5 | User B reads audit_events | ✅ PASS - User B sees only their events (2 rows) |
| TEST 6 | User B tries to read User A audit events | ✅ PASS - User B cannot see User A data (0 rows) |
| TEST 7 | User A tries to update User B profile | ✅ PASS - User A cannot update User B profile |
| TEST 8 | User A updates own profile | ✅ PASS - User A successfully updated own profile |
| TEST 9 | User B tries to insert event for User A | ✅ PASS - User B cannot insert for User A |

### Key Findings

**✅ User Isolation Verified:**
- Users can ONLY read their own data
- Users can ONLY write their own data
- Cross-user reads return 0 rows
- Cross-user writes are blocked by RLS

**✅ No Admin Bypass:**
- All access goes through RLS
- No service role usage in application code
- No policy exceptions

**✅ Database-Level Security:**
- RLS enforced at PostgreSQL level
- Cannot be bypassed by application code
- Policies use `auth.uid()` for authentication

---

## Edge Functions

### Deployed Functions: 2

#### `/health`
**Purpose:** Public health check endpoint for monitoring
**Authentication:** None required (verify_jwt: false)
**Features:**
- Returns service status
- Reports current environment
- Includes timestamp
- CORS enabled

**Response Example:**
```json
{
  "status": "healthy",
  "service": "path9-api-gateway",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

#### `/api-gateway`
**Purpose:** Authenticated API gateway for secure operations
**Authentication:** JWT required (verify_jwt: true)
**Features:**
- User context available (auth.uid())
- JWT verification on all requests
- CORS enabled
- Extensible route structure

**Response Example:**
```json
{
  "message": "API Gateway is operational",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Service Layer

### Authentication Service (`auth.service.ts`)
Handles user authentication operations.

**Methods:**
- `signUp(credentials)` - Create new user account
- `signIn(credentials)` - Authenticate user
- `signOut()` - End user session
- `getCurrentSession()` - Retrieve active session
- `getCurrentUser()` - Get authenticated user details

### Profile Service (`profile.service.ts`)
User profile CRUD operations with RLS.

**Methods:**
- `getProfile(userId)` - Retrieve user profile
- `updateProfile(userId, updates)` - Update user profile

**Interface:**
```typescript
interface Profile {
  user_id: string;
  created_at: string;
  updated_at: string;
  timezone?: string | null;
  locale?: string | null;
}
```

### Audit Service (`audit.service.ts`)
Audit event logging with user isolation.

**Methods:**
- `createEvent(userId, params)` - Log new audit event
- `getUserEvents(userId, limit)` - Retrieve user's audit events
- `getEventsByType(userId, eventType, limit)` - Filter events by type

**Interface:**
```typescript
interface AuditEvent {
  id: string;
  user_id: string;
  event_type: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}
```

### API Service (`api.service.ts`)
Client for Edge Function communication.

**Methods:**
- `health()` - Check service health
- `authenticatedRequest(endpoint, options)` - Make authenticated API calls

---

## Environment Configuration

### Available Environments: 3

1. **Development** (`.env.development`)
   - `EXPO_PUBLIC_API_ENV=development`
   - Default environment for local development

2. **Staging** (`.env.staging`)
   - `EXPO_PUBLIC_API_ENV=staging`
   - Pre-production testing environment

3. **Production** (`.env.production`)
   - `EXPO_PUBLIC_API_ENV=production`
   - Live production environment

### Environment Variables

**Required:**
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_PUBLIC_API_ENV` - Current environment (development|staging|production)

**Validation:**
- Runtime validation via `config/environment.ts`
- Type-safe access via TypeScript
- Missing variables throw errors at startup

---

## File Structure

```
project/
├── app/                          # Expo Router screens (minimal)
│   ├── _layout.tsx              # Root layout with auth context
│   └── +not-found.tsx           # 404 handler
├── config/
│   └── environment.ts           # Environment configuration & validation
├── contexts/
│   └── AuthContext.tsx          # Authentication state management
├── hooks/
│   └── useFrameworkReady.ts     # Framework initialization
├── lib/
│   └── supabase.ts              # Supabase client singleton
├── services/
│   ├── auth.service.ts          # Authentication operations
│   ├── api.service.ts           # API gateway client
│   ├── profile.service.ts       # User profile CRUD
│   ├── audit.service.ts         # Audit event logging
│   └── index.ts                 # Service exports
├── supabase/
│   ├── functions/               # Edge Functions
│   │   ├── health/              # Health check endpoint
│   │   │   └── index.ts
│   │   └── api-gateway/         # Authenticated gateway
│   │       └── index.ts
│   └── migrations/              # Database migrations
│       ├── 20251217101105_initial_schema_setup.sql
│       ├── 20251217101808_add_user_isolation_tables.sql
│       └── 20251217101900_finalize_infrastructure_skeleton.sql
├── types/
│   └── env.d.ts                 # Environment variable types
├── .env                         # Current environment config
├── .env.development             # Development config
├── .env.staging                 # Staging config
├── .env.production              # Production config
└── README.md                    # Project overview
```

---

## Security Guarantees

### Database Level
- ✅ RLS enabled on all tables
- ✅ Restrictive policies (auth.uid() checks)
- ✅ No admin bypass in code
- ✅ Foreign key constraints enforce referential integrity
- ✅ Cascade deletes clean up orphaned data

### Application Level
- ✅ JWT-based authentication
- ✅ Automatic session management
- ✅ Type-safe API with TypeScript
- ✅ No sensitive data in logs
- ✅ CORS properly configured

### Edge Functions
- ✅ JWT verification on protected routes
- ✅ User context available in all requests
- ✅ No service role exposure
- ✅ Comprehensive error handling

---

## Out of Scope (Build Unit 1)

The following are explicitly NOT included in this infrastructure skeleton:

❌ AI functionality
❌ Chat interfaces
❌ Business logic
❌ Journey UI
❌ Pillars
❌ Clinical/health data tables
❌ Feature work
❌ UX implementation
❌ Name, phone, diagnosis fields
❌ Notes or documents

---

## Acceptance Criteria: VERIFIED ✅

- [x] **User isolation:** Users can only read/write their own profiles row
- [x] **Audit isolation:** Users can only see their own audit_events
- [x] **No extra tables:** Only profiles and audit_events exist (+ auth defaults)
- [x] **RLS enabled:** Both tables have RLS enabled
- [x] **Restrictive policies:** All policies check auth.uid()
- [x] **Auth works:** Signup/login/logout functional
- [x] **No admin bypass:** All access goes through RLS
- [x] **No sensitive logging:** Metadata excludes PHI/journal content
- [x] **Complete CRUD policies:** SELECT, INSERT, UPDATE, DELETE all covered
- [x] **Tests passing:** All 9 isolation tests passed

---

## Next Steps (Future Build Units)

This infrastructure is ready for:
- Feature development
- Business logic implementation
- UI/UX design
- Additional backend services
- Third-party integrations
- AI functionality (future unit)
- Chat interfaces (future unit)
- Journey UI (future unit)

**Current Status:** Infrastructure skeleton complete. Ready for feature development.
