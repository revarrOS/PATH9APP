/**
 * Recovery Journey Component
 *
 * Main dashboard showing nutrition recovery progress.
 * Focus on insights, patterns, and actionable next steps.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  TrendingUp,
  Sparkles,
  Calendar,
  MessageCircle,
  Plus,
  ChevronRight,
} from 'lucide-react-native';
import { theme } from '@/config/theme';
import { nutritionService } from '../services/nutrition.service';
import {
  computeDailyStatus,
  detectPatterns,
  generateWeeklySnapshot,
} from '../services/pattern-detection.service';
import { RecoveryTimeline } from './RecoveryTimeline';
import type { NutritionEntry } from '../types/nutrition.types';

export function RecoveryJourney() {
  const router = useRouter();
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [diagnosisKey, setDiagnosisKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);

    const { data: entriesData } = await nutritionService.getEntries(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const { data: prefs } = await nutritionService.getPreferences();

    setEntries(entriesData || []);
    setDiagnosisKey(prefs?.verified_diagnosis || null);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.state.success} />
      </View>
    );
  }

  const dailyStatuses = computeDailyStatus(entries, 7);
  const weeklySnapshot = generateWeeklySnapshot(entries, diagnosisKey, 7);
  const patterns = detectPatterns(entries, diagnosisKey, 7);

  const hasRecentEntries = entries.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {hasRecentEntries ? (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>This Week's Progress</Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{weeklySnapshot.strongDays}</Text>
                <Text style={styles.statLabel}>Strong days</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{weeklySnapshot.moderateDays}</Text>
                <Text style={styles.statLabel}>Moderate days</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{entries.length}</Text>
                <Text style={styles.statLabel}>Total entries</Text>
              </View>
            </View>
          </View>

          <RecoveryTimeline dailyStatuses={dailyStatuses} />

          {patterns.length > 0 && (
            <View style={styles.insightsCard}>
              <View style={styles.insightsHeader}>
                <Sparkles size={20} color={theme.colors.state.success} />
                <Text style={styles.insightsTitle}>Patterns Noticed</Text>
              </View>
              {patterns.map((pattern, index) => (
                <View key={index} style={styles.insightItem}>
                  <View
                    style={[
                      styles.insightDot,
                      {
                        backgroundColor:
                          pattern.type === 'positive'
                            ? '#10B981'
                            : pattern.type === 'opportunity'
                            ? '#F59E0B'
                            : '#94A3B8',
                      },
                    ]}
                  />
                  <Text style={styles.insightText}>{pattern.insight}</Text>
                </View>
              ))}
            </View>
          )}

          {weeklySnapshot.topFoods.length > 0 && (
            <View style={styles.topFoodsCard}>
              <Text style={styles.cardTitle}>Your Go-To Foods</Text>
              <View style={styles.foodsList}>
                {weeklySnapshot.topFoods.map((item, index) => (
                  <View key={index} style={styles.foodItem}>
                    <Text style={styles.foodName}>{item.food}</Text>
                    <Text style={styles.foodCount}>{item.count}x</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Calendar size={64} color={theme.colors.text.disabled} />
          <Text style={styles.emptyTitle}>Start Your Journey</Text>
          <Text style={styles.emptyText}>
            Log your first meal to begin discovering how your food choices support your recovery
          </Text>
        </View>
      )}

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={() => router.push('/nutrition/entry/new')}
          activeOpacity={0.8}>
          <Plus size={24} color={theme.colors.text.inverse} />
          <Text style={styles.actionButtonTextPrimary}>Log Entry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/nutrition/trends')}
          activeOpacity={0.8}>
          <TrendingUp size={20} color={theme.colors.text.primary} />
          <Text style={styles.actionButtonText}>View Trends</Text>
          <ChevronRight size={16} color={theme.colors.text.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/nutrition/analysis')}
          activeOpacity={0.8}>
          <MessageCircle size={20} color={theme.colors.text.primary} />
          <Text style={styles.actionButtonText}>Ask Gemma</Text>
          <ChevronRight size={16} color={theme.colors.text.muted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  summaryCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  summaryTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.state.success,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border.subtle,
  },
  insightsCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  insightsTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  topFoodsCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  cardTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  foodsList: {
    gap: theme.spacing.sm,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  foodName: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
  },
  foodCount: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.state.success,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.lg,
  },
  quickActions: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  actionButtonPrimary: {
    backgroundColor: theme.colors.state.success,
    borderColor: theme.colors.state.success,
  },
  actionButtonText: {
    flex: 1,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  actionButtonTextPrimary: {
    flex: 1,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.inverse,
  },
});
