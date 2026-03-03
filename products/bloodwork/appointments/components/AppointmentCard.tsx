import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Calendar,
  MapPin,
  Bell,
  CheckCircle,
  Circle,
  Clock,
} from 'lucide-react-native';
import type { BloodworkAppointment } from '../types/appointments.types';

interface AppointmentCardProps {
  appointment: BloodworkAppointment;
  onPress: () => void;
  onToggleComplete: () => void;
}

export function AppointmentCard({
  appointment,
  onPress,
  onToggleComplete,
}: AppointmentCardProps) {
  const appointmentDate = new Date(
    appointment.appointment_time || appointment.appointment_datetime || ''
  );
  const departureDate = appointment.departure_time
    ? new Date(appointment.departure_time)
    : null;
  const isUpcoming = appointment.status === 'upcoming';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.content} onPress={onPress}>
        <View style={styles.header}>
          <Text style={styles.title}>{appointment.title}</Text>
          <View style={styles.badges}>
            {appointment.calendar_event_id && (
              <View style={styles.badge}>
                <Calendar size={12} color="#10b981" />
              </View>
            )}
            {appointment.reminder_enabled && (
              <View style={styles.badge}>
                <Bell size={12} color="#3b82f6" />
              </View>
            )}
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#9ca3af" />
            <Text style={styles.detailText}>
              {formatDate(appointmentDate)} at {formatTime(appointmentDate)}
            </Text>
          </View>

          {departureDate && (
            <View style={styles.detailRow}>
              <Clock size={16} color="#6366f1" />
              <Text style={styles.detailTextDeparture}>
                Leave at {formatTime(departureDate)}
              </Text>
            </View>
          )}

          {appointment.location && (
            <View style={styles.detailRow}>
              <MapPin size={16} color="#9ca3af" />
              <Text style={styles.detailText}>{appointment.location}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.completeButton}
        onPress={onToggleComplete}
      >
        {isUpcoming ? (
          <Circle size={24} color="#6b7280" />
        ) : (
          <CheckCircle size={24} color="#10b981" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    flex: 1,
    marginRight: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  detailTextDeparture: {
    fontSize: 14,
    color: '#a5b4fc',
    fontWeight: '500',
  },
  completeButton: {
    marginLeft: 12,
    padding: 8,
  },
});
