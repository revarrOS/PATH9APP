/**
 * Recovery Timeline Component
 *
 * Visual journey showing daily coverage patterns.
 * Makes recovery progress scannable at a glance.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '@/config/theme';
import type { DayStatus } from '../services/pattern-detection.service';

interface RecoveryTimelineProps {
  dailyStatuses: DayStatus[];
  onDayPress?: (date: string) => void;
}

export function RecoveryTimeline({ dailyStatuses, onDayPress }: RecoveryTimelineProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Week</Text>
      <Text style={styles.subtitle}>Daily recovery support coverage</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeline}>
        <View style={styles.timelineContent}>
          {dailyStatuses.map((status, index) => {
            const date = new Date(status.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = date.getDate();

            let colorConfig;
            switch (status.coverageLevel) {
              case 'strong':
                colorConfig = {
                  bg: '#10B981',
                  text: '#FFFFFF',
                  label: 'Strong',
                  symbol: '●●●●',
                };
                break;
              case 'moderate':
                colorConfig = {
                  bg: '#6BB6A0',
                  text: '#FFFFFF',
                  label: 'Moderate',
                  symbol: '●●●○',
                };
                break;
              case 'light':
                colorConfig = {
                  bg: '#94A3B8',
                  text: '#FFFFFF',
                  label: 'Light',
                  symbol: '●●○○',
                };
                break;
              default:
                colorConfig = {
                  bg: '#E5E7EB',
                  text: '#9CA3AF',
                  label: 'None',
                  symbol: '○○○○',
                };
            }

            return (
              <TouchableOpacity
                key={status.date}
                style={[styles.dayCard, { backgroundColor: colorConfig.bg }]}
                onPress={() => onDayPress?.(status.date)}
                activeOpacity={0.8}
                disabled={!onDayPress}>
                <Text style={[styles.dayName, { color: colorConfig.text }]}>{dayName}</Text>
                <Text style={[styles.dayNumber, { color: colorConfig.text }]}>{dayNumber}</Text>
                <Text style={[styles.daySymbol, { color: colorConfig.text }]}>
                  {colorConfig.symbol}
                </Text>
                <Text style={[styles.dayLabel, { color: colorConfig.text }]}>
                  {colorConfig.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Strong variety</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6BB6A0' }]} />
          <Text style={styles.legendText}>Moderate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
          <Text style={styles.legendText}>Light</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E5E7EB' }]} />
          <Text style={styles.legendText}>None</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  timeline: {
    marginBottom: theme.spacing.md,
  },
  timelineContent: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  dayCard: {
    width: 90,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  dayName: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.xs,
  },
  daySymbol: {
    fontSize: 14,
    marginBottom: theme.spacing.xs,
    letterSpacing: 2,
  },
  dayLabel: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
  },
});
