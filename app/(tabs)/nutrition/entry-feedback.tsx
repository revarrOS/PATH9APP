import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '@/config/theme';
import { nutritionService } from '@/products/nutrition/services/nutrition.service';
import { EntryFeedback } from '@/products/nutrition/components/EntryFeedback';
import type { NutritionEntry } from '@/products/nutrition/types/nutrition.types';

export default function EntryFeedbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ entryId: string }>();
  const [entry, setEntry] = useState<NutritionEntry | null>(null);
  const [totalEntriesThisWeek, setTotalEntriesThisWeek] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [params.entryId]);

  async function loadData() {
    if (!params.entryId) {
      router.replace('/nutrition');
      return;
    }

    const { data: entryData } = await nutritionService.getEntryById(params.entryId);

    if (!entryData) {
      router.replace('/nutrition');
      return;
    }

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const { data: recentEntries } = await nutritionService.getEntries(
      startOfWeek.toISOString().split('T')[0]
    );

    setEntry(entryData);
    setTotalEntriesThisWeek(recentEntries?.length || 1);
    setLoading(false);
  }

  function handleContinue() {
    router.replace('/nutrition');
  }

  if (loading || !entry) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.state.success} />
      </View>
    );
  }

  return (
    <EntryFeedback
      entry={entry}
      totalEntriesThisWeek={totalEntriesThisWeek}
      onContinue={handleContinue}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
});
