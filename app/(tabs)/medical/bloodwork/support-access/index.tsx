import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, UserPlus, Users, Trash2, Eye, Edit3 } from 'lucide-react-native';
import { supportAccessService } from '@/products/bloodwork/support-access/services/support-access.service';
import type {
  BloodworkSupportInvitation,
  BloodworkSupportAccess,
  AccessLevel,
} from '@/products/bloodwork/support-access/types/support-access.types';

type ViewMode = 'list' | 'invite';

export default function SupportAccessScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [invitations, setInvitations] = useState<BloodworkSupportInvitation[]>(
    []
  );
  const [ownedAccess, setOwnedAccess] = useState<BloodworkSupportAccess[]>([]);
  const [grantedAccess, setGrantedAccess] = useState<BloodworkSupportAccess[]>(
    []
  );

  // Invite form state
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('read_only');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invitesData, accessData] = await Promise.all([
        supportAccessService.getInvitations(),
        supportAccessService.getAccess(),
      ]);
      setInvitations(invitesData.filter((i) => i.status === 'pending'));
      setOwnedAccess(accessData.owned);
      setGrantedAccess(accessData.granted);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load support access data');
    }
  };

  const handleSendInvite = async () => {
    if (!inviteeName.trim() || !inviteeEmail.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await supportAccessService.createInvite({
        invitee_name: inviteeName.trim(),
        invitee_email: inviteeEmail.trim(),
        access_level: accessLevel,
      });
      setViewMode('list');
      setInviteeName('');
      setInviteeEmail('');
      setAccessLevel('read_only');
      loadData();
      Alert.alert(
        'Invitation Sent',
        'An invitation email will be sent to the recipient.'
      );
    } catch (error: any) {
      console.error('Error sending invite:', error);
      Alert.alert('Error', error.message || 'Failed to send invitation');
    }
  };

  const handleRevokeAccess = (access: BloodworkSupportAccess) => {
    const isOwner = ownedAccess.some((a) => a.id === access.id);
    const message = isOwner
      ? `Remove ${access.supporter_name}'s access to your bloodwork data?`
      : `Remove your access to this bloodwork data?`;

    Alert.alert('Revoke Access', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          try {
            await supportAccessService.revokeAccess(access.id);
            loadData();
          } catch (error) {
            console.error('Error revoking access:', error);
            Alert.alert('Error', 'Failed to revoke access');
          }
        },
      },
    ]);
  };

  const handleCancelInvite = (invite: BloodworkSupportInvitation) => {
    Alert.alert(
      'Cancel Invitation',
      `Cancel invitation to ${invite.invitee_name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await supportAccessService.cancelInvite(invite.id);
              loadData();
            } catch (error) {
              console.error('Error canceling invite:', error);
              Alert.alert('Error', 'Failed to cancel invitation');
            }
          },
        },
      ]
    );
  };

  if (viewMode === 'invite') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#f9fafb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invite Someone</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.formContent}
        >
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Invite a partner, carer, or family member to access your
              bloodwork data.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Their Name *</Text>
            <TextInput
              style={styles.input}
              value={inviteeName}
              onChangeText={setInviteeName}
              placeholder="e.g., Sarah"
              placeholderTextColor="#6b7280"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Their Email *</Text>
            <TextInput
              style={styles.input}
              value={inviteeEmail}
              onChangeText={setInviteeEmail}
              placeholder="email@example.com"
              placeholderTextColor="#6b7280"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Access Level</Text>
            <TouchableOpacity
              style={[
                styles.accessButton,
                accessLevel === 'read_only' && styles.accessButtonActive,
              ]}
              onPress={() => setAccessLevel('read_only')}
            >
              <Eye size={20} color={accessLevel === 'read_only' ? '#fff' : '#9ca3af'} />
              <View style={styles.accessButtonContent}>
                <Text
                  style={[
                    styles.accessButtonTitle,
                    accessLevel === 'read_only' && styles.accessButtonTitleActive,
                  ]}
                >
                  Read Only
                </Text>
                <Text style={styles.accessButtonDesc}>
                  Can view entries, trends, and analysis
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.accessButton,
                accessLevel === 'read_write' && styles.accessButtonActive,
              ]}
              onPress={() => setAccessLevel('read_write')}
            >
              <Edit3 size={20} color={accessLevel === 'read_write' ? '#fff' : '#9ca3af'} />
              <View style={styles.accessButtonContent}>
                <Text
                  style={[
                    styles.accessButtonTitle,
                    accessLevel === 'read_write' && styles.accessButtonTitleActive,
                  ]}
                >
                  Read & Write
                </Text>
                <Text style={styles.accessButtonDesc}>
                  Can also add entries, appointments, and questions
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!inviteeName.trim() || !inviteeEmail.trim()) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSendInvite}
            disabled={!inviteeName.trim() || !inviteeEmail.trim()}
          >
            <Text style={styles.submitButtonText}>Send Invitation</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#f9fafb" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Access</Text>
        <TouchableOpacity
          onPress={() => setViewMode('invite')}
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>People You've Invited</Text>
          {invitations.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>No pending invitations</Text>
            </View>
          ) : (
            invitations.map((invite) => (
              <View key={invite.id} style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>{invite.invitee_name}</Text>
                  <Text style={styles.cardDetail}>{invite.invitee_email}</Text>
                  <Text style={styles.cardDetail}>
                    {invite.access_level === 'read_only'
                      ? 'Read Only'
                      : 'Read & Write'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleCancelInvite(invite)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>People With Access</Text>
          {ownedAccess.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                No one has access yet
              </Text>
            </View>
          ) : (
            ownedAccess.map((access) => (
              <View key={access.id} style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>{access.supporter_name}</Text>
                  <Text style={styles.cardDetail}>
                    {access.access_level === 'read_only'
                      ? 'Read Only'
                      : 'Read & Write'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRevokeAccess(access)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {grantedAccess.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data You Can Access</Text>
            {grantedAccess.map((access) => (
              <View key={access.id} style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>Bloodwork Data</Text>
                  <Text style={styles.cardDetail}>
                    {access.access_level === 'read_only'
                      ? 'Read Only'
                      : 'Read & Write'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRevokeAccess(access)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  content: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoBox: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
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
  accessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#374151',
  },
  accessButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a8a',
  },
  accessButtonContent: {
    flex: 1,
  },
  accessButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
  },
  accessButtonTitleActive: {
    color: '#fff',
  },
  accessButtonDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#374151',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 4,
  },
  cardDetail: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  emptySection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
