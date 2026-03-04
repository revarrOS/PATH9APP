import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Lock, Sparkles, X } from 'lucide-react-native';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  featureName: string;
  description: string;
  targetTier: 'plus' | 'complete';
  benefits: string[];
}

export function UpgradePrompt({
  visible,
  onClose,
  onUpgrade,
  featureName,
  description,
  targetTier,
  benefits,
}: UpgradePromptProps) {
  const tierName = targetTier === 'plus' ? 'Path9 Plus' : 'Path9 Complete';
  const price = targetTier === 'plus' ? '$19.99' : '$39.99';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Sparkles size={48} color="#2196F3" />
          </View>

          <Text style={styles.title}>Unlock {featureName}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.benefitsContainer}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tierInfo}>
            <Text style={styles.tierName}>{tierName}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{price}</Text>
              <Text style={styles.priceLabel}>/month</Text>
            </View>
            <Text style={styles.trialLabel}>Start with 30-day free trial</Text>
          </View>

          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>Start Free Trial</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  tierInfo: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  tierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2196F3',
  },
  priceLabel: {
    fontSize: 18,
    color: '#666666',
    marginLeft: 4,
  },
  trialLabel: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  upgradeButton: {
    width: '100%',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
  },
});
