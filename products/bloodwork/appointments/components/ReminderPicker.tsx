import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, BellOff } from 'lucide-react-native';
import type { ReminderSettings } from '../types/appointments.types';

interface ReminderPickerProps {
  settings: ReminderSettings;
  onChange: (settings: ReminderSettings) => void;
}

export function ReminderPicker({ settings, onChange }: ReminderPickerProps) {
  const toggleEnabled = () => {
    onChange({
      ...settings,
      enabled: !settings.enabled,
    });
  };

  const toggle24h = () => {
    onChange({
      ...settings,
      twentyFourHour: !settings.twentyFourHour,
    });
  };

  const toggle1h = () => {
    onChange({
      ...settings,
      oneHour: !settings.oneHour,
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.mainToggle} onPress={toggleEnabled}>
        <View style={styles.mainToggleContent}>
          {settings.enabled ? (
            <Bell size={20} color="#3b82f6" />
          ) : (
            <BellOff size={20} color="#6b7280" />
          )}
          <Text style={styles.mainToggleText}>Reminders</Text>
        </View>
        <View
          style={[
            styles.toggleSwitch,
            settings.enabled && styles.toggleSwitchActive,
          ]}
        >
          <View
            style={[
              styles.toggleThumb,
              settings.enabled && styles.toggleThumbActive,
            ]}
          />
        </View>
      </TouchableOpacity>

      {settings.enabled && (
        <View style={styles.options}>
          <TouchableOpacity style={styles.option} onPress={toggle24h}>
            <Text style={styles.optionText}>24 hours before</Text>
            <View
              style={[
                styles.checkbox,
                settings.twentyFourHour && styles.checkboxActive,
              ]}
            >
              {settings.twentyFourHour && (
                <View style={styles.checkboxInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={toggle1h}>
            <Text style={styles.optionText}>1 hour before</Text>
            <View
              style={[
                styles.checkbox,
                settings.oneHour && styles.checkboxActive,
              ]}
            >
              {settings.oneHour && <View style={styles.checkboxInner} />}
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
  },
  mainToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#374151',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#3b82f6',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  options: {
    marginTop: 16,
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 15,
    color: '#d1d5db',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f6',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
});
