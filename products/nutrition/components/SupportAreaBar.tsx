import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/config/theme';
import type { SupportAreaFrequency } from '../types/nutrition.types';

type Props = {
  supportArea: SupportAreaFrequency;
};

export function SupportAreaBar({ supportArea }: Props) {
  const widthPercentage = Math.min(supportArea.percentage, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{supportArea.label}</Text>
        <Text style={styles.frequency}>
          {supportArea.count} of {supportArea.totalEntries}
        </Text>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: `${widthPercentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  frequency: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    marginLeft: theme.spacing.sm,
  },
  barContainer: {
    height: 8,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: theme.colors.state.success,
    borderRadius: 4,
  },
});
