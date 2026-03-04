# Bloodwork Support Access

## Purpose

Enable users managing chronic blood conditions to share their bloodwork data with trusted individuals (partners, carers, family members) in a secure, controlled manner.

## Core Principle

**People managing chronic conditions do not do this alone.**

This feature acknowledges the reality that:
- Partners often attend appointments
- Carers need access to track trends
- Family members provide emotional support
- Shared context leads to better care

## Features

### Invite System
- Send email invitations
- Secure token-based acceptance
- 30-day expiration on pending invites
- Revocable at any time

### Access Levels

**Read Only** (default):
- View bloodwork entries
- See trends and analysis
- Read AI chat conversations
- Access appointments
- View consultation prep questions

**Read & Write**:
- Everything in Read Only, plus:
- Add bloodwork entries
- Create appointments
- Add consultation questions
- Update notes

### Bidirectional Control
- **Owners** can revoke access at any time
- **Supporters** can remove their own access at any time
- Clean, respectful separation when needed

## Data Model

### Table: `bloodwork_support_invitations`

```sql
CREATE TABLE bloodwork_support_invitations (
  id uuid PRIMARY KEY,
  owner_user_id uuid REFERENCES auth.users(id),
  invitee_email text NOT NULL,
  invitee_name text NOT NULL,
  access_level text NOT NULL, -- 'read_only' or 'read_write'
  invitation_token uuid NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL, -- 30 days from creation
  status text NOT NULL, -- 'pending', 'accepted', 'expired', 'revoked'
  created_at timestamptz
);
```

### Table: `bloodwork_support_access`

```sql
CREATE TABLE bloodwork_support_access (
  id uuid PRIMARY KEY,
  owner_user_id uuid REFERENCES auth.users(id),
  supporter_user_id uuid REFERENCES auth.users(id),
  supporter_name text NOT NULL,
  access_level text NOT NULL, -- 'read_only' or 'read_write'
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE(owner_user_id, supporter_user_id),
  CHECK(owner_user_id != supporter_user_id) -- No self-access
);
```

### Security Constraints

- Users cannot invite themselves
- One pending invitation per email address per user
- Invitation token must remain secret
- Expired invitations cannot be accepted
- Revoked invitations cannot be re-used

## API

### Edge Function: `/bloodwork-support-access`

**Authentication**: Required (JWT via Authorization header)

**Endpoints**:

#### GET /invitations
List all pending invitations sent by current user

```
GET /bloodwork-support-access/invitations
Response: Invitation[]
```

#### GET /access
List all access grants (owned and granted)

```
GET /bloodwork-support-access/access
Response: {
  owned: Access[], // People you've given access to
  granted: Access[] // Data you have access to
}
```

#### POST /invite
Create new invitation

```
POST /bloodwork-support-access/invite
Body: {
  invitee_email: string,
  invitee_name: string,
  access_level: 'read_only' | 'read_write'
}
Response: Invitation
```

#### POST /accept
Accept an invitation (requires invitation token)

```
POST /bloodwork-support-access/accept
Body: {
  invitation_token: string
}
Response: Access
```

#### DELETE /revoke?id={access_id}
Revoke access (owner or supporter can call)

```
DELETE /bloodwork-support-access/revoke?id={access_id}
Response: { success: true }
```

#### DELETE /cancel-invite?id={invitation_id}
Cancel pending invitation (owner only)

```
DELETE /bloodwork-support-access/cancel-invite?id={invitation_id}
Response: { success: true }
```

## User Flows

### Inviting Someone

1. User taps "Support Access" from bloodwork menu
2. Taps "+" to invite someone
3. Enters their name and email
4. Selects access level (Read Only / Read & Write)
5. Taps "Send Invitation"
6. System creates invitation with unique token
7. (Future) Email sent to invitee with accept link
8. Invitation appears in "Pending Invitations" list

### Accepting an Invitation

1. Invitee receives email with invitation link
2. Clicks link (opens app or web)
3. Signs in (or creates account if needed)
4. Reviews access level being granted
5. Taps "Accept"
6. Access record created
7. Invitation marked as accepted
8. Invitee can now access owner's bloodwork data

### Revoking Access

**As Owner:**
1. View "People With Access" list
2. Tap trash icon on person's card
3. Confirm revocation
4. Access immediately removed
5. Supporter loses access

**As Supporter:**
1. View "Data You Can Access" list
2. Tap trash icon
3. Confirm removal
4. Access immediately removed
5. Owner notified (future enhancement)

### Canceling a Pending Invitation

1. View "People You've Invited" list
2. Tap trash icon on pending invitation
3. Confirm cancellation
4. Invitation status changed to 'revoked'
5. Acceptance link no longer works

## Security Model

### RLS Policies

**Invitations**:
```sql
-- Owners can view/create/update/delete their own invitations
CREATE POLICY "Users can view own support invitations"
  ON bloodwork_support_invitations FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_user_id);
```

