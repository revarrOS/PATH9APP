/**
 * INACTIVE / FUTURE — DO NOT MODIFY OR ACTIVATE WITHOUT EXPLICIT APPROVAL
 *
 * This screen is a placeholder for future journey tracking features.
 * It is not currently integrated with the medical journey service.
 */

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import ProgressIndicator from '@/components/ProgressIndicator';
import DiagnosisExplainer from '@/components/DiagnosisExplainer';
import AppointmentCard from '@/components/AppointmentCard';
import NextStepsStrip from '@/components/NextStepsStrip';
import TimelineVisualization from '@/components/TimelineVisualization';
import {
  getUserDiagnosis,
  getUserAppointments,
  getUserTimeline,
  getCurrentPhase,
  getNextMilestones,
  getEmotionalProgress,
} from '@/services/medical-journey.service';
import { theme } from '@/config/theme';

export default function MyPathScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('chaos');
  const [nextMilestones, setNextMilestones] = useState<string[]>([]);
  const [daysInJourney, setDaysInJourney] = useState<number>(0);

  const loadJourneyData = async () => {
    if (!user) return;

    try {
      const [diagnosisResult, appointmentsResult, timelineResult, phase, milestones] =
        await Promise.all([
          getUserDiagnosis(user.id),
          getUserAppointments(user.id, 3),
          getUserTimeline(user.id),
          getCurrentPhase(user.id),
          getNextMilestones(user.id, 5),
        ]);

      if (diagnosisResult.data) {
        setDiagnosis(diagnosisResult.data);

        const diagnosisDate = new Date(diagnosisResult.data.diagnosis_date);
        const today = new Date();
        const daysDiff = Math.floor(
          (today.getTime() - diagnosisDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        setDaysInJourney(daysDiff);
      }

      if (appointmentsResult.data) {
        setAppointments(appointmentsResult.data);
      }

      if (timelineResult.data) {
        setTimeline(timelineResult.data);
      }

      setCurrentPhase(phase);
      setNextMilestones(milestones);
    } catch (error) {
      console.error('Error loading journey data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJourneyData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadJourneyData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.brand.cyan} />
        <Text style={styles.loadingText}>Loading your journey...</Text>
      </View>
    );
  }

  const hasData = diagnosis || appointments.length > 0 || timeline.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>My Path</Text>
        <Text style={styles.subtitle}>Your journey through recovery</Text>
      </View>

      {!hasData ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Start Your Journey</Text>
          <Text style={styles.emptyStateText}>
            Share your diagnosis or upcoming appointments in the Today tab to begin building your
            personalized recovery path.
          </Text>
        </View>
      ) : (
        <>
          <ProgressIndicator
            phase={currentPhase}
            anxietyTrend="stable"
            daysInJourney={daysInJourney}
          />

          {nextMilestones.length > 0 && (
            <NextStepsStrip milestones={nextMilestones} currentPhase={currentPhase} />
          )}

          {diagnosis && <DiagnosisExplainer diagnosis={diagnosis} />}

          {appointments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              {appointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </View>
          )}

          {timeline.length > 0 && <TimelineVisualization phases={timeline} />}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
});
