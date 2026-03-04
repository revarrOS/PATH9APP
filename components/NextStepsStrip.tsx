/**
 * INACTIVE / FUTURE — DO NOT MODIFY OR ACTIVATE WITHOUT EXPLICIT APPROVAL
 *
 * This is a generic shared component not currently integrated into the app.
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { theme } from '@/config/theme';

interface NextStepsStripProps {
  milestones: string[];
  currentPhase: string;
}

export default function NextStepsStrip({ milestones, currentPhase }: NextStepsStripProps) {
  if (!milestones || milestones.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Next Steps</Text>
      <Text style={styles.subtitle}>What's coming up</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepsContainer}
        style={styles.stepsScroll}>
        {milestones.map((milestone, index) => (
          <View key={index} style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{milestone}</Text>
            {index < milestones.length - 1 && (
              <View style={styles.arrowContainer}>
                <ChevronRight size={16} color={theme.colors.border.default} />
              </View>
            )}
          </View>
        ))}
      </ScrollView>
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
    marginBottom: theme.spacing.md,
  },
  stepsScroll: {
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  stepsContainer: {
    paddingRight: theme.spacing.lg,
  },
  stepCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
    width: 220,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.brand.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stepNumberText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  stepText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  arrowContainer: {
    position: 'absolute',
    right: -6,
    top: '50%',
    marginTop: -8,
  },
});
