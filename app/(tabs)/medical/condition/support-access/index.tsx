import { View, Text, StyleSheet } from 'react-native';
import { ChevronLeft, UserPlus } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/config/theme';

export default function ConditionSupportAccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Trusted Support</Text>
          <Text style={styles.subtitle}>Share with family or caregivers</Text>
        </View>
      </View>
      <View style={styles.content}>
        <UserPlus size={64} color={theme.colors.text.disabled} />
        <Text style={styles.message}>Share documents with trusted supporters</Text>
        <Text style={styles.submessage}>
          Grant family members or caregivers access to view your condition documents and help track appointments.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerContent: { flex: 1 },
  title: { fontSize: 24, fontWeight: theme.typography.fontWeights.bold, color: theme.colors.text.primary, marginBottom: 4 },
  subtitle: { fontSize: theme.typography.fontSizes.sm, color: theme.colors.text.secondary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  message: { fontSize: 18, fontWeight: theme.typography.fontWeights.semibold, color: theme.colors.text.primary, marginTop: 24, textAlign: 'center' },
  submessage: { fontSize: 14, color: theme.colors.text.muted, marginTop: 12, textAlign: 'center', lineHeight: 20 },
});
