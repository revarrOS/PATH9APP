import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CircleAlert as AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';

interface AIUsageBannerProps {
  used: number;
  limit: number;
  onUpgradePress?: () => void;
}

export function AIUsageBanner({ used, limit, onUpgradePress }: AIUsageBannerProps) {
  const remaining = Math.max(0, limit - used);
  const percentUsed = (used / limit) * 100;

  if (remaining > 3) {
    return null;
  }

  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      router.push('/settings/pricing');
    }
  };

  if (remaining === 0) {
    return (
      <View style={[styles.banner, styles.bannerError]}>
        <AlertCircle size={20} color="#DC2626" />
        <View style={styles.textContainer}>
          <Text style={styles.titleError}>Free evaluation complete</Text>
          <Text style={styles.subtitleError}>
            You've used all {limit} AI interactions
          </Text>
        </View>
        <TouchableOpacity onPress={handleUpgrade} style={styles.upgradeButtonError}>
          <Text style={styles.upgradeButtonTextError}>Upgrade</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.banner, styles.bannerWarning]}>
      <AlertCircle size={20} color="#D97706" />
      <View style={styles.textContainer}>
        <Text style={styles.titleWarning}>
          {remaining} AI interaction{remaining !== 1 ? 's' : ''} remaining
        </Text>
        <Text style={styles.subtitleWarning}>
          Upgrade to Path9 Full for unlimited access
        </Text>
      </View>
      <TouchableOpacity onPress={handleUpgrade} style={styles.upgradeButtonWarning}>
        <Text style={styles.upgradeButtonTextWarning}>Upgrade</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  bannerWarning: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  bannerError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  textContainer: {
    flex: 1,
  },
  titleWarning: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 2,
  },
  titleError: {
    fontSize: 15,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 2,
  },
  subtitleWarning: {
    fontSize: 13,
    color: '#A16207',
  },
  subtitleError: {
    fontSize: 13,
    color: '#B91C1C',
  },
  upgradeButtonWarning: {
    backgroundColor: '#D97706',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonError: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonTextWarning: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeButtonTextError: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
