/**
 * INACTIVE / FUTURE — DO NOT MODIFY OR ACTIVATE WITHOUT EXPLICIT APPROVAL
 *
 * This is a generic shared component not currently integrated into the app.
 */

import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { theme } from '@/config/theme';

interface ProgressIndicatorProps {
  phase: string;
  anxietyTrend?: 'improving' | 'stable' | 'needs_attention';
  daysInJourney?: number;
}

const PHASE_DESCRIPTIONS: Record<string, { label: string; color: string; emoji: string }> = {
  chaos: {
    label: 'Navigating Chaos',
    color: '#ED8936',
    emoji: '🌪️',
  },
  orientation: {
    label: 'Finding Orientation',
    color: '#ECC94B',
    emoji: '🧭',
  },
  predictability: {
    label: 'Building Predictability',
    color: '#48BB78',
    emoji: '📍',
  },
  recovery: {
    label: 'On the Path',
    color: '#4299E1',
    emoji: '🌱',
  },
  survivorship: {
    label: 'Thriving',
    color: '#9F7AEA',
    emoji: '✨',
  },
};

export default function ProgressIndicator({
  phase,
  anxietyTrend = 'stable',
  daysInJourney = 0,
}: ProgressIndicatorProps) {
  const phaseKey = phase.toLowerCase();
  const phaseInfo = PHASE_DESCRIPTIONS[phaseKey] || PHASE_DESCRIPTIONS.chaos;

  const trendInfo = {
    improving: { text: 'Trending Better', color: '#48BB78', icon: '📈' },
    stable: { text: 'Steady Progress', color: '#4299E1', icon: '➡️' },
    needs_attention: { text: 'Need Support?', color: '#ED8936', icon: '💭' },
  };

  const currentTrend = trendInfo[anxietyTrend];

  return (
    <View style={styles.container}>
      <View style={[styles.card, { borderLeftColor: phaseInfo.color, borderLeftWidth: 4 }]}>
        <View style={styles.header}>
          <View style={styles.phaseInfo}>
            <Text style={styles.emoji}>{phaseInfo.emoji}</Text>
            <View>
              <Text style={styles.phaseLabel}>Your Phase</Text>
              <Text style={[styles.phaseText, { color: phaseInfo.color }]}>
                {phaseInfo.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <TrendingUp size={18} color={currentTrend.color} />
            <Text style={[styles.trendText, { color: currentTrend.color }]}>
              {currentTrend.text}
            </Text>
          </View>

          {daysInJourney > 0 && (
            <View style={styles.statItem}>
              <Text style={styles.daysNumber}>{daysInJourney}</Text>
              <Text style={styles.daysLabel}>days in</Text>
            </View>
          )}
        </View>

        <Text style={styles.message}>
          {phaseKey === 'chaos'
            ? "You're taking the first steps. Each day brings more clarity."
            : phaseKey === 'orientation'
            ? "You're finding your way. The path is becoming clearer."
            : phaseKey === 'predictability'
            ? "You're building momentum. Keep going."
            : "You're moving forward steadily."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.md,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  phaseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: theme.typography.fontSizes.xxxl,
    marginRight: theme.spacing.md,
  },
  phaseLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: theme.typography.fontWeights.semibold,
    marginBottom: 2,
  },
  phaseText: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.default,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    marginLeft: 6,
  },
  daysNumber: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginRight: 6,
  },
  daysLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
  },
  message: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
