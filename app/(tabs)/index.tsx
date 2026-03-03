import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Stethoscope, Utensils, Activity, Brain, Sparkles, Library } from 'lucide-react-native';
import { theme } from '@/config/theme';

export default function DashboardScreen() {
  const router = useRouter();

  const pillars = [
    {
      id: 'medical',
      label: 'Medical',
      icon: Stethoscope,
      route: '/medical',
      color: theme.colors.brand.cyan,
      enabled: true,
    },
    {
      id: 'nutrition',
      label: 'Nutrition',
      icon: Utensils,
      route: '/nutrition',
      color: theme.colors.brand.purple,
      enabled: true,
    },
    {
      id: 'movement',
      label: 'Movement',
      icon: Activity,
      route: '/movement',
      color: theme.colors.brand.blue,
      enabled: true,
    },
    {
      id: 'mindfulness',
      label: 'Mindfulness',
      icon: Brain,
      route: '/mindfulness',
      color: theme.colors.brand.violet,
      enabled: true,
    },
    {
      id: 'awakening',
      label: 'Awakening',
      icon: Sparkles,
      route: '/meditation',
      color: theme.colors.brand.magenta,
      enabled: true,
    },
    {
      id: 'library',
      label: 'Library',
      icon: Library,
      route: '/library',
      color: theme.colors.brand.pink,
      enabled: true,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.brandingContainer}>
        <View style={styles.brandingHeader}>
          <Image
            source={require('@/assets/images/image.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandName}>Path9</Text>
            <Text style={styles.poweredByText}>Powered by Gemma</Text>
          </View>
        </View>
      </View>

      <View style={styles.pillarsGrid}>
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          const isDisabled = !pillar.enabled;
          return (
            <TouchableOpacity
              key={pillar.id}
              style={[styles.pillarCard, isDisabled && styles.pillarCardDisabled]}
              onPress={() => pillar.enabled && router.push(pillar.route as any)}
              activeOpacity={pillar.enabled ? 0.8 : 1}
              disabled={isDisabled}>
              <View style={[
                styles.iconContainer,
                { borderColor: isDisabled ? theme.colors.border.subtle : pillar.color },
                isDisabled && styles.iconContainerDisabled
              ]}>
                <Icon
                  size={32}
                  color={isDisabled ? theme.colors.text.disabled : pillar.color}
                  strokeWidth={1.5}
                />
              </View>
              <Text style={[styles.pillarLabel, isDisabled && styles.pillarLabelDisabled]}>
                {pillar.label}
              </Text>
              {isDisabled && (
                <Text style={styles.comingSoonBadge}>Coming Soon</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: 60,
  },
  brandingContainer: {
    marginBottom: theme.spacing.xxl,
    alignItems: 'center',
  },
  brandingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  brandLogo: {
    width: 48,
    height: 48,
  },
  brandTextContainer: {
    alignItems: 'flex-start',
  },
  brandName: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  poweredByText: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.regular,
    color: theme.colors.text.muted,
  },
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  pillarCard: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.subtle,
  },
  pillarLabel: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  pillarCardDisabled: {
    opacity: 0.6,
  },
  iconContainerDisabled: {
    backgroundColor: theme.colors.background.elevated,
  },
  pillarLabelDisabled: {
    color: theme.colors.text.disabled,
  },
  comingSoonBadge: {
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginTop: -4,
  },
});
