# Bloodwork Management - Technical Architecture

**Version:** Phase 1
**Last Updated:** 2026-02-01

---

## System Overview

Bloodwork Management is a self-contained product for tracking blood test history. It follows a clean three-tier architecture with strict user isolation and no cross-product dependencies.

```
┌─────────────────────────────────────────────────────────────┐
│                         USER DEVICE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │           UI Layer (Expo/React Native)            │     │
│  ├───────────────────────────────────────────────────┤     │
│  │  /app/(tabs)/medical/bloodwork/                   │     │
│  │  ├── index.tsx (Timeline)                         │     │
│  │  ├── new.tsx (New Entry Form)                     │     │
│  │  ├── [id].tsx (Detail View)                       │     │
│  │  └── edit/[id].tsx (Edit Form)                    │     │
│  └───────────────────────────────────────────────────┘     │
│                          ▲                                  │
│                          │                                  │
│  ┌───────────────────────┴───────────────────────────┐     │
│  │       Service Layer (Client-Side Logic)           │     │
│  ├───────────────────────────────────────────────────┤     │
│  │  /products/bloodwork/services/                    │     │
│  │  └── bloodwork.service.ts                         │     │
│  │      ├── createBloodTest()                        │     │
│  │      ├── updateBloodTest()                        │     │
│  │      ├── deleteBloodTest()                        │     │
│  │      └── getBloodTests()                          │     │
│  └───────────────────────────────────────────────────┘     │
│                          ▲                                  │
│                          │                                  │
│  ┌───────────────────────┴───────────────────────────┐     │
│  │         Utils & Components (Helpers)              │     │
│  ├───────────────────────────────────────────────────┤     │
│  │  /products/bloodwork/utils/                       │     │
│  │  └── smart-normalize.ts (Scale corrections)      │     │
│  │                                                   │     │
│  │  /products/bloodwork/components/                  │     │
│  │  ├── LocationSelector.tsx                         │     │
│  │  ├── PHIWarning.tsx                               │     │
│  │  └── TrackingDisclaimer.tsx                       │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (Supabase Client)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │          Edge Functions (Deno Runtime)            │     │
│  ├───────────────────────────────────────────────────┤     │
│  │  /supabase/functions/analyze-bloodwork-image/     │     │
│  │  └── index.ts                                     │     │
│  │      ├── Accepts base64 image                     │     │
│  │      ├── Calls Claude Vision API ───────┐         │     │
│  │      ├── Extracts marker values         │         │     │
│  │      ├── Normalizes marker names        │         │     │
│  │      └── Returns JSON (transient)       │         │     │
│  └─────────────────────────────────────────┼─────────┘     │
│                                            │               │
│                                            ▼               │
│                              ┌──────────────────────┐      │
│                              │  Anthropic Claude    │      │
│                              │   Vision API         │      │
│                              │  (External Service)  │      │
│                              └──────────────────────┘      │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │          PostgreSQL Database (RLS)                │     │
│  ├───────────────────────────────────────────────────┤     │
│  │                                                   │     │
│  │  ┌──────────────────────────────────────────┐    │     │
│  │  │  blood_tests                             │    │     │
│  │  ├──────────────────────────────────────────┤    │     │
│  │  │  id, user_id, test_date, location       │    │     │
│  │  │  notes, created_at, updated_at          │    │     │
│  │  └──────────────────────────────────────────┘    │     │
│  │                    │                              │     │
│  │                    │ 1:N (CASCADE DELETE)         │     │
│  │                    ▼                              │     │
│  │  ┌──────────────────────────────────────────┐    │     │
│  │  │  blood_markers                           │    │     │
│  │  ├──────────────────────────────────────────┤    │     │
│  │  │  id, test_id, marker_name, value        │    │     │
│  │  │  unit, reference_range_low/high         │    │     │
│  │  │  created_at, updated_at                 │    │     │
│  │  └──────────────────────────────────────────┘    │     │
│  │                                                   │     │
│  │  ┌──────────────────────────────────────────┐    │     │
│  │  │  user_preferences (shared table)         │    │     │
│  │  ├──────────────────────────────────────────┤    │     │
│  │  │  user_id, saved_locations (JSONB)       │    │     │
│  │  │  created_at, updated_at                 │    │     │
│  │  └──────────────────────────────────────────┘    │     │
│  │                                                   │     │
│  │  RLS Policies: 11 total (all user-scoped)        │     │
│  │  ├── blood_tests: 4 policies (CRUD)              │     │
│  │  ├── blood_markers: 4 policies (CRUD via JOIN)   │     │
│  │  └── user_preferences: 3 policies (SELECT/       │     │
│  │                        INSERT/UPDATE)             │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Manual Entry Flow

```
User fills form
     │
     ▼
