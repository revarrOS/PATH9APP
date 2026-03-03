/**
 * Lens Detail View Component
 *
 * Simplified orientation view for a single support lens.
 * Focuses on what's showing up and why, with Gemma as the primary explainer.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/config/theme';
import { getLensById } from '../config/support-lenses';
import { getEducationForLens } from '../config/lens-education';
import { getDiagnosisDisplayName } from '../config/diagnosis-emphasis';

interface LensDetailViewProps {
  lensId: string;
  presence: number;
  frequency: number;
  contributingFoods: string[];
  diagnosisKey: string | null;
  emphasisMultiplier: number;
}

export function LensDetailView({
  lensId,
  presence,
  frequency,
  contributingFoods,
  diagnosisKey,
}: LensDetailViewProps) {
  const router = useRouter();
  const lens = getLensById(lensId);
  const education = getEducationForLens(lensId);

  if (!lens || !education) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Lens information not found</Text>
      </View>
    );
  }

  const firstSentence = education.whatItMeans.split('.')[0] + '.';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.lensIndicator, { backgroundColor: lens.baseColor }]} />
        <Text style={styles.title}>{lens.displayName}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{frequency}</Text>
            <Text style={styles.statLabel}>days</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{contributingFoods.length}</Text>
            <Text style={styles.statLabel}>foods</Text>
          </View>
        </View>
      </View>

      {contributingFoods.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Showed Up</Text>
          <View style={styles.foodsGrid}>
            {contributingFoods.map((food, index) => (
              <View key={index} style={styles.foodChip}>
                <Text style={styles.foodChipText}>{food}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What This Tracks</Text>
        <Text style={styles.bodyText}>{firstSentence}</Text>
      </View>

      <View style={styles.gemmaHandoff}>
        <TouchableOpacity
          style={styles.gemmaButton}
          onPress={() => router.push('/nutrition/analysis')}
          activeOpacity={0.7}>
          <MessageCircle size={20} color={theme.colors.brand.blue} />
          <Text style={styles.gemmaButtonText}>Ask Gemma</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    alignItems: 'center',
  },
  lensIndicator: {
    width: 50,
    height: 4,
    borderRadius: 2,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statBox: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.state.success,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
  },
  section: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  bodyText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  foodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  foodChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  foodChipText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  gemmaHandoff: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.surface,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  gemmaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: `${theme.colors.brand.blue}15`,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: `${theme.colors.brand.blue}40`,
  },
  gemmaButtonText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.brand.blue,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.state.error,
    textAlign: 'center',
    padding: theme.spacing.lg,
  },
});
