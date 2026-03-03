import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface NotificationPermissionResult {
  granted: boolean;
  message?: string;
}

export interface ReminderNotificationIds {
  twentyFourHour?: string;
  oneHour?: string;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationsService {
  async requestPermissions(): Promise<NotificationPermissionResult> {
    if (Platform.OS === 'web') {
      return {
        granted: false,
        message: 'Notifications are not available on web',
      };
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        return { granted: true };
      } else {
        return {
          granted: false,
          message: 'Notification permission denied',
        };
      }
    } catch (error) {
      return {
        granted: false,
        message: 'Unable to request notification permissions',
      };
    }
  }

  async scheduleReminders(
    appointmentTitle: string,
    appointmentDate: Date,
    enable24h: boolean,
    enable1h: boolean
  ): Promise<ReminderNotificationIds> {
    if (Platform.OS === 'web') {
      return {};
    }

    const ids: ReminderNotificationIds = {};

    try {
      if (enable24h) {
        const trigger24h = new Date(appointmentDate);
        trigger24h.setHours(trigger24h.getHours() - 24);

        if (trigger24h > new Date()) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Appointment Tomorrow',
              body: `${appointmentTitle} is scheduled for tomorrow`,
              data: { type: 'appointment-reminder-24h' },
            },
            trigger: trigger24h as any,
          });
          ids.twentyFourHour = id;
        }
      }

      if (enable1h) {
        const trigger1h = new Date(appointmentDate);
        trigger1h.setHours(trigger1h.getHours() - 1);

        if (trigger1h > new Date()) {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Appointment in 1 Hour',
              body: `${appointmentTitle} is coming up soon`,
              data: { type: 'appointment-reminder-1h' },
            },
            trigger: trigger1h as any,
          });
          ids.oneHour = id;
        }
      }

      return ids;
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      return ids;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelNotifications(notificationIds: string[]): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await Promise.all(
        notificationIds.map((id) =>
          Notifications.cancelScheduledNotificationAsync(id)
        )
      );
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }
}

export const notificationsService = new NotificationsService();
