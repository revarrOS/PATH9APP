import { View, Text, StyleSheet } from 'react-native';
import { ConditionChat } from '@/products/condition/components/ConditionChat';
import { theme } from '@/config/theme';

export default function ConditionAnalysisScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Condition Analysis</Text>
        <Text style={styles.subtitle}>
          Gemma can help you understand your clinical documents and prepare questions for your clinician.
          She cannot interpret medical meaning.
        </Text>
      </View>
      <ConditionChat />
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.muted,
    lineHeight: 20,
  },
});
