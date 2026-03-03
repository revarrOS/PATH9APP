import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, FileText, ArrowLeft } from 'lucide-react-native';
import { theme } from '@/config/theme';

export default function MedicalDashboard() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Medical</Text>
        <Text style={styles.subtitle}>
          Tools to help you understand and organize your health information
        </Text>
      </View>

      <View style={styles.productsContainer}>
        <TouchableOpacity
          style={styles.productCard}
          onPress={() => router.push('/medical/bloodwork')}
          activeOpacity={0.7}>
          <View style={styles.productIcon}>
            <Activity size={32} color={theme.colors.brand.cyan} />
          </View>
          <View style={styles.productContent}>
            <Text style={styles.productTitle}>Bloodwork Management</Text>
            <Text style={styles.productDescription}>
              Track your blood test results over time and see how your numbers change
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.productCard, { marginTop: theme.spacing.md }]}
          onPress={() => router.push('/medical/condition')}
          activeOpacity={0.7}>
          <View style={styles.productIcon}>
            <FileText size={32} color={theme.colors.brand.violet} />
          </View>
          <View style={styles.productContent}>
            <Text style={styles.productTitle}>Condition Management</Text>
            <Text style={styles.productDescription}>
              Track your medical journey through clinical letters and reports
            </Text>
          </View>
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
    padding: theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.lg,
    zIndex: 10,
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    paddingLeft: 36,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  productsContainer: {
    padding: theme.spacing.md,
  },
  productCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.md,
  },
  productIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  productContent: {
    flex: 1,
  },
  productTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  productDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    lineHeight: 20,
  },
});
