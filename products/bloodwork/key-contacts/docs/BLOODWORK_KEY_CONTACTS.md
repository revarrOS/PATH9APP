# Bloodwork Key Contacts

## Purpose

Provide users with a trusted, centralized directory for all contacts involved in their blood cancer care journey.

## Problem Solved

Users managing chronic blood conditions interact with many healthcare providers:
- Consultants (hematologists, oncologists)
- Specialist nurses
- Lab staff
- GPs / Family doctors
- Secretaries
- Pharmacists

Remembering who's who, where they work, and how to reach them becomes a burden. This feature gives users one place to store and access all this information.

## Core Features

### Contact Directory
- Store unlimited contacts
- Organize by role
- Quick search and filtering
- Always accessible

### Rich Contact Information
- Full name
- Role/specialty
- Hospital/clinic/establishment
- Email address
- Phone number
- Personal notes

### Complete CRUD
- Create new contacts
- Edit existing contacts
- Delete contacts
- View contact details

## Data Model

### Database Table: `bloodwork_key_contacts`

```sql
CREATE TABLE bloodwork_key_contacts (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  contact_name text NOT NULL,
  role text NOT NULL,
  establishment text,
  email text,
  phone text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
);
```

### Fields

- **contact_name** (required): Full name (e.g., "Dr. Sarah Smith")
- **role** (required): One of:
  - Consultant
  - Nurse
  - Lab Staff
  - GP / Family Doctor
  - Secretary
  - Pharmacist
  - Other
- **establishment** (optional): Hospital, clinic, or facility name
- **email** (optional): Contact email address
- **phone** (optional): Contact phone number
- **notes** (optional): Additional information or context

### Security

- RLS enabled
- Users can only access their own contacts
- Full CRUD permissions for owned records
- No cross-user data access

## API

### Edge Function: `/bloodwork-key-contacts`

**Authentication**: Required (JWT via Authorization header)

**Methods**:

#### GET
List all contacts or get specific contact

```
GET /bloodwork-key-contacts
Response: Contact[]

GET /bloodwork-key-contacts?id={id}
Response: Contact
```

#### POST
Create new contact

```
POST /bloodwork-key-contacts
Body: {
  contact_name: string,
  role: string,
  establishment?: string,
  email?: string,
  phone?: string,
  notes?: string
}
Response: Contact
```

#### PUT
Update existing contact

```
PUT /bloodwork-key-contacts?id={id}
Body: Partial<ContactInput>
Response: Contact
```

#### DELETE
Remove contact

```
DELETE /bloodwork-key-contacts?id={id}
Response: { success: true }
```

## UI Components

### KeyContactCard
- Visual display of contact information
- Role badge with color coding
- Shows establishment, email, phone (if provided)
- Tap to edit

### KeyContactForm
- Name input (required)
- Role selector (grid of buttons)
- Establishment input
- Email input (validated)
- Phone input
- Notes textarea
- Save/Cancel actions

### Main Screen
- List of all contacts
- Grouped/sorted by name
- Empty state for no contacts
- Add button in header
- Search/filter (future enhancement)

## User Flows

### Adding a Contact

1. User taps "Key Contacts" from bloodwork menu
2. Taps "+" button
3. Enters contact name (required)
4. Selects role from grid
5. Optionally fills in establishment, email, phone, notes
6. Taps "Save Contact"
7. Contact appears in list

### Editing a Contact

1. User taps contact card
2. Form opens with current data
3. User modifies any fields
4. Taps "Save Changes"
5. Updated contact appears in list

### Deleting a Contact

1. User taps contact card to edit
2. Taps trash icon in header
3. Confirms deletion
4. Contact removed from list

## Security Model

### Authentication
- JWT required for all API calls
- Extracted from Authorization header
- Validated by Supabase auth system

### Authorization
- User ID extracted from JWT
- All operations scoped to user_id
- RLS policies enforce ownership

### RLS Policies

```sql
-- View own contacts
CREATE POLICY "Users can view own bloodwork key contacts"
  ON bloodwork_key_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create own contacts
CREATE POLICY "Users can insert own bloodwork key contacts"
  ON bloodwork_key_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update own contacts
CREATE POLICY "Users can update own bloodwork key contacts"
  ON bloodwork_key_contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete own contacts
CREATE POLICY "Users can delete own bloodwork key contacts"
  ON bloodwork_key_contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

## Future Enhancements

### Phase 2 (not implemented)
- Search and filter contacts
- Link contacts to appointments
- Contact history (last contacted)
- Quick actions (call, email)
- Contact sharing with carers
- Import from device contacts
- Export contact list

### Integration Opportunities
- Auto-populate appointment "Location" from contact establishment
- Link consultation prep questions to specific contacts
- Contact-based notification preferences

## File Structure

```
products/bloodwork/key-contacts/
├── types/
│   └── key-contacts.types.ts
├── services/
│   └── key-contacts.service.ts
├── components/
│   ├── KeyContactCard.tsx
│   └── KeyContactForm.tsx
└── docs/
    └── BLOODWORK_KEY_CONTACTS.md (this file)

app/(tabs)/medical/bloodwork/key-contacts/
└── index.tsx

supabase/functions/bloodwork-key-contacts/
└── index.ts
```

## Testing

### Manual Test Cases

1. **Create contact with all fields**
   - Verify contact appears in list
   - Verify all data saved correctly

2. **Create contact with only required fields**
   - Verify contact appears in list
   - Verify optional fields are null

3. **Edit contact**
   - Modify fields
   - Verify changes persist

4. **Delete contact**
   - Verify confirmation dialog
   - Verify contact removed
   - Verify no orphaned data

5. **Role filtering**
   - Select each role
   - Verify role displays correctly
   - Verify role badge colors

6. **Security**
   - Verify user can only see own contacts
   - Verify RLS blocks cross-user access
   - Verify unauthenticated requests fail

## Privacy & Compliance

- Contact data is medical care-related
- Stored securely with encryption at rest
- User-scoped access only
- No sharing without explicit user action
- Deletable at any time
- No third-party access

## Change Log

- **2026-02-02**: Initial release
  - Full CRUD operations
  - Role-based organization
  - Secure backend with RLS
  - Clean, accessible UI
