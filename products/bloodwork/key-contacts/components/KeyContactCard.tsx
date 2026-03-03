import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Building2, Mail, Phone } from 'lucide-react-native';
import type { BloodworkKeyContact } from '../types/key-contacts.types';

interface KeyContactCardProps {
  contact: BloodworkKeyContact;
  onPress: () => void;
}

export function KeyContactCard({ contact, onPress }: KeyContactCardProps) {
  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      consultant: 'Consultant',
      nurse: 'Nurse',
      lab: 'Lab Staff',
      gp: 'GP',
      secretary: 'Secretary',
      pharmacist: 'Pharmacist',
      other: 'Other',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string): string => {
    const colors: Record<string, string> = {
      consultant: '#3b82f6',
      nurse: '#10b981',
      lab: '#8b5cf6',
      gp: '#f59e0b',
      secretary: '#6366f1',
      pharmacist: '#ec4899',
      other: '#6b7280',
    };
    return colors[role] || '#6b7280';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <User size={20} color="#f9fafb" />
          <Text style={styles.name}>{contact.contact_name}</Text>
        </View>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: `${getRoleColor(contact.role)}20` },
          ]}
        >
          <Text
            style={[styles.roleText, { color: getRoleColor(contact.role) }]}
          >
            {getRoleLabel(contact.role)}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        {contact.establishment && (
          <View style={styles.detailRow}>
            <Building2 size={16} color="#9ca3af" />
            <Text style={styles.detailText}>{contact.establishment}</Text>
          </View>
        )}

        {contact.email && (
          <View style={styles.detailRow}>
            <Mail size={16} color="#9ca3af" />
            <Text style={styles.detailText}>{contact.email}</Text>
          </View>
        )}

        {contact.phone && (
          <View style={styles.detailRow}>
            <Phone size={16} color="#9ca3af" />
            <Text style={styles.detailText}>{contact.phone}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
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
    flex: 1,
  },
});
