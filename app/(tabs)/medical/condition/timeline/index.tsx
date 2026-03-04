import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { supabase } from '@/lib/supabase';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'diagnosis' | 'appointment' | 'signal';
  title: string;
  description?: string;
  provider?: string;
  eventCategory?: 'investigation' | 'diagnosis' | 'treatment' | 'administrative';
}

export default function ConditionTimelineScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'investigations' | 'diagnoses' | 'treatments'>('all');

  useEffect(() => {
    loadTimelineEvents();
  }, [categoryFilter]);

  const loadTimelineEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const allEvents: TimelineEvent[] = [];

      const { data: diagnoses, error: diagErr } = await supabase
        .from('diagnoses')
        .select('*')
        .eq('user_id', user.id)
        .order('diagnosis_date', { ascending: false });

      if (diagErr) throw diagErr;

      (diagnoses || []).forEach(d => {
        if (d.diagnosis_date) {
          allEvents.push({
            id: d.id,
            date: d.diagnosis_date,
            type: 'diagnosis',
            title: d.diagnosis_name,
            description: d.plain_english_summary || undefined,
          });
        }
      });

      const { data: appointments, error: apptErr } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('appointment_datetime', { ascending: false });

      if (apptErr) throw apptErr;

      (appointments || []).forEach(a => {
        allEvents.push({
          id: a.id,
          date: a.appointment_datetime,
          type: 'appointment',
          title: a.provider_name || 'Appointment',
          description: a.preparation_notes || `${a.appointment_type} - ${a.status}`,
          provider: a.provider_role || undefined,
          eventCategory: a.event_category || 'investigation',
        });
      });

      const { data: signals, error: signalErr } = await supabase
        .from('condition_trend_signals')
        .select('*')
        .eq('user_id', user.id)
        .order('signal_date', { ascending: false });

      if (signalErr) throw signalErr;

      (signals || []).forEach(s => {
        allEvents.push({
          id: s.id,
          date: s.signal_date,
          type: 'signal',
          title: s.description,
          description: `${s.signal_type} - ${s.category}`,
        });
      });

      allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const filteredEvents = allEvents.filter(event => {
        if (categoryFilter === 'all') return true;

        if (categoryFilter === 'investigations') {
          return event.eventCategory === 'investigation' || event.type === 'signal';
        }

        if (categoryFilter === 'diagnoses') {
          return event.type === 'diagnosis' || event.eventCategory === 'diagnosis';
        }

        if (categoryFilter === 'treatments') {
          return event.eventCategory === 'treatment';
        }

        return true;
      });

      setEvents(filteredEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'diagnosis':
        return theme.colors.state.error;
      case 'appointment':
        return theme.colors.brand.cyan;
      case 'signal':
        return theme.colors.brand.violet;
      default:
        return theme.colors.text.muted;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Timeline</Text>
          <Text style={styles.subtitle}>Your medical journey</Text>
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
          style={[styles.filterButton, categoryFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setCategoryFilter('all')}
          activeOpacity={0.7}>
          <Text style={[styles.filterButtonText, categoryFilter === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, categoryFilter === 'investigations' && styles.filterButtonActive]}
          onPress={() => setCategoryFilter('investigations')}
          activeOpacity={0.7}>
          <Text style={[styles.filterButtonText, categoryFilter === 'investigations' && styles.filterButtonTextActive]}>
            Investigations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, categoryFilter === 'diagnoses' && styles.filterButtonActive]}
          onPress={() => setCategoryFilter('diagnoses')}
          activeOpacity={0.7}>
          <Text style={[styles.filterButtonText, categoryFilter === 'diagnoses' && styles.filterButtonTextActive]}>
            Diagnoses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, categoryFilter === 'treatments' && styles.filterButtonActive]}
          onPress={() => setCategoryFilter('treatments')}
          activeOpacity={0.7}>
          <Text style={[styles.filterButtonText, categoryFilter === 'treatments' && styles.filterButtonTextActive]}>
            Treatments
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.cyan} />
        </View>
      ) : events.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={64} color={theme.colors.text.disabled} />
          <Text style={styles.emptyTitle}>No timeline events yet</Text>
          <Text style={styles.emptyDescription}>
            Events from letters you upload will appear here
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={[styles.eventIndicator, { backgroundColor: getEventColor(event.type) }]} />
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
                  <View style={[styles.eventTypeBadge, { backgroundColor: getEventColor(event.type) }]}>
                    <Text style={styles.eventTypeText}>{event.type.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.eventTitle}>{event.title}</Text>
                {event.eventCategory && event.type === 'appointment' && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {event.eventCategory === 'investigation' ? 'Investigation' :
                       event.eventCategory === 'diagnosis' ? 'Diagnosis' :
                       event.eventCategory === 'treatment' ? 'Treatment' : 'Administrative'}
                    </Text>
                  </View>
                )}
                {event.description && (
                  <Text style={styles.eventDescription}>{event.description}</Text>
                )}
                {event.provider && (
                  <Text style={styles.eventProvider}>Provider: {event.provider}</Text>
                )}
              </View>
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
    marginBottom: theme.spacing.xs,
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
    gap: 8,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  filterButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: 12,
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
    paddingBottom: theme.spacing.xl,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  eventIndicator: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  eventDate: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    fontWeight: theme.typography.fontWeights.medium,
  },
  eventTypeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.xs,
  },
  eventTypeText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.inverse,
  },
  eventTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: `${theme.colors.brand.cyan}20`,
    marginBottom: theme.spacing.xs,
  },
  categoryText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.brand.cyan,
  },
  eventDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: theme.spacing.xs,
  },
  eventProvider: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
  },
});
