import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { NutritionChat } from '@/products/nutrition/components/NutritionChat';
import { theme } from '@/config/theme';

export default function NutritionAnalysisScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Nutrition Analysis</Text>
          <Text style={styles.subtitle}>
            Gemma can help you reflect on patterns and prepare questions for your clinician.
            She cannot provide medical advice or meal plans.
          </Text>
        </View>
      </View>
      <NutritionChat />
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
    color: theme.colors.text.muted,
    lineHeight: 20,
  },
});
