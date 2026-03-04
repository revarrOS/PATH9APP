/**
 * Entry Feedback Component
 *
 * Shows immediate value after logging a nutrition entry.
 * Displays what the meal contributed to recovery support.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { computeLensSignalsForEntry } from '../services/lens-computation.service';
import { SUPPORT_LENSES } from '../config/support-lenses';
import type { NutritionEntry } from '../types/nutrition.types';

interface EntryFeedbackProps {
  entry: NutritionEntry;
  totalEntriesThisWeek: number;
  onContinue: () => void;
}

export function EntryFeedback({ entry, totalEntriesThisWeek, onContinue }: EntryFeedbackProps) {
  const signals = computeLensSignalsForEntry(entry);

  const topSignals = signals
    .filter(s => s.presence > 0.1)
    .sort((a, b) => b.presence - a.presence)
    .slice(0, 4);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <CheckCircle size={40} color={theme.colors.text.secondary} strokeWidth={2} />
        <Text style={styles.title}>Entry logged</Text>

        {topSignals.length > 0 && (
          <View style={styles.signalsContainer}>
            {topSignals.map(signal => {
              const lens = SUPPORT_LENSES.find(l => l.id === signal.lensId);
              if (!lens) return null;

              return (
                <View key={signal.lensId} style={styles.signalTag}>
                  <Text style={styles.signalText}>{lens.displayName}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={onContinue} activeOpacity={0.8}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  signalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    maxWidth: 320,
  },
  signalTag: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  signalText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  continueButton: {
    margin: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  continueButtonText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.primary,
  },
});
