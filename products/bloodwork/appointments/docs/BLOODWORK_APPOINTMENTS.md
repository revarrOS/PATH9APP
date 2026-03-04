# Bloodwork Appointments

## Overview

The Bloodwork Appointments feature enables users to:
- Manually create and manage upcoming bloodwork appointments
- Track both **departure time** (when to leave) and **appointment time** (when it starts)
- Use direct date/time pickers for fast, friction-free scheduling
- View both upcoming and completed appointments
- Mark appointments as complete/incomplete
- Add appointments to their device calendar with one tap
- Set up local reminder notifications (24h and 1h before)

This is a **fully contained feature** inside the Bloodwork product with no impact on existing features.

**CRITICAL: Appointments use Supabase backend with user-scoped access.** Calendar events persist independently in your phone's calendar.

## Philosophy

**Simple, local-first appointment management.**

Users often need a way to track their bloodwork appointments, but existing calendar apps lack context-specific features. This feature bridges the gap by:

1. **Keeping it simple** - No auto-imports, no NHS scraping, just manual entry
2. **Local-only storage** - No database, no cloud sync, device-only
3. **Optional calendar sync** - Users can choose to sync to their phone calendar
4. **Optional reminders** - In-app notifications without forcing users to remember
5. **Status tracking** - Mark appointments complete to differentiate past from future
6. **Graceful degradation** - Works even if permissions are denied

## Data Storage

### Supabase Backend (`bloodwork_appointments` table)
All appointment data is stored in Supabase with proper RLS:
- Appointment details (title, departure_time, appointment_time, location, notes)
- Status (upcoming/completed)
- Calendar event ID (if synced)
- Notification IDs (if reminders enabled)
- **User-scoped with RLS policies**
- **Secure, backed up, cross-device sync ready**
- **No data loss on app uninstall**

### Device Calendar
When user taps "Add to Calendar":
- Creates a 1-hour calendar event on the device
- Stores the `calendarEventId` in local storage
- Shows "Added to calendar" badge on the card
- Calendar event persists independently (survives app uninstall)

### Local Notifications
When user enables reminders:
- Schedules up to 2 notifications (24h + 1h before)
- Stores notification IDs in local storage
- Cancels notifications on edit/delete
- Reschedules on appointment update

## Permissions

### Calendar Permission
- Requested when user first taps "Add to Calendar"
- **If granted**: Creates calendar events normally
- **If denied**: Shows calm message "Calendar permission is required to add appointments"
- **On web**: Not supported - no button shown

### Notification Permission
- Requested on first screen load
- **If granted**: Schedules reminders when enabled
- **If denied**: Reminders toggle still works but no notifications fire
- **On web**: Not supported - reminders disabled

## How Reminders Work

1. User enables reminders in the appointment form
2. User selects which reminders to enable:
   - 24 hours before
   - 1 hour before
3. When appointment is created/updated:
   - Notifications are scheduled using expo-notifications
   - Notification IDs are stored in local storage
4. On edit:
   - Old notifications are cancelled
   - New notifications are scheduled if enabled
5. On delete:
   - All notifications are cancelled

**Important**: Reminders only fire if notification permission is granted and the appointment datetime is in the future.

## Data Model

```typescript
interface BloodworkAppointment {
  id: string;
  user_id: string;
  title: string;
  appointment_time: string; // When appointment starts (required)
  departure_time?: string; // When to leave (optional)
  appointment_datetime?: string; // Deprecated, kept for backward compatibility
  location?: string;
  notes?: string;
  status: 'upcoming' | 'completed';
  calendar_event_id?: string;
  reminder_enabled: boolean;
  reminder_24h_notification_id?: string;
  reminder_1h_notification_id?: string;
  created_at: string;
  updated_at: string;
}
```

### Key Enhancements

**Dual Time Tracking**:
- `appointment_time`: The actual start time of the appointment (required)
- `departure_time`: When the user needs to leave to arrive on time (optional)
- Constraint: `departure_time` must be ≤ `appointment_time`

