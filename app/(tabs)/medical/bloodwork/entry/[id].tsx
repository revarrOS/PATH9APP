import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Trash2, Edit3 } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { BloodworkService } from '@/products/bloodwork/services/bloodwork.service';
import type { BloodTestWithMarkers } from '@/products/bloodwork/types/bloodwork.types';
import { TrackingDisclaimer } from '@/products/bloodwork/components/TrackingDisclaimer';
import { theme } from '@/config/theme';

export default function BloodTestDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [test, setTest] = useState<BloodTestWithMarkers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadTest();
    }
  }, [id]);

  const loadTest = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BloodworkService.getTest(id);
      setTest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;

    const confirmed = window.confirm(
      'Delete Blood Test\n\n' +
      'Are you sure you want to delete this blood test?\n\n' +
      'This will permanently remove the test and all its marker values.\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) {
      console.log('Delete cancelled');
      return;
    }

    try {
      console.log('Deleting test:', id);
      setDeleting(true);
      setError(null);

      await BloodworkService.deleteTest(id);

      console.log('Test deleted successfully');
      router.back();
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete test';
      setError(errorMessage);
      window.alert(`Delete Failed\n\n${errorMessage}`);
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.brand.cyan} />
      </View>
    );
  }

  if (error || !test) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error || 'Test not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
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
        <Text style={styles.title}>Test Details (ID: {id?.slice(0, 8)})</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/medical/bloodwork/entry/edit/${id}`)}
            activeOpacity={0.7}>
            <Edit3 size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.7}>
            {deleting ? (
              <ActivityIndicator size="small" color={theme.colors.state.error} />
            ) : (
              <Trash2 size={20} color={theme.colors.state.error} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.date}>{formatDate(test.test_date)}</Text>
          {test.location && (
            <Text style={styles.location}>{test.location}</Text>
          )}
          {test.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{test.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.markersSection}>
          <Text style={styles.sectionTitle}>
            Markers Recorded ({test.markers.length})
          </Text>

          {test.markers.map((marker) => (
            <View key={marker.id} style={styles.markerCard}>
              <Text style={styles.markerName}>{marker.marker_name}</Text>

              <View style={styles.markerValue}>
                <Text style={styles.valueNumber}>{marker.value}</Text>
                <Text style={styles.valueUnit}>{marker.unit}</Text>
              </View>

              {(marker.reference_range_low !== null || marker.reference_range_high !== null) && (
                <View style={styles.rangeContainer}>
                  <Text style={styles.rangeLabel}>Reference range:</Text>
                  <Text style={styles.rangeValue}>
                    {marker.reference_range_low ?? '—'} - {marker.reference_range_high ?? '—'} {marker.unit}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <TrackingDisclaimer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: 60,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.state.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  errorBanner: {
    backgroundColor: theme.colors.state.error,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.state.error,
  },
  errorBannerText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSizes.sm,
    textAlign: 'center',
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
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  date: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  location: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  notesContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  notesLabel: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  notesText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  markersSection: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  markerCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  markerName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  markerValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  valueNumber: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.brand.cyan,
    marginRight: theme.spacing.sm,
  },
  valueUnit: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  rangeValue: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeights.medium,
  },
});
