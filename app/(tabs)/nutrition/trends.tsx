import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, TrendingUp } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { supabase } from '@/lib/supabase';
import { nutritionService } from '@/products/nutrition/services/nutrition.service';
import { WeeklyLensView } from '@/products/nutrition/components/WeeklyLensView';
import type { NutritionEntry } from '@/products/nutrition/types/nutrition.types';

export default function NutritionTrendsScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [diagnosisKey, setDiagnosisKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<7 | 14>(7);

  useEffect(() => {
    loadData();
  }, [timeframe]);

  async function loadData() {
    setLoading(true);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    const { data: entriesData, error: entriesError } = await nutritionService.getEntries(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    if (entriesError) {
      Alert.alert('Error', 'Failed to load nutrition data');
      setLoading(false);
      return;
    }

    setEntries(entriesData || []);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prefs } = await supabase
        .from('nutrition_preferences')
        .select('verified_diagnosis')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefs?.verified_diagnosis) {
        setDiagnosisKey(prefs.verified_diagnosis);
      }
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Your Recovery Patterns</Text>
            <Text style={styles.subtitle}>Based on your food entries, not advice or targets</Text>
          </View>
          <View style={styles.headerIcon}>
            <TrendingUp size={24} color={theme.colors.text.secondary} />
          </View>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.state.success} />
        </View>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Your Recovery Patterns</Text>
            <Text style={styles.subtitle}>Based on your food entries, not advice or targets</Text>
          </View>
          <View style={styles.headerIcon}>
            <TrendingUp size={24} color={theme.colors.text.secondary} />
          </View>
        </View>
        <View style={styles.emptyState}>
          <TrendingUp size={64} color={theme.colors.text.disabled} />
          <Text style={styles.emptyText}>No entries yet</Text>
          <Text style={styles.emptySubtext}>Add some food entries to see what patterns show up</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Your Recovery Patterns</Text>
          <Text style={styles.subtitle}>Based on your food entries, not advice or targets</Text>
        </View>
        <View style={styles.headerIcon}>
          <TrendingUp size={24} color={theme.colors.text.secondary} />
        </View>
      </View>
      <View style={styles.timeframeSelector}>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === 7 && styles.timeframeButtonActive]}
          onPress={() => setTimeframe(7)}>
          <Text
            style={[
              styles.timeframeButtonText,
              timeframe === 7 && styles.timeframeButtonTextActive,
            ]}>
            7 Days
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeframeButton, timeframe === 14 && styles.timeframeButtonActive]}
          onPress={() => setTimeframe(14)}>
          <Text
            style={[
              styles.timeframeButtonText,
              timeframe === 14 && styles.timeframeButtonTextActive,
            ]}>
            14 Days
          </Text>
        </TouchableOpacity>
      </View>
      <WeeklyLensView
        entries={entries}
        diagnosisKey={diagnosisKey}
        dayRange={timeframe}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl * 2,
    lineHeight: 20,
  },
  timeframeSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 0,
    backgroundColor: theme.colors.background.primary,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: theme.colors.state.success,
    borderColor: theme.colors.state.success,
  },
  timeframeButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.secondary,
  },
  timeframeButtonTextActive: {
    color: theme.colors.text.inverse,
  },
});
