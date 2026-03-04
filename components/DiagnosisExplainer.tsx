/**
 * INACTIVE / FUTURE — DO NOT MODIFY OR ACTIVATE WITHOUT EXPLICIT APPROVAL
 *
 * This is a generic shared component not currently integrated into the app.
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { Diagnosis } from '@/services/medical-journey.service';
import { theme } from '@/config/theme';

interface DiagnosisExplainerProps {
  diagnosis: Diagnosis;
}

export default function DiagnosisExplainer({ diagnosis }: DiagnosisExplainerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <MessageCircle size={24} color={theme.colors.brand.cyan} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Diagnosis Explainer</Text>
          <Text style={styles.subtitle}>In clear language</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.diagnosisName}>{diagnosis.diagnosis_name}</Text>

        {diagnosis.stage_or_severity && (
          <View style={styles.stageContainer}>
            <Text style={styles.stageLabel}>Stage:</Text>
            <Text style={styles.stageValue}>{diagnosis.stage_or_severity}</Text>
          </View>
        )}

        {diagnosis.plain_english_summary ? (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationLabel}>What this means:</Text>
            <Text style={styles.explanationText}>{diagnosis.plain_english_summary}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.translateButton}>
            <Text style={styles.translateButtonText}>Get Plain English Translation</Text>
          </TouchableOpacity>
        )}

        {diagnosis.raw_pathology_text && (
          <View style={styles.technicalContainer}>
            <Text style={styles.technicalLabel}>Medical Report:</Text>
            <Text style={styles.technicalText} numberOfLines={3}>
              {diagnosis.raw_pathology_text}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    ...theme.shadows.sm,
  },
  diagnosisName: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  stageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  stageLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  stageValue: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.brand.cyan,
  },
  explanationContainer: {
    marginTop: theme.spacing.sm,
  },
  explanationLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  explanationText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  translateButton: {
    backgroundColor: theme.colors.brand.cyan,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  translateButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  technicalContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.default,
  },
  technicalLabel: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  technicalText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