**Direct Date/Time Input**:
- Web platform uses HTML5 `datetime-local` input
- Mobile platforms use native date/time pickers
- Zero friction: type or select, no button spam

**Backward Compatibility**:
- Old appointments with `appointment_datetime` continue to work
- System migrates on read: `appointment_datetime` → `appointment_time`
- No data loss during migration

## File Inventory

### Types
- `products/bloodwork/appointments/types/appointments.types.ts`

### Services
- `products/bloodwork/appointments/services/appointments.store.ts` - AsyncStorage CRUD (LOCAL-ONLY)
- `products/bloodwork/appointments/services/calendar.service.ts` - expo-calendar wrapper
- `products/bloodwork/appointments/services/notifications.service.ts` - expo-notifications wrapper

### Components
- `products/bloodwork/appointments/components/AppointmentCard.tsx` - Individual appointment card
- `products/bloodwork/appointments/components/AppointmentForm.tsx` - Create/edit form
- `products/bloodwork/appointments/components/ReminderPicker.tsx` - Reminder toggle UI

### Routes
- `app/(tabs)/medical/bloodwork/appointments/index.tsx` - Main appointments screen

### Documentation
- `products/bloodwork/appointments/docs/BLOODWORK_APPOINTMENTS.md` (this file)
- `products/bloodwork/appointments/README.md`

## User Flows

### Creating an Appointment
1. User taps "Bloodwork Appointments" card
2. Taps "+" to create new
3. Fills in title (required), date/time, location, notes
4. Optionally enables reminders
5. Taps "Create Appointment"
6. Returns to list view
7. **Appointment stored locally on device**

### Adding to Calendar
1. User sees appointment in list
2. If not yet synced, sees "Add to Calendar" button
3. Taps button
4. Permission prompt appears (if first time)
5. Calendar event created
6. Badge appears on card
7. **Calendar event persists even if app is uninstalled**

### Editing an Appointment
1. User taps appointment card
2. Edit form appears with current data
3. User makes changes
4. Taps "Save Changes"
5. Notifications are rescheduled if reminders enabled

### Deleting an Appointment
1. User taps appointment card to edit
2. Taps trash icon
3. Confirmation dialog appears
4. Confirms deletion
5. Notifications are cancelled
6. **Appointment removed from local storage**

### Marking Complete
1. User taps circle icon on appointment card
2. Status toggles to "completed"
3. Appointment moves to "Completed" tab

## What Did NOT Change

✅ No changes to:
- Existing bloodwork features (Entry, Trends, Analysis)
- Authentication or database
- Edge functions
- Other product areas (nutrition, meditation, etc.)
- Global app configuration

✅ Only additions:
- New feature directory under `products/bloodwork/`
- One new route under `app/(tabs)/medical/bloodwork/`
- Three new dependencies (AsyncStorage, expo-calendar, expo-notifications)
- One new card on Bloodwork Management screen

✅ **No database involvement**:
- No Supabase tables
- No migrations
- No RLS policies
- No user authentication requirement

## Technical Notes

- All data stored in AsyncStorage under key `@path9_bloodwork_appointments`
- Calendar sync is platform-dependent (iOS/Android only)
- Notifications are local-only (no push notifications)
- Date/time handling uses ISO strings
- Graceful degradation on web platform
- No external API dependencies
- **Data does not survive app uninstall** (by design)

## Privacy & Data Loss

### Expected Behavior
- Appointments stored locally only
- Data lost on app uninstall
- No cloud backup
- No cross-device sync
- Calendar events persist independently

### Why Local-Only?
- Appointments are logistics, not medical records
- Privacy by design (no server storage)
- Simplified compliance scope
- Reduced attack surface
- Acceptable tradeoff for V1

## Future Enhancements (Out of Scope)

- Optional cloud backup/sync (only if users request it)
- NHS appointment auto-import
- Recurring appointments
- Custom reminder times
- Appointment sharing
- Integration with bloodwork entries
- Auto-complete appointment on entry creation
