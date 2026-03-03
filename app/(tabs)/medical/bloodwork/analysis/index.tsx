import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { BloodworkChat } from '@/products/bloodwork/components/BloodworkChat';
import { theme } from '@/config/theme';

export default function BloodworkAnalysisScreen() {
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
        <Text style={styles.title}>Bloodwork Analysis</Text>
        <Text style={styles.subtitle}>
          Gemma can help you review numbers and trends and prepare questions for your clinician.
          She cannot interpret medical meaning.
        </Text>
      </View>
      <BloodworkChat />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    paddingLeft: 36,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.muted,
    lineHeight: 20,
  },
});
