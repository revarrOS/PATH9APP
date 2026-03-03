import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, ArrowLeft, Users, Trash2 } from 'lucide-react-native';
import { KeyContactCard } from '@/products/bloodwork/key-contacts/components/KeyContactCard';
import { KeyContactForm } from '@/products/bloodwork/key-contacts/components/KeyContactForm';
import { keyContactsService } from '@/products/bloodwork/key-contacts/services/key-contacts.service';
import type {
  BloodworkKeyContact,
  CreateKeyContactInput,
} from '@/products/bloodwork/key-contacts/types/key-contacts.types';

type ViewMode = 'list' | 'create' | 'edit';

export default function KeyContactsScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [contacts, setContacts] = useState<BloodworkKeyContact[]>([]);
  const [editingContact, setEditingContact] =
    useState<BloodworkKeyContact | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await keyContactsService.getAll();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async (data: CreateKeyContactInput) => {
    try {
      await keyContactsService.create(data);
      setViewMode('list');
      loadContacts();
    } catch (error) {
      console.error('Error creating contact:', error);
      Alert.alert('Error', 'Failed to create contact');
    }
  };

  const handleEditContact = async (data: CreateKeyContactInput) => {
    if (!editingContact) return;

    try {
      await keyContactsService.update(editingContact.id, data);
      setViewMode('list');
      setEditingContact(null);
      loadContacts();
    } catch (error) {
      console.error('Error updating contact:', error);
      Alert.alert('Error', 'Failed to update contact');
    }
  };

  const handleDeleteContact = (contact: BloodworkKeyContact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.contact_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await keyContactsService.delete(contact.id);
              loadContacts();
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const openEditMode = (contact: BloodworkKeyContact) => {
    setEditingContact(contact);
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
          <Text style={styles.headerTitle}>New Contact</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.content}>
          <KeyContactForm
            onSubmit={handleCreateContact}
            onCancel={() => setViewMode('list')}
          />
        </View>
      </View>
    );
  }

  if (viewMode === 'edit' && editingContact) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setViewMode('list');
              setEditingContact(null);
            }}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#f9fafb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Contact</Text>
          <TouchableOpacity
            onPress={() => handleDeleteContact(editingContact)}
            style={styles.deleteButton}
          >
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <KeyContactForm
            initialData={{
              contact_name: editingContact.contact_name,
              role: editingContact.role,
              establishment: editingContact.establishment || '',
              email: editingContact.email || '',
              phone: editingContact.phone || '',
              notes: editingContact.notes || '',
            }}
            onSubmit={handleEditContact}
            onCancel={() => {
              setViewMode('list');
              setEditingContact(null);
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
        <Text style={styles.headerTitle}>Key Contacts</Text>
        <TouchableOpacity
          onPress={() => setViewMode('create')}
          style={styles.addButton}
        >
          <Plus size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Store contact details for your medical team - consultants, nurses,
            lab staff, and more.
          </Text>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#6b7280" />
            <Text style={styles.emptyStateTitle}>No contacts yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first medical contact to get started
            </Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <KeyContactCard
              key={contact.id}
              contact={contact}
              onPress={() => openEditMode(contact)}
            />
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoBox: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
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
    textAlign: 'center',
  },
});
