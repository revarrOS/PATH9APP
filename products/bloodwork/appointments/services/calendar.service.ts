import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export interface CalendarPermissionResult {
  granted: boolean;
  message?: string;
}

export interface AddToCalendarParams {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
}

class CalendarService {
  async requestPermissions(): Promise<CalendarPermissionResult> {
    if (Platform.OS === 'web') {
      return {
        granted: false,
        message: 'Calendar sync is not available on web',
      };
    }

    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();

      if (status === 'granted') {
        return { granted: true };
      } else {
        return {
          granted: false,
          message: 'Calendar permission denied',
        };
      }
    } catch (error) {
      return {
        granted: false,
        message: 'Unable to request calendar permissions',
      };
    }
  }

  async getDefaultCalendarId(): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    try {
      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );

      const defaultCalendar = calendars.find(
        (cal) => cal.allowsModifications && cal.isPrimary
      );

      if (defaultCalendar) {
        return defaultCalendar.id;
      }

      const writableCalendar = calendars.find((cal) => cal.allowsModifications);
      return writableCalendar?.id || null;
    } catch (error) {
      console.error('Error getting default calendar:', error);
      return null;
    }
  }

  async addEvent(params: AddToCalendarParams): Promise<string | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      const calendarId = await this.getDefaultCalendarId();
      if (!calendarId) {
        throw new Error('No writable calendar found');
      }

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: params.title,
        startDate: params.startDate,
        endDate: params.endDate,
        location: params.location || '',
        notes: params.notes || '',
        timeZone: 'GMT',
      });

      return eventId;
    } catch (error) {
      console.error('Error adding event to calendar:', error);
      throw error;
    }
  }

  async updateEvent(
    eventId: string,
    params: AddToCalendarParams
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await Calendar.updateEventAsync(eventId, {
        title: params.title,
        startDate: params.startDate,
        endDate: params.endDate,
        location: params.location || '',
        notes: params.notes || '',
      });
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await Calendar.deleteEventAsync(eventId);
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }
}

export const calendarService = new CalendarService();
