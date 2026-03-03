import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { theme } from '@/config/theme';
import { supabase } from '@/lib/supabase';
import { nutritionService } from '@/products/nutrition/services/nutrition.service';
import { computeRecentLensPatterns } from '@/products/nutrition/services/lens-computation.service';
import { getEmphasisForDiagnosis } from '@/products/nutrition/config/diagnosis-emphasis';
import { LensDetailView } from '@/products/nutrition/components/LensDetailView';
import type { NutritionEntry } from '@/products/nutrition/types/nutrition.types';

export default function LensDetailScreen() {
  const router = useRouter();
  const { lensId } = useLocalSearchParams<{ lensId: string }>();
  const [loading, setLoading] = useState(true);
  const [lensData, setLensData] = useState<any>(null);

  useEffect(() => {
    loadLensData();
  }, [lensId]);

  async function loadLensData() {
    setLoading(true);

    // Load nutrition entries from past 14 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);

    const { data: entriesData, error: entriesError } = await nutritionService.getEntries(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    if (entriesError || !entriesData) {
      setLoading(false);
      return;
    }

    // Compute lens patterns
    const patterns = computeRecentLensPatterns(entriesData, 14);
    const pattern = patterns.find(p => p.lensId === lensId);

    if (!pattern) {
      setLoading(false);
      return;
    }

    // Load diagnosis for emphasis
    const { data: { user } } = await supabase.auth.getUser();
    let diagnosisKey: string | null = null;

    if (user) {
      const { data: prefs } = await supabase
        .from('nutrition_preferences')
        .select('verified_diagnosis')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefs?.verified_diagnosis) {
        diagnosisKey = prefs.verified_diagnosis;
      }
    }

    const emphasis = getEmphasisForDiagnosis(diagnosisKey);
    const emphasisMultiplier = emphasis[lensId] || 1.0;

    setLensData({
      lensId: pattern.lensId,
      presence: pattern.presence,
      frequency: pattern.frequency,
      contributingFoods: pattern.contributingFoods,
      diagnosisKey,
      emphasisMultiplier,
    });

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
          <Text style={styles.headerTitle}>Lens Detail</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.state.success} />
        </View>
      </View>
    );
  }

  if (!lensData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lens Detail</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Lens data not found</Text>
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
        <Text style={styles.headerTitle}>Lens Detail</Text>
        <View style={styles.headerSpacer} />
      </View>
      <LensDetailView {...lensData} />
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.state.error,
  },
});