┌─────────────────────┐
│ new.tsx             │
│ - Collects input    │
│ - Validates values  │
│ - Shows warnings    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ smart-normalize.ts  │ ◄── Client-side only
│ - HGB > 20 → ÷10    │
│ - MCHC > 100 → ÷10  │
│ - HCT < 1 → ×100    │
│ - RDW-CV < 1 → ×100 │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ bloodwork.service   │
│ .createBloodTest()  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Supabase Client     │
│ INSERT INTO         │
│ blood_tests         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ RLS Policy Check    │ ◄── auth.uid() = user_id
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Database Write      │
│ - blood_tests (1)   │
│ - blood_markers (N) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ user_preferences    │
│ - Update saved_     │
│   locations (max 5) │
└─────────────────────┘
```

---

### 2. Image Upload Flow

```
User taps camera/upload
     │
     ▼
┌─────────────────────┐
│ expo-image-picker   │
│ - Camera/Gallery    │
│ - Returns base64    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ new.tsx                                 │
│ - Shows "Analyzing..." indicator        │
│ - Calls edge function                   │
└──────────┬──────────────────────────────┘
           │
           │ HTTPS POST (base64 image)
           ▼
┌─────────────────────────────────────────┐
│ analyze-bloodwork-image (Edge Function) │
│ ┌─────────────────────────────────────┐ │
│ │ 1. Receive base64 image             │ │
│ │ 2. Build prompt for Claude Vision   │ │
│ │ 3. Call Anthropic API ──────────┐   │ │
│ │ 4. Parse JSON response          │   │ │
│ │ 5. Normalize marker names       │   │ │
│ │ 6. Return structured data       │   │ │
│ └─────────────────────────────────────┘ │
└──────────┬──────────────────────────────┘
           │                     ▲
           │                     │
           │         ┌───────────┴──────────┐
           │         │ Claude Vision API    │
           │         │ (Anthropic)          │
           │         │ - Analyzes image     │
           │         │ - Returns JSON       │
           │         └──────────────────────┘
           │
           ▼
┌─────────────────────┐
│ new.tsx             │
│ - Pre-fills form    │
│ - User reviews      │
│ - User edits        │
│ - User saves        │
└──────────┬──────────┘
           │
           │ (continues to Manual Entry Flow)
           ▼
   [Manual Entry Flow]
```

**Important Notes:**
- Images are NEVER stored (processed transiently)
- Edge function is stateless (no session)
- User must confirm/edit before save
- Same normalization rules apply after extraction

---

### 3. Edit Flow

```
User taps "Edit" on test
     │
     ▼
┌─────────────────────┐
│ [id].tsx            │
│ - Loads test data   │
│ - Navigates to edit │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ edit/[id].tsx       │
│ - Pre-fills form    │
│ - User modifies     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ smart-normalize.ts  │ ◄── Client-side only
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ bloodwork.service   │
│ .updateBloodTest()  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Supabase Client     │
│ UPDATE blood_tests  │
│ UPDATE blood_markers│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ RLS Policy Check    │ ◄── auth.uid() = user_id
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Database Write      │
│ - Updated values    │
│ - Timestamp updated │
└─────────────────────┘
```

---

### 4. Delete Flow

```
User taps "Delete Test"
     │
     ▼
┌─────────────────────┐
│ [id].tsx            │
│ - Confirms delete   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ bloodwork.service   │
│ .deleteBloodTest()  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Supabase Client     │
│ DELETE FROM         │
│ blood_tests         │
│ WHERE id = ?        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ RLS Policy Check    │ ◄── auth.uid() = user_id
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ CASCADE DELETE      │
│ - blood_tests (1)   │
│ - blood_markers (N) │ ◄── Foreign key cascade
└─────────────────────┘
```

---

## File Organization

### Product Folder Structure

```
/products/bloodwork/
├── README.md                          # Product overview
├── CURRENT_STATUS.md                  # What works now
├── ARCHITECTURE.md                    # This file
├── PRODUCT_VALIDATION.md              # Validation plan
├── IMAGE_UPLOAD_HANDOFF.md            # Feature handoff
├── AUDIT_SUMMARY.md                   # Containment audit
├── CONTAINMENT_AUDIT_2026-02-01.md    # Full audit report
│
├── /components/                       # UI components
│   ├── LocationSelector.tsx           # Saved locations dropdown
│   ├── PHIWarning.tsx                 # Privacy warning
│   └── TrackingDisclaimer.tsx         # "For tracking only" message
│
├── /services/                         # Client-side services
│   └── bloodwork.service.ts           # CRUD operations
│
├── /types/                            # TypeScript definitions
│   └── bloodwork.types.ts             # Data models, enums, interfaces
│
├── /utils/                            # Utilities
│   └── smart-normalize.ts             # Scale normalization logic
│
└── /docs/                             # Documentation
    ├── IMAGE_UPLOAD_FEATURE.md        # Active feature spec
    ├── /normalization/                # Active reference
    │   ├── SMART_NORMALIZATION_DATA_AUDIT.md
    │   └── HISTORICAL_NORMALIZATION_COMPLETE.md
    └── /archive/                      # Historical docs
        ├── /phase-docs/               # Build logs (6 files)
        ├── /fix-logs/                 # Debug logs (9 files)
        └── /scripts/                  # SQL scripts (2 files)
