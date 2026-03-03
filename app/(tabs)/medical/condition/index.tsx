import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, Clock, MessageCircle, Calendar, ClipboardList, Users, UserPlus } from 'lucide-react-native';
import { theme } from '@/config/theme';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CONTAINER_PADDING = 20;
const CARD_WIDTH = (width - CONTAINER_PADDING * 2 - CARD_GAP) / 2;

export default function ConditionManagementDashboard() {
  const router = useRouter();

  const tools = [
    {
      id: 'letters',
      title: 'Letters & Reports',
      description: 'Upload & extract',
      icon: FileText,
      route: '/medical/condition/letters',
      color: theme.colors.brand.cyan,
    },
    {
      id: 'timeline',
      title: 'Timeline',
      description: 'View progression',
      icon: Clock,
      route: '/medical/condition/timeline',
      color: theme.colors.brand.violet,
    },
    {
      id: 'analysis',
      title: 'AI Analysis',
      description: 'Ask Gemma',
      icon: MessageCircle,
      route: '/medical/condition/analysis',
      color: theme.colors.brand.blue,
    },
    {
      id: 'consultation-prep',
      title: 'Consultation',
      description: 'Prep questions',
      icon: ClipboardList,
      route: '/medical/condition/consultation-prep',
      color: theme.colors.brand.magenta,
    },
    {
      id: 'appointments',
      title: 'Appointments',
      description: 'Schedule visits',
      icon: Calendar,
      route: '/medical/condition/appointments',
      color: theme.colors.state.success,
    },
    {
      id: 'care-team',
      title: 'My Care Team',
      description: 'Doctors & contacts',
      icon: Users,
      route: '/medical/condition/care-team',
      color: '#4A90E2',
    },
    {
      id: 'support-access',
      title: 'Trusted Support',
      description: 'Share with loved ones',
      icon: UserPlus,
      route: '/medical/condition/support-access',
      color: '#6BB6A0',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Condition Hub</Text>
        <Text style={styles.subtitle}>
          Track, analyze, and understand your medical journey
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <TouchableOpacity
                key={tool.id}
                style={styles.toolCard}
                onPress={() => router.push(tool.route as any)}
                activeOpacity={0.7}>
                <View style={[styles.iconCircle, { backgroundColor: `${tool.color}20` }]}>
                  <IconComponent size={28} color={tool.color} strokeWidth={2} />
                </View>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolDescription}>{tool.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          For tracking only. Not medical advice.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  title: {
    fontSize: 26,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: CONTAINER_PADDING,
    gap: CARD_GAP,
  },
  toolCard: {
    width: CARD_WIDTH,
    height: 140,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  toolTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  toolDescription: {
    fontSize: 11,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  disclaimer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  disclaimerText: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
});
