# Bloodwork Deletion Rules

## Purpose

Ensure consistent, predictable, and safe deletion behavior across all bloodwork features.

## Core Principle

**If a red bin/trash icon exists, it MUST work.**

No disabled delete buttons.
No silent failures.
No inconsistent behavior.

## Universal Pattern

All bloodwork delete actions follow the same pattern:

### 1. User Confirmation
```typescript
Alert.alert(
  'Delete [Feature]',
  'Are you sure you want to delete this [item]?',
  [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        // Delete logic here
      },
    },
  ]
);
```

### 2. Permission Check
- JWT authentication (automatic via Supabase client)
- RLS policies enforce user_id match
- No additional permission checks needed

### 3. Deletion Execution
```typescript
try {
  await service.delete(id);
  // Refresh UI
  await loadData();
} catch (error) {
  console.error('Error deleting:', error);
  Alert.alert('Error', 'Failed to delete [item]');
}
```

### 4. UI Update
- Immediate removal from list
- Return to list view if in detail view
- Show confirmation (optional, not required)

## Feature-Specific Implementations

### Bloodwork Entries

**Location**: `app/(tabs)/medical/bloodwork/entry/[id].tsx`

**Delete Trigger**: Trash icon in header when viewing entry

**Cleanup**:
- Deletes test record from `blood_tests` table
- Cascade deletes all associated `blood_markers`
- RLS ensures user can only delete own tests

**Backend**: Direct Supabase call via `BloodworkService.deleteTest(id)`

---

### Consultation Prep Questions

**Location**: `app/(tabs)/medical/bloodwork/consultation-prep/index.tsx`

**Delete Trigger**: Trash icon on question card

**Cleanup**:
- Removes question from local storage
- No server-side data

**Backend**: `consultationPrepStore.deleteQuestion(id)`

---

### Bloodwork Appointments

**Location**: `app/(tabs)/medical/bloodwork/appointments/index.tsx`

**Delete Trigger**: Trash icon in header when editing appointment

**Cleanup**:
- Cancels scheduled reminders (if any)
- Deletes appointment from `bloodwork_appointments` table
- Does NOT delete calendar event (user controls that separately)

**Backend**: `appointmentsStore.delete(id)` + notification cleanup

---

### Key Contacts

**Location**: `app/(tabs)/medical/bloodwork/key-contacts/index.tsx`

**Delete Trigger**: Trash icon in header when editing contact

**Cleanup**:
- Deletes contact from `bloodwork_key_contacts` table
- RLS ensures user can only delete own contacts

**Backend**: Edge function `/bloodwork-key-contacts?id=[id]` DELETE

---

### Support Access

**Location**: `app/(tabs)/medical/bloodwork/support-access/index.tsx`

**Delete Triggers**:
- Trash icon on access card (revoke access)
- Trash icon on invitation card (cancel invite)

**Cleanup**:
- Revoke access: Deletes from `bloodwork_support_access`
- Cancel invite: Updates `bloodwork_support_invitations` status to 'revoked'
- User can revoke if they are owner OR supporter

**Backend**: Edge function `/bloodwork-support-access/revoke` or `/cancel-invite`

---

## Error Handling

### Expected Errors

| Error | User Message | Action |
|-------|-------------|--------|
| Network failure | "Failed to delete [item]" | Retry available |
| Permission denied | "You don't have permission to delete this" | Contact support |
| Item not found | "Item already deleted" | Refresh list |
| RLS violation | "Unauthorized" | Sign in again |

### Unexpected Errors

All unexpected errors should:
1. Log to console
2. Show generic "Failed to delete" message
3. NOT leave UI in broken state
4. Allow retry

## Testing Checklist

For each feature with delete functionality:

- ✅ Delete works when user owns the item
- ✅ Delete fails gracefully when user doesn't own item
- ✅ Confirmation dialog appears before deletion
- ✅ Cancel button in confirmation works
- ✅ UI updates immediately after deletion
- ✅ Related cleanup executes (reminders, cascades, etc.)
- ✅ Error handling shows appropriate message
- ✅ No orphaned data left behind

## Security Guarantees

### Row-Level Security (RLS)

All bloodwork tables enforce:
```sql
CREATE POLICY "Users can delete own [items]"
  ON [table_name]
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Edge Function Auth

All edge functions verify:
1. Authorization header present
2. Valid JWT token
3. User ID extracted from token
4. User ID matches resource owner

### No Bypass Possible

- Client cannot delete other users' data
- Edge functions enforce ownership checks
- Database enforces RLS as final layer
- Cascade deletes respect RLS policies

## Failure Modes

### When Delete Should Fail

1. **Not authenticated**: User must sign in
2. **Not authorized**: User doesn't own the item
3. **Network error**: Retry available
4. **Server error**: Contact support

### When Delete Should Succeed

1. User is authenticated
2. User owns the item
3. Item exists
4. Network connection stable

## Consistency Guarantee

**Promise**: If a delete icon is visible, tapping it will either:
1. Successfully delete the item, OR
2. Show a clear error message explaining why it failed

**Never**:
- Silently fail
- Leave UI in inconsistent state
- Show disabled delete button
- Confuse user about what happened

---

## Change Log

- **2026-02-02**: Created comprehensive deletion rules
- Unified all bloodwork delete behavior
- Documented security model
- Added testing checklist
