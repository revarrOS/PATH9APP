/**
 * Pattern Detection Service
 *
 * Identifies meaningful patterns in nutrition entries (frontend only).
 * Helps surface insights about user's eating habits and recovery support.
 */

import type { NutritionEntry } from '../types/nutrition.types';
import { computeLensSignalsForEntry } from './lens-computation.service';
import { getDiagnosisDisplayName } from '../config/diagnosis-emphasis';

export interface DayStatus {
  date: string;
  coverageLevel: 'strong' | 'moderate' | 'light' | 'none';
  diversityScore: number;
  topLenses: string[];
}

export interface RecoveryPattern {
  insight: string;
  type: 'positive' | 'neutral' | 'opportunity';
  context?: string;
}

export interface WeeklySnapshot {
  strongDays: number;
  moderateDays: number;
  lightDays: number;
  patterns: RecoveryPattern[];
  topFoods: Array<{ food: string; count: number }>;
}

/**
 * Compute daily coverage status
 */
export function computeDailyStatus(entries: NutritionEntry[], days: number = 7): DayStatus[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const groupedByDate = new Map<string, NutritionEntry[]>();

  entries.forEach(entry => {
    const entryDate = new Date(entry.entry_date);
    if (entryDate >= cutoffDate) {
      const dateKey = entry.entry_date;
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }
      groupedByDate.get(dateKey)!.push(entry);
    }
  });

  const dayStatuses: DayStatus[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];

    const dayEntries = groupedByDate.get(dateKey) || [];

    if (dayEntries.length === 0) {
      dayStatuses.push({
        date: dateKey,
        coverageLevel: 'none',
        diversityScore: 0,
        topLenses: [],
      });
      continue;
    }

    const uniqueFoods = new Set<string>();
    const lensPresence = new Map<string, number>();

    dayEntries.forEach(entry => {
      const signals = computeLensSignalsForEntry(entry);

      signals.forEach(signal => {
        if (signal.presence > 0.1) {
          lensPresence.set(
            signal.lensId,
            (lensPresence.get(signal.lensId) || 0) + signal.presence
          );
          signal.contributingFoods.forEach(food => uniqueFoods.add(food));
        }
      });
    });

    const lensCount = lensPresence.size;
    const foodCount = uniqueFoods.size;
    const diversityScore = Math.min(1.0, (foodCount * 0.15) + (lensCount * 0.1));

    let coverageLevel: 'strong' | 'moderate' | 'light' | 'none';
    if (lensCount >= 4 && foodCount >= 5) {
      coverageLevel = 'strong';
    } else if (lensCount >= 2 && foodCount >= 3) {
      coverageLevel = 'moderate';
    } else if (lensCount >= 1) {
      coverageLevel = 'light';
    } else {
      coverageLevel = 'none';
    }

    const topLenses = Array.from(lensPresence.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([lensId]) => lensId);

    dayStatuses.push({
      date: dateKey,
      coverageLevel,
      diversityScore,
      topLenses,
    });
  }

  return dayStatuses.reverse();
}

/**
 * Detect patterns and generate insights
 */
export function detectPatterns(
  entries: NutritionEntry[],
  diagnosisKey: string | null,
  days: number = 7
): RecoveryPattern[] {
  if (entries.length === 0) return [];

  const patterns: RecoveryPattern[] = [];
  const dailyStatuses = computeDailyStatus(entries, days);

  const strongDays = dailyStatuses.filter(d => d.coverageLevel === 'strong').length;
  const moderateDays = dailyStatuses.filter(d => d.coverageLevel === 'moderate').length;
  const lightDays = dailyStatuses.filter(d => d.coverageLevel === 'light').length;
  const noneDays = dailyStatuses.filter(d => d.coverageLevel === 'none').length;

  if (strongDays >= days * 0.6) {
    patterns.push({
      insight: `Strong variety across ${strongDays} days this week`,
      type: 'positive',
    });
  } else if (strongDays + moderateDays >= days * 0.7) {
    patterns.push({
      insight: `Building consistency with good coverage`,
      type: 'positive',
    });
  }

  if (noneDays > days * 0.3) {
    patterns.push({
      insight: `${noneDays} days with no entries - tracking helps spot patterns`,
      type: 'opportunity',
    });
  }

  const recentEntries = entries.slice(0, Math.min(14, entries.length));
  const foodFrequency = new Map<string, number>();

  recentEntries.forEach(entry => {
    const signals = computeLensSignalsForEntry(entry);
    signals.forEach(signal => {
      signal.contributingFoods.forEach(food => {
        foodFrequency.set(food, (foodFrequency.get(food) || 0) + 1);
      });
    });
  });

  const topFoods = Array.from(foodFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (topFoods.length > 0 && topFoods[0][1] >= 3) {
    patterns.push({
      insight: `${topFoods[0][0]} showing up consistently`,
      type: 'neutral',
    });
  }

  const weekendDays = dailyStatuses.filter(d => {
    const date = new Date(d.date);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  });

  const weekendStrong = weekendDays.filter(d => d.coverageLevel === 'strong').length;
  const weekendTotal = weekendDays.length;

  if (weekendTotal >= 2 && weekendStrong < weekendTotal * 0.5) {
    patterns.push({
      insight: `Weekend variety could use attention`,
      type: 'opportunity',
    });
  }

  return patterns;
}

/**
 * Generate weekly snapshot
 */
export function generateWeeklySnapshot(
  entries: NutritionEntry[],
  diagnosisKey: string | null,
  days: number = 7
): WeeklySnapshot {
  const dailyStatuses = computeDailyStatus(entries, days);
  const patterns = detectPatterns(entries, diagnosisKey, days);

  const foodFrequency = new Map<string, number>();

  entries.slice(0, Math.min(14, entries.length)).forEach(entry => {
    const signals = computeLensSignalsForEntry(entry);
    signals.forEach(signal => {
      signal.contributingFoods.forEach(food => {
        foodFrequency.set(food, (foodFrequency.get(food) || 0) + 1);
      });
    });
  });

  const topFoods = Array.from(foodFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([food, count]) => ({ food, count }));

  return {
    strongDays: dailyStatuses.filter(d => d.coverageLevel === 'strong').length,
    moderateDays: dailyStatuses.filter(d => d.coverageLevel === 'moderate').length,
    lightDays: dailyStatuses.filter(d => d.coverageLevel === 'light').length,
    patterns,
    topFoods,
  };
}
