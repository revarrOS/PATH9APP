import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { User, Briefcase, Building2, Mail, Phone, FileText } from 'lucide-react-native';
import type { CreateKeyContactInput, ContactRole } from '../types/key-contacts.types';
import { CONTACT_ROLES } from '../types/key-contacts.types';

interface KeyContactFormData {
  contact_name: string;
  role: string;
  establishment: string;
  email: string;
  phone: string;
  notes: string;
}

interface KeyContactFormProps {
  initialData?: Partial<KeyContactFormData>;
  onSubmit: (data: CreateKeyContactInput) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function KeyContactForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Contact',
}: KeyContactFormProps) {
  const [contactName, setContactName] = useState(initialData?.contact_name || '');
  const [role, setRole] = useState(initialData?.role || 'consultant');
  const [establishment, setEstablishment] = useState(initialData?.establishment || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = () => {
    if (!contactName.trim() || !role) return;

    onSubmit({
      contact_name: contactName.trim(),
      role,
      establishment: establishment.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const isValid = contactName.trim().length > 0 && role.length > 0;

  const getRoleLabel = (roleValue: string): string => {
    const labels: Record<string, string> = {
      consultant: 'Consultant',
      nurse: 'Nurse',
      lab: 'Lab Staff',
      gp: 'GP / Family Doctor',
      secretary: 'Secretary',
      pharmacist: 'Pharmacist',
      other: 'Other',
    };
    return labels[roleValue] || roleValue;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.label}>Contact Name *</Text>
        <View style={styles.inputWithIcon}>
          <User size={20} color="#9ca3af" />
          <TextInput
            style={styles.inputText}
            value={contactName}
            onChangeText={setContactName}
            placeholder="e.g., Dr. Smith"
            placeholderTextColor="#6b7280"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Role *</Text>
        <View style={styles.roleGrid}>
          {CONTACT_ROLES.map((roleOption) => (
            <TouchableOpacity
              key={roleOption}
              style={[
                styles.roleButton,
                role === roleOption && styles.roleButtonActive,
              ]}
              onPress={() => setRole(roleOption)}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === roleOption && styles.roleButtonTextActive,
                ]}
              >
                {getRoleLabel(roleOption)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Hospital / Clinic (optional)</Text>
        <View style={styles.inputWithIcon}>
          <Building2 size={20} color="#9ca3af" />
          <TextInput
            style={styles.inputText}
            value={establishment}
            onChangeText={setEstablishment}
            placeholder="e.g., Royal Hospital"
            placeholderTextColor="#6b7280"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Email (optional)</Text>
        <View style={styles.inputWithIcon}>
          <Mail size={20} color="#9ca3af" />
          <TextInput
            style={styles.inputText}
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Phone (optional)</Text>
        <View style={styles.inputWithIcon}>
          <Phone size={20} color="#9ca3af" />
          <TextInput
            style={styles.inputText}
            value={phone}
            onChangeText={setPhone}
            placeholder="+44 20 1234 5678"
            placeholderTextColor="#6b7280"
            keyboardType="phone-pad"
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
            placeholder="Any additional information..."
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            !isValid && styles.submitButtonDisabled,
          ]}
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
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  roleButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  roleButtonTextActive: {
    color: '#fff',
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
