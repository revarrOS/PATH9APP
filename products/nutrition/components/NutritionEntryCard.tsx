import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { theme } from '@/config/theme';
import type { NutritionEntry } from '../types/nutrition.types';

type Props = {
  entry: NutritionEntry;
  imageUrl?: string | null;
  onDelete?: () => void;
};

export function NutritionEntryCard({ entry, imageUrl, onDelete }: Props) {
  const date = new Date(entry.entry_date);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.date}>{formattedDate}</Text>
          <Text style={styles.type}>{entry.entry_type}</Text>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Trash2 size={20} color={theme.colors.state.error} />
          </TouchableOpacity>
        )}
      </View>

      {imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      )}

      {entry.ai_interpretation && (
        <View style={styles.interpretation}>
          {entry.ai_interpretation.foodCategories &&
            entry.ai_interpretation.foodCategories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Foods:</Text>
                <Text style={styles.sectionValue}>
                  {entry.ai_interpretation.foodCategories.join(', ')}
                </Text>
              </View>
            )}

          {entry.ai_interpretation.supportAreas &&
            entry.ai_interpretation.supportAreas.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Support areas:</Text>
                <View style={styles.tags}>
                  {entry.ai_interpretation.supportAreas.map((area, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{area}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
        </View>
      )}

      {entry.user_notes && (
        <View style={styles.notes}>
          <Text style={styles.notesText}>{entry.user_notes}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  date: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  type: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.elevated,
  },
  interpretation: {
    marginBottom: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.sm,
  },
  sectionLabel: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  sectionValue: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: theme.colors.background.elevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
  },
  tagText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.secondary,
  },
  notes: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.sm,
  },
  notesText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});