```

### External Files (Required Placements)

```
/app/(tabs)/medical/bloodwork/         # UI routes (Expo Router requirement)
├── index.tsx                          # Timeline view
├── new.tsx                            # New test form
├── [id].tsx                           # Detail view
└── edit/[id].tsx                      # Edit form

/supabase/functions/                   # Edge functions (Supabase requirement)
└── analyze-bloodwork-image/
    └── index.ts                       # Vision extraction

/services/                             # Shared services
└── user-preferences.service.ts        # Saved locations (multi-product design)

/supabase/migrations/                  # Database migrations
├── 20260131133451_create_bloodwork_schema.sql
└── 20260201044607_create_user_preferences_table.sql
```

**Why these live outside `/products/bloodwork/`:**
- **UI Routes:** Expo Router requires routes in `/app/`
- **Edge Functions:** Supabase requires functions in `/supabase/functions/`
- **UserPreferencesService:** Designed for multi-product use (extensible schema)
- **Migrations:** Applied migrations belong in main `/supabase/migrations/`

---

## Security Architecture

### Row Level Security (RLS)

**All tables enforce user isolation via RLS:**

```sql
-- Example: blood_tests SELECT policy
CREATE POLICY "Users can read own tests"
  ON blood_tests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Example: blood_markers SELECT policy (via JOIN)
CREATE POLICY "Users can read own markers"
  ON blood_markers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blood_tests
      WHERE blood_tests.id = blood_markers.test_id
      AND blood_tests.user_id = auth.uid()
    )
  );
```

**Policy Coverage:**
- **blood_tests:** 4 policies (SELECT, INSERT, UPDATE, DELETE)
- **blood_markers:** 4 policies (SELECT, INSERT, UPDATE, DELETE)
- **user_preferences:** 3 policies (SELECT, INSERT, UPDATE)

**Enforcement:**
- All policies use `auth.uid()` (not `current_user`)
- Authenticated users only
- No `USING (true)` policies
- Cascade deletes are RLS-aware

### Data Privacy

**PHI Minimization:**
- No document storage (images processed transiently)
- Only structured numeric data persisted
- Free-text fields warn about PHI
- User can delete all data at any time

**API Keys:**
- `ANTHROPIC_API_KEY` stored in Supabase secrets
- Never exposed to client
- Edge function isolation

---

## Performance Considerations

### Database Indexes

```sql
-- blood_tests
CREATE INDEX idx_blood_tests_user_id ON blood_tests(user_id);
CREATE INDEX idx_blood_tests_test_date ON blood_tests(test_date);

