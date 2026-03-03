/**
 * Weekly Lens View Component
 *
 * Displays recovery patterns in a calm, observational way.
 * Answers: "What has been showing up in my nutrition patterns lately?"
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { theme } from '@/config/theme';
import { SUPPORT_LENSES, getLensById } from '../config/support-lenses';
import { getEmphasisForDiagnosis } from '../config/diagnosis-emphasis';
import { computeLensSignalsForEntry } from '../services/lens-computation.service';
import type { NutritionEntry } from '../types/nutrition.types';

const { width } = Dimensions.get('window');
const DAY_WIDTH = 32;

interface WeeklyLensViewProps {
  entries: NutritionEntry[];
  diagnosisKey: string | null;
  dayRange?: number;
}

interface DailyLensPresence {
  date: string;
  lensPresence: { [lensId: string]: boolean };
}

interface RecoverySignal {
  lensId: string;
  displayName: string;
  daysPresent: boolean[];
  totalDays: number;
}

export function WeeklyLensView({
  entries,
  diagnosisKey,
  dayRange = 7
}: WeeklyLensViewProps) {
  const [signals, setSignals] = useState<RecoverySignal[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    computeRecoveryPatterns();
  }, [entries, diagnosisKey, dayRange]);

  function computeRecoveryPatterns() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (dayRange - 1));

    const dailyPresence: DailyLensPresence[] = [];

    for (let i = 0; i < dayRange; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dayEntries = entries.filter(e => e.entry_date === dateStr);
      const lensPresence: { [lensId: string]: boolean } = {};

      SUPPORT_LENSES.forEach(lens => {
        let hasPresence = false;
        dayEntries.forEach(entry => {
          const signals = computeLensSignalsForEntry(entry);
          const lensSignal = signals.find(s => s.lensId === lens.id);
          if (lensSignal && lensSignal.presence > 0.1) {
            hasPresence = true;
          }
        });
        lensPresence[lens.id] = hasPresence;
      });

      dailyPresence.push({ date: dateStr, lensPresence });
    }

    const emphasis = getEmphasisForDiagnosis(diagnosisKey);

    const recoverySignals = SUPPORT_LENSES.map(lens => {
      const daysPresent = dailyPresence.map(day => day.lensPresence[lens.id]);
      const totalDays = daysPresent.filter(p => p).length;

      return {
        lensId: lens.id,
        displayName: lens.displayName,
        daysPresent,
        totalDays,
        emphasisScore: totalDays * (emphasis[lens.id] || 1.0)
      };
    }).sort((a, b) => b.emphasisScore - a.emphasisScore).slice(0, 5);

    const patternObservations = generatePatternObservations(recoverySignals, dayRange);

    setSignals(recoverySignals);
    setPatterns(patternObservations);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.text.secondary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recovery Signals</Text>
        <Text style={styles.sectionSubtitle}>What has shown up in the past {dayRange} days</Text>

        <View style={styles.signalsContainer}>
          {signals.map(signal => (
            <RecoverySignalRow key={signal.lensId} signal={signal} />
          ))}
        </View>
      </View>

      {patterns.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patterns Noticed</Text>
          <View style={styles.patternsContainer}>
            {patterns.map((pattern, index) => (
              <Text key={index} style={styles.patternText}>
                {pattern}
              </Text>
            ))}
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          These are observations of what appeared in your entries, not recommendations.
        </Text>
      </View>
    </ScrollView>
  );
}

function RecoverySignalRow({ signal }: { signal: RecoverySignal }) {
  return (
    <View style={styles.signalRow}>
      <View style={styles.signalInfo}>
        <Text style={styles.signalName}>{signal.displayName}</Text>
        <Text style={styles.signalDays}>
          {signal.totalDays} {signal.totalDays === 1 ? 'day' : 'days'}
        </Text>
      </View>

      <View style={styles.dayIndicators}>
        {signal.daysPresent.map((present, index) => (
          <View
            key={index}
            style={[
              styles.dayDot,
              present ? styles.dayDotPresent : styles.dayDotAbsent
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function generatePatternObservations(signals: RecoverySignal[], dayRange: number): string[] {
  const observations: string[] = [];

  signals.forEach(signal => {
    if (signal.totalDays >= dayRange * 0.7) {
      observations.push(
        `${signal.displayName} appeared on most days this week.`
      );
    } else if (signal.totalDays >= dayRange * 0.4) {
      observations.push(
        `${signal.displayName} showed up on some days.`
      );
    } else if (signal.totalDays > 0) {
      observations.push(
        `${signal.displayName} appeared occasionally.`
      );
    }
  });

  return observations.slice(0, 3);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.lg,
  },
  signalsContainer: {
    gap: theme.spacing.md,
  },
  signalRow: {
    gap: theme.spacing.sm,
  },
  signalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  signalName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.primary,
  },
  signalDays: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
  },
  dayIndicators: {
    flexDirection: 'row',
    gap: 6,
  },
  dayDot: {
    width: DAY_WIDTH,
    height: 8,
    borderRadius: 4,
  },
  dayDotPresent: {
    backgroundColor: theme.colors.text.secondary,
  },
  dayDotAbsent: {
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  patternsContainer: {
    gap: theme.spacing.md,
  },
  patternText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.surface,
  },
  footerText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
