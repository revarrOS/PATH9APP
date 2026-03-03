import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, AlertCircle } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { theme } from '@/config/theme';
import { getConditionNutritionKnowledge } from '@/products/nutrition/knowledge/condition-nutrition-map';
import { nutritionService } from '@/products/nutrition/services/nutrition.service';

type TopicCategory = {
  id: string;
  title: string;
  topics: string[];
  icon: typeof BookOpen;
  color: string;
};

export default function NutritionEducationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [categories, setCategories] = useState<TopicCategory[]>([]);

  useEffect(() => {
    loadEducationContent();
  }, []);

  async function loadEducationContent() {
    try {
      const { data: preferences } = await nutritionService.getPreferences();
      const userDiagnosis = preferences?.verified_diagnosis || null;
      setDiagnosis(userDiagnosis);

      const knowledge = getConditionNutritionKnowledge(userDiagnosis);

      const topicCategories: TopicCategory[] = [];

      if (knowledge.educationTopics.length > 0) {
        topicCategories.push({
          id: 'education',
          title: 'Educational Topics',
          topics: knowledge.educationTopics,
          icon: BookOpen,
          color: theme.colors.brand.blue,
        });
      }

      if (knowledge.cautionTopics.length > 0) {
        topicCategories.push({
          id: 'caution',
          title: 'Safety Considerations',
          topics: knowledge.cautionTopics,
          icon: AlertCircle,
          color: theme.colors.state.warning,
        });
      }

      setCategories(topicCategories);
    } catch (error) {
      console.error('Error loading education content:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatTopicLabel(topic: string): string {
    return topic
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  if (loading) {
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
            <Text style={styles.title}>Educational Topics</Text>
            <Text style={styles.subtitle}>
              Explore nutrition topics relevant to your journey
            </Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand.blue} />
        </View>
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
          <ArrowLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Educational Topics</Text>
          <Text style={styles.subtitle}>
            Explore nutrition topics relevant to your journey
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <View style={styles.introCard}>
          <BookOpen size={24} color={theme.colors.brand.blue} strokeWidth={2} />
          <Text style={styles.introText}>
            You might find it helpful to explore educational content about these topics from registered dietitians or medical institutions.
            These resources often provide evidence-based guidance.
          </Text>
        </View>

        {categories.length === 0 && (
          <View style={styles.emptyState}>
            <BookOpen size={64} color={theme.colors.text.disabled} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Topics Available</Text>
            <Text style={styles.emptyDescription}>
              Educational topics will appear here based on your condition profile.
            </Text>
          </View>
        )}

        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <View key={category.id} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIconCircle, { backgroundColor: `${category.color}20` }]}>
                  <IconComponent size={20} color={category.color} strokeWidth={2} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </View>

              <View style={styles.topicsContainer}>
                {category.topics.map((topic, index) => (
                  <View key={index} style={styles.topicCard}>
                    <View style={styles.topicDot} />
                    <Text style={styles.topicText}>{formatTopicLabel(topic)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.suggestionBox}>
                <Text style={styles.suggestionText}>
                  When searching for information about these topics, look for content from:
                </Text>
                <Text style={styles.suggestionItem}>• Registered dietitians (RD, RDN)</Text>
                <Text style={styles.suggestionItem}>• Cancer centers and medical institutions</Text>
                <Text style={styles.suggestionItem}>• University hospitals</Text>
                <Text style={styles.suggestionItem}>• Organizations like the Leukemia & Lymphoma Society</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.disclaimerBox}>
          <AlertCircle size={16} color={theme.colors.text.muted} />
          <Text style={styles.disclaimerText}>
            This is educational guidance only. Always consult your healthcare team before making dietary changes during treatment.
          </Text>
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  introCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  introText: {
    flex: 1,
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptyDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  categorySection: {
    marginBottom: theme.spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  categoryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
  },
  topicsContainer: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  topicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.brand.blue,
  },
  topicText: {
    flex: 1,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  suggestionBox: {
    backgroundColor: `${theme.colors.brand.blue}08`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: `${theme.colors.brand.blue}30`,
  },
  suggestionText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    fontWeight: theme.typography.fontWeights.medium,
  },
  suggestionItem: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    paddingLeft: theme.spacing.xs,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  disclaimerText: {
    flex: 1,
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    lineHeight: 18,
  },
});