-- blood_markers
CREATE INDEX idx_blood_markers_test_id ON blood_markers(test_id);
CREATE INDEX idx_blood_markers_marker_name ON blood_markers(marker_name);
```

### Query Patterns

**Timeline Load (index.tsx):**
```sql
SELECT * FROM blood_tests
WHERE user_id = auth.uid()
ORDER BY test_date DESC;
```
- Uses `idx_blood_tests_user_id` + `idx_blood_tests_test_date`
- Average: 7 rows per user
- Response time: < 300ms

**Detail Load ([id].tsx):**
```sql
SELECT * FROM blood_tests WHERE id = ?;
SELECT * FROM blood_markers WHERE test_id = ?;
```
- Uses primary key + foreign key indexes
- Average: 16-17 markers per test
- Response time: < 200ms

### Client-Side Optimizations

- SMART normalization runs client-side (no server round-trip)
- Form validation is instant (no async)
- Saved locations cached in state
- Image upload shows progress indicator

---

## Error Handling

### Client-Side

```typescript
try {
  await BloodworkService.createBloodTest(data);
  // Success
} catch (error) {
  // Show inline error message (no Alert API)
  setError(error.message);
}
```

**Validation:**
- Gentle warnings for unusual values
- Never blocks user input
- Clear error messages in UI

### Edge Function

```typescript
try {
  const response = await fetch(anthropicAPI, { ... });
  return new Response(JSON.stringify(data), { status: 200 });
} catch (error) {
  return new Response(
    JSON.stringify({ error: 'Analysis failed' }),
    { status: 500 }
  );
}
```

**Fallback:**
- If vision extraction fails, user can still enter manually
- Partial extractions are acceptable
- Clear error messaging

---

## Type System

### Core Types

```typescript
// Main entities
interface BloodTest {
  id: string;
  user_id: string;
  test_date: string;
  location: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface BloodMarker {
  id: string;
  test_id: string;
  marker_name: string;
  value: string;
  unit: string;
  reference_range_low: string | null;
  reference_range_high: string | null;
  created_at: string;
  updated_at: string;
}

// Combined view
interface BloodTestWithMarkers extends BloodTest {
  markers: BloodMarker[];
}

// CBC markers
type CBCMarkerName =
  | 'WBC' | 'RBC' | 'HGB' | 'HCT' | 'MCV' | 'MCH' | 'MCHC' | 'PLT'
  | 'LYM' | 'MXD' | 'NEUT'
  | 'RDW-SD' | 'RDW-CV' | 'PDW' | 'MPV' | 'PLCR';
```

---

## Testing Strategy

### Current Testing (Manual)
- Create test with full panel
- Create test with partial panel
- Edit markers and metadata
- Delete test (verify cascade)
- Image upload with various reports
- SMART normalization for all 4 markers
- RLS isolation (check Supabase dashboard)

### Future Testing (Recommended)
- Unit tests for `smart-normalize.ts`
- Unit tests for marker name normalization
- Integration tests for CRUD operations
- E2E tests for critical flows
- RLS policy tests

---

## Deployment

### Prerequisites
- Supabase project configured
- `ANTHROPIC_API_KEY` set in Supabase secrets
- Migrations applied
- Edge function deployed

### Build Process
```bash
npm run build:web  # Verify build passes
```

### Database Setup
```sql
-- Applied in order:
1. 20260131133451_create_bloodwork_schema.sql
2. 20260201044607_create_user_preferences_table.sql
```

### Edge Function Deployment
```bash
# Deploy analyze-bloodwork-image function
# (handled via Supabase CLI or MCP tool)
```

---

## Extension Points

### Adding a New Marker

1. Update `CBC_MARKERS` in `bloodwork.types.ts`
2. Update `MARKER_ALIASES` in `bloodwork.types.ts`
3. Update `MARKER_ALIASES` in edge function (duplicate)
4. Optionally add normalization rule in `smart-normalize.ts`
5. Update edge function normalization if needed

### Adding a New Panel (e.g., Metabolic)

1. Create new marker type enum (e.g., `MetabolicMarkerName`)
2. Create new marker array (e.g., `METABOLIC_MARKERS`)
3. Update UI to support panel selection
4. Update edge function to handle new markers
5. Consider adding panel field to `blood_tests` table

### Adding Trend Visualization

1. Fetch all tests for user (already available)
2. Filter by marker name
3. Sort by test_date
4. Render chart (use charting library)
5. Consider adding date range filters

---

## Troubleshooting

### Common Issues

**Image extraction returns empty results:**
- Check `ANTHROPIC_API_KEY` in Supabase secrets
- Verify image is clear and readable
- Check edge function logs in Supabase dashboard

**Values not saving:**
- Check RLS policies in Supabase dashboard
- Verify user is authenticated
- Check browser console for errors

**Normalization not working:**
- Verify `smart-normalize.ts` logic
- Check that values meet threshold rules
- Review client-side validation

**Delete not cascading:**
- Verify foreign key constraint exists
- Check RLS policies allow DELETE
- Review Supabase logs

---

## Related Documentation

- [README.md](README.md) - Product overview and scope
- [CURRENT_STATUS.md](CURRENT_STATUS.md) - What works now
- [PRODUCT_VALIDATION.md](PRODUCT_VALIDATION.md) - Validation plan
- [types/bloodwork.types.ts](types/bloodwork.types.ts) - Full type definitions
- [docs/normalization/](docs/normalization/) - Normalization reference

---

**Questions?** Check documentation or review [docs/archive/](docs/archive/) for historical context.
