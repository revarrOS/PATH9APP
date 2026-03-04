import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Calendar, MapPin, FileText, Clock } from 'lucide-react-native';
import { ReminderPicker } from './ReminderPicker';
import type { ReminderSettings } from '../types/appointments.types';

interface AppointmentFormData {
  title: string;
  appointmentTime: Date;
  departureTime?: Date;
  location: string;
  notes: string;
  reminderSettings: ReminderSettings;
}

interface AppointmentFormProps {
  initialData?: Partial<AppointmentFormData>;
  onSubmit: (data: AppointmentFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function AppointmentForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Create Appointment',
}: AppointmentFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [appointmentTime, setAppointmentTime] = useState(
    initialData?.appointmentTime || new Date()
  );
  const [departureTime, setDepartureTime] = useState<Date | undefined>(
    initialData?.departureTime
  );
  const [location, setLocation] = useState(initialData?.location || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(
    initialData?.reminderSettings || {
      enabled: false,
      twentyFourHour: true,
      oneHour: true,
    }
  );

  const handleSubmit = () => {
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      appointmentTime,
      departureTime,
      location: location.trim(),
      notes: notes.trim(),
      reminderSettings,
    });
  };

  const formatDateTimeForInput = (date: Date): string => {
    // Format: YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const parseDateTimeFromInput = (value: string): Date => {
    return new Date(value);
  };

  const formatDisplayDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isValid = title.trim().length > 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.label}>Appointment Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Blood test at hospital"
          placeholderTextColor="#6b7280"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Appointment Date & Time</Text>
        <View style={styles.inputWithIcon}>
          <Calendar size={20} color="#9ca3af" />
          {Platform.OS === 'web' ? (
            <input
              type="datetime-local"
              value={formatDateTimeForInput(appointmentTime)}
              onChange={(e) =>
                setAppointmentTime(parseDateTimeFromInput(e.target.value))
              }
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 16,
                color: '#f9fafb',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <Text style={styles.inputText}>
              {formatDisplayDateTime(appointmentTime)}
            </Text>
          )}
        </View>
        <Text style={styles.helperText}>
          When does your appointment start?
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Departure Time (optional)</Text>
        <View style={styles.inputWithIcon}>
          <Clock size={20} color="#9ca3af" />
          {Platform.OS === 'web' ? (
            <input
              type="datetime-local"
              value={departureTime ? formatDateTimeForInput(departureTime) : ''}
              onChange={(e) => {
                const value = e.target.value;
                setDepartureTime(value ? parseDateTimeFromInput(value) : undefined);
              }}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 16,
                color: '#f9fafb',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            <Text style={styles.inputText}>
              {departureTime ? formatDisplayDateTime(departureTime) : 'Not set'}
            </Text>
          )}
        </View>
        <Text style={styles.helperText}>
          When do you need to leave to get there?
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Location (optional)</Text>
        <View style={styles.inputWithIcon}>
          <MapPin size={20} color="#9ca3af" />
          <TextInput
            style={styles.inputText}
            value={location}
            onChangeText={setLocation}
            placeholder="Hospital, clinic, lab..."
            placeholderTextColor="#6b7280"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Notes (optional)</Text>
        <View style={styles.inputWithIcon}>
          <FileText size={20} color="#9ca3af" />
          <TextInput
            style={[styles.inputText, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional details..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ReminderPicker
          settings={reminderSettings}
          onChange={setReminderSettings}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.submitButton, !isValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}
        >
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f9fafb',
    borderWidth: 1,
    borderColor: '#374151',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#f9fafb',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 6,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1d5db',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  submitButtonDisabled: {
    backgroundColor: '#374151',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
