import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, ArrowRight } from 'lucide-react-native';

interface UsageLimitBannerProps {
  current: number;
  limit: number;
  featureName: string;
  onUpgrade: () => void;
}

export function UsageLimitBanner({
  current,
  limit,
  featureName,
  onUpgrade,
}: UsageLimitBannerProps) {
  const remaining = Math.max(0, limit - current);
  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = remaining === 0;

  if (!isNearLimit && !isAtLimit) {
    return null;
  }

  const getMessage = () => {
    if (isAtLimit) {
      return `You've used all ${limit} ${featureName} this month`;
    }
    return `${remaining} ${featureName} remaining this month`;
  };

  return (
    <View style={[styles.container, isAtLimit && styles.containerDanger]}>
      <View style={styles.iconContainer}>
        <AlertCircle
          size={20}
          color={isAtLimit ? '#D32F2F' : '#FF9800'}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.message, isAtLimit && styles.messageDanger]}>
          {getMessage()}
        </Text>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(percentage, 100)}%` },
              isAtLimit && styles.progressFillDanger,
            ]}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
        <Text style={styles.upgradeButtonText}>Upgrade</Text>
        <ArrowRight size={16} color="#2196F3" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  containerDanger: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  message: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '600',
    marginBottom: 6,
  },
  messageDanger: {
    color: '#C62828',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#FFE0B2',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 2,
  },
  progressFillDanger: {
    backgroundColor: '#D32F2F',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  upgradeButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
});
