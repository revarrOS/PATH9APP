import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, ArrowLeft, Calendar as CalendarIcon, Trash2 } from 'lucide-react-native';
import { AppointmentCard } from '@/products/bloodwork/appointments/components/AppointmentCard';
import { AppointmentForm } from '@/products/bloodwork/appointments/components/AppointmentForm';
import { appointmentsStore } from '@/products/bloodwork/appointments/services/appointments.store';
import { calendarService } from '@/products/bloodwork/appointments/services/calendar.service';
import { notificationsService } from '@/products/bloodwork/appointments/services/notifications.service';
import type { BloodworkAppointment } from '@/products/bloodwork/appointments/types/appointments.types';

type ViewMode = 'list' | 'create' | 'edit';
type FilterMode = 'upcoming' | 'completed';

export default function AppointmentsScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterMode, setFilterMode] = useState<FilterMode>('upcoming');
  const [appointments, setAppointments] = useState<BloodworkAppointment[]>([]);
  const [editingAppointment, setEditingAppointment] =
    useState<BloodworkAppointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [calendarPermission, setCalendarPermission] = useState<boolean | null>(
    null
  );
  const [notificationPermission, setNotificationPermission] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    loadAppointments();
    checkPermissions();
  }, [filterMode]);

  const checkPermissions = async () => {
    const calResult = await calendarService.requestPermissions();
    setCalendarPermission(calResult.granted);

    const notifResult = await notificationsService.requestPermissions();
    setNotificationPermission(notifResult.granted);
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data =
        filterMode === 'upcoming'
          ? await appointmentsStore.getUpcoming()
          : await appointmentsStore.getCompleted();
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (data: any) => {
    try {
      const appointment = await appointmentsStore.create({
        title: data.title,
        appointment_time: data.appointmentTime.toISOString(),
        departure_time: data.departureTime?.toISOString(),
        location: data.location,
        notes: data.notes,
        reminder_enabled: data.reminderSettings.enabled,
      });

      if (
        data.reminderSettings.enabled &&
        notificationPermission &&
        appointment
      ) {
        const ids = await notificationsService.scheduleReminders(
          data.title,
          data.appointmentTime,
          data.reminderSettings.twentyFourHour,
          data.reminderSettings.oneHour
        );

        await appointmentsStore.update(appointment.id, {
          reminder_24h_notification_id: ids.twentyFourHour,
          reminder_1h_notification_id: ids.oneHour,
        });
      }

      setViewMode('list');
      loadAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Error', 'Failed to create appointment');
    }
  };

  const handleEditAppointment = async (data: any) => {
    if (!editingAppointment) return;

    try {
      if (editingAppointment.reminder_24h_notification_id) {
        await notificationsService.cancelNotification(
          editingAppointment.reminder_24h_notification_id
        );
      }
      if (editingAppointment.reminder_1h_notification_id) {
        await notificationsService.cancelNotification(
          editingAppointment.reminder_1h_notification_id
        );
      }

      await appointmentsStore.update(editingAppointment.id, {
        title: data.title,
        appointment_time: data.appointmentTime.toISOString(),
        departure_time: data.departureTime?.toISOString(),
        location: data.location,
        notes: data.notes,
        reminder_enabled: data.reminderSettings.enabled,
        reminder_24h_notification_id: undefined,
        reminder_1h_notification_id: undefined,
      });

      if (data.reminderSettings.enabled && notificationPermission) {
        const ids = await notificationsService.scheduleReminders(
          data.title,
          data.appointmentTime,
          data.reminderSettings.twentyFourHour,
          data.reminderSettings.oneHour
        );

        await appointmentsStore.update(editingAppointment.id, {
          reminder_24h_notification_id: ids.twentyFourHour,
          reminder_1h_notification_id: ids.oneHour,
        });
      }

      setViewMode('list');
      setEditingAppointment(null);
      loadAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment');
    }
  };

  const handleAddToCalendar = async (appointment: BloodworkAppointment) => {
    if (!calendarPermission) {
      Alert.alert(
        'Calendar Access',
        'Calendar permission is required to add appointments.'
      );
      return;
    }

    try {
      const appointmentDate = new Date(
        appointment.appointment_time || appointment.appointment_datetime || ''
      );
      const endDate = new Date(appointmentDate);
      endDate.setHours(endDate.getHours() + 1);

      const eventId = await calendarService.addEvent({
        title: appointment.title,
        startDate: appointmentDate,
        endDate: endDate,
        location: appointment.location || undefined,
        notes: appointment.notes || undefined,
      });

      if (eventId) {
        await appointmentsStore.update(appointment.id, {
          calendar_event_id: eventId,
        });
        loadAppointments();
        Alert.alert('Success', 'Added to calendar');
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert('Error', 'Failed to add to calendar');
    }
  };

  const handleToggleComplete = async (appointment: BloodworkAppointment) => {
    try {
      if (appointment.status === 'upcoming') {
        await appointmentsStore.markComplete(appointment.id);
      } else {
        await appointmentsStore.markUpcoming(appointment.id);
      }
      loadAppointments();
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const handleDeleteAppointment = (appointment: BloodworkAppointment) => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (appointment.reminder_24h_notification_id) {
                await notificationsService.cancelNotification(
                  appointment.reminder_24h_notification_id
                );
              }
              if (appointment.reminder_1h_notification_id) {
                await notificationsService.cancelNotification(
                  appointment.reminder_1h_notification_id
                );
              }

              await appointmentsStore.delete(appointment.id);
              loadAppointments();
            } catch (error) {
              console.error('Error deleting appointment:', error);
              Alert.alert('Error', 'Failed to delete appointment');
            }
          },
        },
      ]
    );
  };

  const openEditMode = (appointment: BloodworkAppointment) => {
    setEditingAppointment(appointment);
    setViewMode('edit');
  };

  if (viewMode === 'create') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#f9fafb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Appointment</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.content}>
          <AppointmentForm
            onSubmit={handleCreateAppointment}
            onCancel={() => setViewMode('list')}
          />
        </View>
      </View>
    );
  }

  if (viewMode === 'edit' && editingAppointment) {
    const appointmentDate = new Date(
      editingAppointment.appointment_time ||
        editingAppointment.appointment_datetime ||
        ''
    );
    const departureDate = editingAppointment.departure_time
      ? new Date(editingAppointment.departure_time)
      : undefined;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setViewMode('list');
              setEditingAppointment(null);
            }}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#f9fafb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Appointment</Text>
          <TouchableOpacity
            onPress={() => handleDeleteAppointment(editingAppointment)}
            style={styles.deleteButton}
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <AppointmentForm
            initialData={{
              title: editingAppointment.title,
              appointmentTime: appointmentDate,
              departureTime: departureDate,
              location: editingAppointment.location || '',
              notes: editingAppointment.notes || '',
              reminderSettings: {
                enabled: editingAppointment.reminder_enabled,
                twentyFourHour: !!editingAppointment.reminder_24h_notification_id,
                oneHour: !!editingAppointment.reminder_1h_notification_id,
              },
            }}
            onSubmit={handleEditAppointment}
            onCancel={() => {
              setViewMode('list');
              setEditingAppointment(null);
            }}
            submitLabel="Save Changes"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#f9fafb" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity
          onPress={() => setViewMode('create')}
          style={styles.addButton}
        >
          <Plus size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterMode === 'upcoming' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterMode('upcoming')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterMode === 'upcoming' && styles.filterButtonTextActive,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterMode === 'completed' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterMode('completed')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterMode === 'completed' && styles.filterButtonTextActive,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.disclaimer}>
          Appointments are stored on this device only
        </Text>

        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarIcon size={48} color="#6b7280" />
            <Text style={styles.emptyStateTitle}>No appointments</Text>
            <Text style={styles.emptyStateText}>
              {filterMode === 'upcoming'
                ? 'Create your first appointment'
                : 'No completed appointments yet'}
            </Text>
          </View>
        ) : (
          appointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentWrapper}>
              <AppointmentCard
                appointment={appointment}
                onPress={() => openEditMode(appointment)}
                onToggleComplete={() => handleToggleComplete(appointment)}
              />
              {!appointment.calendar_event_id &&
                calendarPermission &&
                Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={styles.addToCalendarButton}
                    onPress={() => handleAddToCalendar(appointment)}
                  >
                    <CalendarIcon size={16} color="#3b82f6" />
                    <Text style={styles.addToCalendarText}>
                      Add to Calendar
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f9fafb',
  },
  addButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filters: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9ca3af',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  disclaimer: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  appointmentWrapper: {
    marginBottom: 12,
  },
  addToCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginTop: -6,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  addToCalendarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
});
