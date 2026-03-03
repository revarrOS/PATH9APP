import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Clock, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/config/theme';
import { supabase } from '@/lib/supabase';

interface Appointment {
  id: string;
  appointment_datetime: string;
  provider_name?: string;
  provider_role?: string;
  appointment_type?: string;
  status?: string;
  preparation_notes?: string;
  location?: string;
}

export default function ConditionAppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    loadAppointments();
  }, [filterMode]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const now = new Date().toISOString();

      let query = supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id);

      if (filterMode === 'upcoming') {
        query = query.gte('appointment_datetime', now);
      } else if (filterMode === 'past') {
        query = query.lt('appointment_datetime', now);
      }

      const { data, error: fetchError } = await query.order('appointment_datetime', {
        ascending: filterMode !== 'past',
      });

      if (fetchError) throw fetchError;

      setAppointments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Appointments</Text>
          <Text style={styles.subtitle}>Your scheduled visits</Text>
        </View>
        <View style={styles.headerIcon}>
          <Calendar size={24} color={theme.colors.brand.cyan} />
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filterMode === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterMode('all')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.filterButtonText,
              filterMode === 'all' && styles.filterButtonTextActive,
            ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterMode === 'upcoming' && styles.filterButtonActive]}
          onPress={() => setFilterMode('upcoming')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.filterButtonText,
              filterMode === 'upcoming' && styles.filterButtonTextActive,
            ]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterMode === 'past' && styles.filterButtonActive]}
          onPress={() => setFilterMode('past')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.filterButtonText,
              filterMode === 'past' && styles.filterButtonTextActive,
            ]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.cyan} />
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={64} color={theme.colors.text.disabled} />
          <Text style={styles.emptyTitle}>No appointments</Text>
          <Text style={styles.emptyDescription}>
            {filterMode === 'upcoming'
              ? 'No upcoming appointments scheduled'
              : filterMode === 'past'
              ? 'No past appointments found'
              : 'Upload letters to automatically extract appointments'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {appointments.map((appt) => (
            <View key={appt.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <View style={styles.dateSection}>
                  <Calendar size={20} color={theme.colors.brand.cyan} />
                  <Text style={styles.dateText}>{formatDate(appt.appointment_datetime)}</Text>
                </View>
                {appt.status && (
                  <View style={[
                    styles.statusBadge,
                    appt.status === 'completed' && styles.statusBadgeCompleted,
                    appt.status === 'cancelled' && styles.statusBadgeCancelled,
                  ]}>
                    <Text style={styles.statusText}>{appt.status.toUpperCase()}</Text>
                  </View>
                )}
              </View>

              <View style={styles.appointmentBody}>
                {appt.provider_name && (
                  <Text style={styles.providerName}>{appt.provider_name}</Text>
                )}
                {appt.provider_role && (
                  <Text style={styles.providerRole}>{appt.provider_role}</Text>
                )}
                {appt.appointment_type && (
                  <Text style={styles.appointmentType}>Type: {appt.appointment_type}</Text>
                )}
              </View>

              <View style={styles.appointmentFooter}>
                <View style={styles.timeRow}>
                  <Clock size={16} color={theme.colors.text.muted} />
                  <Text style={styles.timeText}>{formatTime(appt.appointment_datetime)}</Text>
                </View>
                {appt.location && (
                  <View style={styles.locationRow}>
                    <MapPin size={16} color={theme.colors.text.muted} />
                    <Text style={styles.locationText}>{appt.location}</Text>
                  </View>
                )}
              </View>

              {appt.preparation_notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{appt.preparation_notes}</Text>
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
  filters: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.brand.cyan,
    borderColor: theme.colors.brand.cyan,
  },
  filterButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.secondary,
  },
  filterButtonTextActive: {
    color: theme.colors.text.inverse,
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
    paddingTop: 0,
    paddingBottom: theme.spacing.xl,
  },
  appointmentCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dateText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: theme.colors.brand.cyan,
  },
  statusBadgeCompleted: {
    backgroundColor: theme.colors.state.success,
  },
  statusBadgeCancelled: {
    backgroundColor: theme.colors.state.error,
  },
  statusText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.inverse,
  },
  appointmentBody: {
    marginBottom: theme.spacing.md,
  },
  providerName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  providerRole: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  appointmentType: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
  },
  appointmentFooter: {
    gap: theme.spacing.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  timeText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  locationText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  notesSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  notesLabel: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.muted,
    marginBottom: 4,
  },
  notesText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
});
