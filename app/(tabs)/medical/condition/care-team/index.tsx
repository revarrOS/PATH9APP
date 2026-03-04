import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { ChevronLeft, Users, Mail, Phone, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/config/theme';
import { supabase } from '@/lib/supabase';

interface CareTeamMember {
  id: string;
  provider_name: string;
  role: string;
  specialty?: string;
  contact_info?: {
    phone?: string;
    email?: string;
    facility?: string;
  };
  notes?: string;
}

export default function ConditionCareTeamScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<CareTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCareTeam();
  }, []);

  const loadCareTeam = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('care_team')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setMembers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load care team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>My Care Team</Text>
          <Text style={styles.subtitle}>Clinical contacts</Text>
        </View>
        <View style={styles.headerIcon}>
          <Users size={24} color={theme.colors.brand.cyan} />
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.cyan} />
        </View>
      ) : members.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={64} color={theme.colors.text.disabled} />
          <Text style={styles.emptyTitle}>No care team members yet</Text>
          <Text style={styles.emptyDescription}>
            Upload letters to automatically extract your care team contacts
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberHeader}>
                <View style={styles.memberIcon}>
                  <Users size={20} color={theme.colors.brand.cyan} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.provider_name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
              </View>

              {member.contact_info?.facility && (
                <View style={styles.contactRow}>
                  <MapPin size={16} color={theme.colors.text.muted} />
                  <Text style={styles.contactText}>{member.contact_info.facility}</Text>
                </View>
              )}

              {member.contact_info?.phone && (
                <View style={styles.contactRow}>
                  <Phone size={16} color={theme.colors.text.muted} />
                  <Text style={styles.contactText}>{member.contact_info.phone}</Text>
                </View>
              )}

              {member.contact_info?.email && (
                <View style={styles.contactRow}>
                  <Mail size={16} color={theme.colors.text.muted} />
                  <Text style={styles.contactText}>{member.contact_info.email}</Text>
                </View>
              )}

              {member.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesText}>{member.notes}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  errorBanner: {
    backgroundColor: `${theme.colors.state.error}20`,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.state.error,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.state.error,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  memberCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  memberIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.brand.cyan}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  memberRole: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  contactText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  notesSection: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  notesText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
  },
});
