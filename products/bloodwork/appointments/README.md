# Bloodwork Appointments

**Simple appointment tracking with calendar sync and reminders.**

**CRITICAL: Appointments are stored on this device only.** Calendar events persist independently in your phone's calendar.

## Quick Start

1. Navigate to Medical → Bloodwork Management
2. Tap "Bloodwork Appointments"
3. Create your first appointment
4. Optionally add to calendar or enable reminders

## Features

- ✅ Manual appointment creation (title, datetime, location, notes)
- ✅ Upcoming/completed views
- ✅ Mark appointments complete
- ✅ Add to device calendar (iOS/Android)
- ✅ Local reminders (24h + 1h before)
- ✅ Edit and delete appointments
- ✅ Graceful permission handling
- ✅ **Local-only storage (AsyncStorage)**
- ✅ **No database, no cloud sync**

## Structure

```
appointments/
├── components/          # UI components
│   ├── AppointmentCard.tsx
│   ├── AppointmentForm.tsx
│   └── ReminderPicker.tsx
├── services/           # Business logic
│   ├── appointments.store.ts       # LOCAL AsyncStorage
│   ├── calendar.service.ts
│   └── notifications.service.ts
├── types/             # TypeScript definitions
│   └── appointments.types.ts
├── docs/              # Documentation
│   └── BLOODWORK_APPOINTMENTS.md
└── README.md          # This file
```

## Documentation

See [BLOODWORK_APPOINTMENTS.md](./docs/BLOODWORK_APPOINTMENTS.md) for full details on:
- Architecture and philosophy
- Local storage model
- Permission handling
- User flows
- Technical implementation
- Privacy & data loss expectations

## Storage

Uses **AsyncStorage** for local device storage only:
- Storage key: `@path9_bloodwork_appointments`
- No Supabase database
- No cloud sync
- Data lost on app uninstall (by design)

## Dependencies

- `@react-native-async-storage/async-storage` - Local storage
- `expo-calendar` - Calendar integration
- `expo-notifications` - Local reminders

## No Impact

This feature is fully contained and does not affect:
- Existing bloodwork features (Entry, Trends, Analysis)
- Other product areas
- Authentication or database
- Edge functions

## Privacy

Appointments are logistics, not medical records. Local-only storage provides:
- Privacy by design
- Simplified compliance
- No server storage
- Reduced attack surface
