import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, ChevronRight, Calendar, ArrowDownUp, ChevronLeft } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { BloodworkService } from '@/products/bloodwork/services/bloodwork.service';
import type { BloodTestWithMarkers } from '@/products/bloodwork/types/bloodwork.types';
import { TrackingDisclaimer } from '@/products/bloodwork/components/TrackingDisclaimer';
import { theme } from '@/config/theme';

type SortOrder = 'newest' | 'oldest';

export default function BloodworkTimeline() {
  const router = useRouter();
  const [tests, setTests] = useState<BloodTestWithMarkers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  useFocusEffect(
    useCallback(() => {
      loadTests();
    }, [])
  );

  const loadTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BloodworkService.getTests();
      setTests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest');
  };

  const sortedTests = [...tests].sort((a, b) => {
    const dateA = new Date(a.test_date).getTime();
    const dateB = new Date(b.test_date).getTime();
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
          <Text style={styles.title}>Blood Test Records</Text>
          <Text style={styles.subtitle}>Log and review your test results</Text>
        </View>
        <View style={styles.headerActions}>
          {tests.length > 1 && (
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
            onPress={() => router.push('/medical/bloodwork/entry/new')}
            activeOpacity={0.7}>
            <Plus size={24} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.brand.cyan} />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTests}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tests.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={64} color={theme.colors.text.disabled} />
          <Text style={styles.emptyTitle}>No tests recorded yet</Text>
          <Text style={styles.emptyDescription}>
            Record your first blood test to start tracking over time
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/medical/bloodwork/entry/new')}>
            <Text style={styles.emptyButtonText}>Record First Test</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.timelineContainer}>
          {sortedTests.map((test) => (
            <TouchableOpacity
              key={test.id}
              style={styles.testCard}
              onPress={() => router.push(`/medical/bloodwork/entry/${test.id}`)}
              activeOpacity={0.7}>
              <View style={styles.testCardContent}>
                <View style={styles.testInfo}>
                  <Text style={styles.testDate}>{formatDate(test.test_date)}</Text>
                  {test.location && (
                    <Text style={styles.testLocation}>{test.location}</Text>
                  )}
                  <Text style={styles.testMarkerCount}>
                    {test.markers.length} marker{test.markers.length !== 1 ? 's' : ''} recorded
                  </Text>
                </View>
                <ChevronRight size={20} color={theme.colors.text.disabled} />
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <TrackingDisclaimer />
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
    backgroundColor: theme.colors.brand.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow.cyan,
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
    backgroundColor: theme.colors.brand.cyan,
    borderRadius: theme.borderRadius.sm,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
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
    backgroundColor: theme.colors.brand.cyan,
    borderRadius: theme.borderRadius.sm,
  },
  emptyButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  timelineContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  testCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.sm,
  },
  testCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testInfo: {
    flex: 1,
  },
  testDate: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  testLocation: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  testMarkerCount: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
  },
});
