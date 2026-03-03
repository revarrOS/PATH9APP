/**
 * INACTIVE / FUTURE — DO NOT MODIFY OR ACTIVATE WITHOUT EXPLICIT APPROVAL
 *
 * This screen is a placeholder for future mindfulness pathway features.
 * It is not currently integrated with any backend services.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Brain } from 'lucide-react-native';
import { theme } from '@/config/theme';

export default function MindfulnessScreen() {
  return (
    <View style={styles.container}>
      <Brain size={64} color={theme.colors.text.disabled} />
      <Text style={styles.title}>Mindfulness</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
      <Text style={styles.description}>
        Mindfulness practices will be available in a future update
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.disabled,
    textAlign: 'center',
    lineHeight: 20,
  },
});
