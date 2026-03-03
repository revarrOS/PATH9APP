export type AppointmentStatus = 'upcoming' | 'completed';

export interface BloodworkAppointment {
  id: string;
  user_id: string;
  title: string;
  appointment_time: string;
  departure_time?: string | null;
  appointment_datetime?: string; // Deprecated, kept for backward compatibility
  location?: string | null;
  notes?: string | null;
  status: AppointmentStatus;
  calendar_event_id?: string | null;
  reminder_enabled: boolean;
  reminder_24h_notification_id?: string | null;
  reminder_1h_notification_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentInput {
  title: string;
  appointment_time: string;
  departure_time?: string;
  location?: string;
  notes?: string;
  reminder_enabled?: boolean;
}

export interface UpdateAppointmentInput {
  title?: string;
  appointment_time?: string;
  departure_time?: string;
  location?: string;
  notes?: string;
  status?: AppointmentStatus;
  calendar_event_id?: string;
  reminder_enabled?: boolean;
  reminder_24h_notification_id?: string;
  reminder_1h_notification_id?: string;
}

export interface ReminderSettings {
  enabled: boolean;
  twentyFourHour: boolean;
  oneHour: boolean;
}
