import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BloodworkAppointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../types/appointments.types';

const STORAGE_KEY = '@path9_bloodwork_appointments';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class AppointmentsStore {
  private async loadAppointments(): Promise<BloodworkAppointment[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading appointments:', error);
      return [];
    }
  }

  private async saveAppointments(
    appointments: BloodworkAppointment[]
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    } catch (error) {
      console.error('Error saving appointments:', error);
      throw error;
    }
  }

  async getAll(): Promise<BloodworkAppointment[]> {
    const appointments = await this.loadAppointments();
    return appointments.sort(
      (a, b) =>
        new Date(a.appointment_time || a.appointment_datetime || '').getTime() -
        new Date(b.appointment_time || b.appointment_datetime || '').getTime()
    );
  }

  async getUpcoming(): Promise<BloodworkAppointment[]> {
    const appointments = await this.loadAppointments();
    const now = new Date().toISOString();
    return appointments
      .filter(
        (a) =>
          a.status === 'upcoming' &&
          (a.appointment_time || a.appointment_datetime || '') >= now
      )
      .sort(
        (a, b) =>
          new Date(a.appointment_time || a.appointment_datetime || '').getTime() -
          new Date(b.appointment_time || b.appointment_datetime || '').getTime()
      );
  }

  async getCompleted(): Promise<BloodworkAppointment[]> {
    const appointments = await this.loadAppointments();
    return appointments
      .filter((a) => a.status === 'completed')
      .sort(
        (a, b) =>
          new Date(b.appointment_time || b.appointment_datetime || '').getTime() -
          new Date(a.appointment_time || a.appointment_datetime || '').getTime()
      );
  }

  async getById(id: string): Promise<BloodworkAppointment | null> {
    const appointments = await this.loadAppointments();
    return appointments.find((a) => a.id === id) || null;
  }

  async create(input: CreateAppointmentInput): Promise<BloodworkAppointment> {
    const appointments = await this.loadAppointments();
    const now = new Date().toISOString();

    const newAppointment: BloodworkAppointment = {
      id: generateId(),
      user_id: 'local',
      title: input.title,
      appointment_time: input.appointment_time,
      departure_time: input.departure_time || null,
      appointment_datetime: input.appointment_time, // Backward compatibility
      location: input.location || null,
      notes: input.notes || null,
      status: 'upcoming',
      calendar_event_id: null,
      reminder_enabled: input.reminder_enabled || false,
      reminder_24h_notification_id: null,
      reminder_1h_notification_id: null,
      created_at: now,
      updated_at: now,
    };

    appointments.push(newAppointment);
    await this.saveAppointments(appointments);
    return newAppointment;
  }

  async update(
    id: string,
    input: UpdateAppointmentInput
  ): Promise<BloodworkAppointment> {
    const appointments = await this.loadAppointments();
    const index = appointments.findIndex((a) => a.id === id);

    if (index === -1) {
      throw new Error('Appointment not found');
    }

    const updated = {
      ...appointments[index],
      ...input,
      updated_at: new Date().toISOString(),
    };

    appointments[index] = updated;
    await this.saveAppointments(appointments);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const appointments = await this.loadAppointments();
    const filtered = appointments.filter((a) => a.id !== id);
    await this.saveAppointments(filtered);
  }

  async markComplete(id: string): Promise<BloodworkAppointment> {
    return this.update(id, { status: 'completed' });
  }

  async markUpcoming(id: string): Promise<BloodworkAppointment> {
    return this.update(id, { status: 'upcoming' });
  }

  async clearAll(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export const appointmentsStore = new AppointmentsStore();
