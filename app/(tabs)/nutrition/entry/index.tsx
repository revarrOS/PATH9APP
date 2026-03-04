import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, ChevronLeft, Apple, ArrowDownUp } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { nutritionService } from '@/products/nutrition/services/nutrition.service';
import { NutritionEntryCard } from '@/products/nutrition/components/NutritionEntryCard';
import type { NutritionEntry } from '@/products/nutrition/types/nutrition.types';
import { theme } from '@/config/theme';

type SortOrder = 'newest' | 'oldest';

export default function NutritionEntryList() {
  const router = useRouter();
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [])
  );

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await nutritionService.getEntries();

      if (fetchError) {
        setError('Failed to load nutrition entries');
        setLoading(false);
        return;
      }

      if (data) {
        setEntries(data);

        const urls: Record<string, string> = {};
        for (const entry of data.slice(0, 10)) {
          if (entry.image_path) {
            const url = await nutritionService.getImageUrl(entry.image_path);
            if (url) {
              urls[entry.id] = url;
            }
          }
        }
        setImageUrls(urls);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await nutritionService.deleteEntry(id);
    if (!deleteError) {
      loadEntries();
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
  };

  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = new Date(a.entry_date).getTime();
    const dateB = new Date(b.entry_date).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

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
          <Text style={styles.title}>Nutrition Records</Text>
          <Text style={styles.subtitle}>Log and review your meals & snacks</Text>
        </View>
        <View style={styles.headerActions}>
          {entries.length > 1 && (
            <TouchableOpacity
              style={styles.sortButton}
              onPress={toggleSortOrder}
              activeOpacity={0.7}>
              <ArrowDownUp size={18} color={theme.colors.text.muted} />
              <Text style={styles.sortButtonText}>
                {sortOrder === 'newest' ? 'Latest' : 'Earliest'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/nutrition/entry/new')}
            activeOpacity={0.7}>
            <Plus size={24} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.state.success} />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadEntries}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : entries.length === 0 ? (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.emptyStateContainer}>
          <View style={styles.emptyState}>
            <Apple size={64} color={theme.colors.text.disabled} />
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyDescription}>
              Record your first meal or snack to start tracking your nutrition patterns
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/nutrition/entry/new')}>
              <Text style={styles.emptyButtonText}>Record First Entry</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>
          {sortedEntries.map((entry) => (
            <NutritionEntryCard
              key={entry.id}
              entry={entry}
              imageUrl={imageUrls[entry.id]}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          For tracking only. Not medical advice.
        </Text>
      </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    gap: 6,
  },
  sortButtonText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.secondary,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.state.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.state.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.state.success,
    borderRadius: theme.borderRadius.sm,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  emptyStateContainer: {
    flex: 1,
    paddingBottom: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.state.success,
    borderRadius: theme.borderRadius.sm,
  },
  emptyButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  scrollContent: {
    flex: 1,
  },
  scrollPadding: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  disclaimer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  disclaimerText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
});