**Access**:
```sql
-- Owners can see who they've granted access to
CREATE POLICY "Owners can view granted support access"
  ON bloodwork_support_access FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_user_id);

-- Supporters can see what they have access to
CREATE POLICY "Supporters can view their access grants"
  ON bloodwork_support_access FOR SELECT
  TO authenticated
  USING (auth.uid() = supporter_user_id);

-- Both can revoke
CREATE POLICY "Owners can revoke support access"
  ON bloodwork_support_access FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Supporters can remove their access"
  ON bloodwork_support_access FOR DELETE
  TO authenticated
  USING (auth.uid() = supporter_user_id);
```

### Invitation Token Security

- UUID v4 (128-bit random)
- Not guessable
- Single-use (marked accepted after use)
- Time-limited (30 days)
- Transmitted via secure channel only

### Access Enforcement

When a supporter accesses bloodwork data:
1. Check if active access record exists
2. Verify access hasn't been revoked
3. Apply access level restrictions
4. Log access for audit trail (future)

## Scope

### What IS Shared

When access is granted, supporter can access:
- All bloodwork entries (past and future)
- All trends and analysis
- AI chat conversations (bloodwork-specific)
- Appointments
- Consultation prep questions
- Key contacts

### What IS NOT Shared

- Other Path9 products (meditation, nutrition, etc.)
- Account settings
- Ability to delete owner's data (even with read_write)
- Ability to revoke other supporters' access
- Ability to grant access to others

### Access Level Differences

| Action | Read Only | Read & Write |
|--------|-----------|--------------|
| View entries | ✅ | ✅ |
| Add entries | ❌ | ✅ |
| Edit entries | ❌ | ❌ |
| Delete entries | ❌ | ❌ |
| View appointments | ✅ | ✅ |
| Create appointments | ❌ | ✅ |
| View questions | ✅ | ✅ |
| Add questions | ❌ | ✅ |
| Chat with AI | ✅ | ✅ |

**Note**: Nobody can delete owner's data, regardless of access level.

## UI Components

### Invite Form
- Name input
- Email input (validated)
- Access level selector (visual cards)
- Clear explanation of each level
- Send button

### Invitation Card
- Shows invitee name and email
- Shows access level
- Shows status (pending)
- Cancel button

### Access Card
- Shows supporter/owner name
- Shows access level
- Shows when granted
- Revoke button

### List Views
- Pending Invitations
- People With Access
- Data You Can Access

## Future Enhancements

### Phase 2 (not implemented)
- Email notifications for invitations
- Email notifications when access revoked
- Access expiration dates
- Granular permissions (per-feature access)
- Activity log (who viewed what when)
- Temporary access (time-limited)
- Emergency access codes

### Integration Opportunities
- Supporter-specific UI mode
- Notification preferences per supporter
- Shared appointment calendar view
- Comments/notes between owner and supporter

## Privacy & Compliance

- Explicit consent required (invitation acceptance)
- Transparent access levels
- User controls (revocable at any time)
- No third-party access
- No data selling or sharing
- Audit trail (future)

## File Structure

```
products/bloodwork/support-access/
├── types/
│   └── support-access.types.ts
├── services/
│   └── support-access.service.ts
└── docs/
    └── BLOODWORK_SUPPORT_ACCESS.md (this file)

app/(tabs)/medical/bloodwork/support-access/
└── index.tsx

supabase/functions/bloodwork-support-access/
└── index.ts
```

## Testing

### Manual Test Cases

1. **Send invitation**
   - Verify invitation created
   - Verify token generated
   - Verify expiration set to 30 days

2. **Accept invitation**
   - Verify access record created
   - Verify invitation marked accepted
   - Verify supporter can access data

3. **Revoke access (as owner)**
   - Verify access removed immediately
   - Verify supporter loses access

4. **Remove access (as supporter)**
   - Verify access removed
   - Verify owner notified (future)

5. **Cancel pending invitation**
   - Verify status changed to revoked
   - Verify acceptance link fails

6. **Security**
   - Verify invitation token is secret
   - Verify RLS blocks unauthorized access
   - Verify self-invite prevented
   - Verify duplicate invite blocked

7. **Edge cases**
   - Expired invitation cannot be accepted
   - Revoked invitation cannot be accepted
   - Non-existent token returns error

## Limitations

### Current Scope
- No email sending (manual invitation sharing)
- No activity logging
- No access history
- No granular permissions
- Bloodwork-only (not cross-product)

### By Design
- Supporters cannot delete owner's data
- Supporters cannot manage other supporters
- No anonymous or public access
- No tiered access beyond read/write

## Change Log

- **2026-02-02**: Initial release
  - Invitation system
  - Two access levels
  - Bidirectional revocation
  - Secure token-based acceptance
  - RLS-enforced security
