/**
 * INACTIVE / FUTURE — DO NOT MODIFY OR ACTIVATE WITHOUT EXPLICIT APPROVAL
 *
 * This is a generic shared component not currently integrated into the app.
 */

import { View, Text, StyleSheet } from 'react-native';
import { TimelinePhase } from '@/services/medical-journey.service';
import { theme } from '@/config/theme';

interface TimelineVisualizationProps {
  phases: TimelinePhase[];
}

export default function TimelineVisualization({ phases }: TimelineVisualizationProps) {
  if (!phases || phases.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Journey Map</Text>
      <Text style={styles.subtitle}>Step by step, at your pace</Text>

      <View style={styles.timelineContainer}>
        {phases.map((phase, index) => (
          <View key={phase.id} style={styles.phaseContainer}>
            <View style={styles.phaseLeft}>
              <View style={[
                styles.phaseIndicator,
                phase.status === 'completed' && styles.phaseCompleted,
                phase.status === 'in_progress' && styles.phaseInProgress,
                phase.status === 'upcoming' && styles.phaseUpcoming,
              ]}>
                <Text style={styles.phaseNumber}>{phase.phase_order}</Text>
              </View>
              {index < phases.length - 1 && (
                <View style={[
                  styles.connector,
                  phase.status === 'completed' && styles.connectorCompleted,
                ]} />
              )}
            </View>

            <View style={styles.phaseRight}>
              <View style={[
                styles.phaseCard,
                phase.status === 'in_progress' && styles.phaseCardActive,
              ]}>
                <View style={styles.phaseHeader}>
                  <Text style={styles.phaseName}>{phase.timeline_phase}</Text>
                  {phase.status === 'in_progress' && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                  {phase.status === 'completed' && (
                    <Text style={styles.completedText}>✓</Text>
                  )}
                </View>

                {phase.description && (
                  <Text style={styles.phaseDescription}>{phase.description}</Text>
                )}

                {phase.estimated_duration_weeks && (
                  <Text style={styles.phaseDuration}>
                    ~{phase.estimated_duration_weeks} weeks
                  </Text>
                )}

                {phase.key_milestones && phase.key_milestones.length > 0 && (
                  <View style={styles.milestonesContainer}>
                    {phase.key_milestones.slice(0, 3).map((milestone, idx) => (
                      <Text key={idx} style={styles.milestone}>
                        • {milestone}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.lg,
  },
  timelineContainer: {
    paddingLeft: theme.spacing.sm,
  },
  phaseContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  phaseLeft: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  phaseIndicator: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.border.default,
  },
  phaseCompleted: {
    backgroundColor: theme.colors.state.success,
    borderColor: theme.colors.state.success,
  },
  phaseInProgress: {
    backgroundColor: theme.colors.brand.cyan,
    borderColor: theme.colors.brand.cyan,
  },
  phaseUpcoming: {
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.subtle,
  },
  phaseNumber: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.muted,
  },
  connector: {
    width: 3,
    flex: 1,
    backgroundColor: theme.colors.border.default,
    marginVertical: 4,
  },
  connectorCompleted: {
    backgroundColor: theme.colors.state.success,
  },
  phaseRight: {
    flex: 1,
  },
  phaseCard: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    marginBottom: theme.spacing.sm,
  },
  phaseCardActive: {
    backgroundColor: theme.colors.background.elevated,
    borderColor: theme.colors.brand.cyan,
    borderWidth: 2,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  phaseName: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  currentBadge: {
    backgroundColor: theme.colors.brand.cyan,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  currentBadgeText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  completedText: {
    fontSize: theme.typography.fontSizes.xl,
    color: theme.colors.state.success,
  },
  phaseDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  phaseDuration: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  milestonesContainer: {
    marginTop: 4,
  },
  milestone: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    lineHeight: 18,
  },
});
