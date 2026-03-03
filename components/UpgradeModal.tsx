import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { router } from 'expo-router';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  usedCount?: number;
  limitCount?: number;
}

export function UpgradeModal({ visible, onClose, usedCount = 15, limitCount = 15 }: UpgradeModalProps) {
  const handleUpgrade = () => {
    onClose();
    router.push('/settings/pricing');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>You've explored the power of Path9 AI</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>
              You've used all {limitCount} AI interactions in your free evaluation.
            </Text>

            <Text style={styles.description}>
              Upgrade to Path9 Full for unlimited AI conversations, image analysis, and all premium features.
            </Text>

            <View style={styles.features}>
              <Text style={styles.feature}>✓ Unlimited AI conversations</Text>
              <Text style={styles.feature}>✓ Bloodwork AI analysis & trends</Text>
              <Text style={styles.feature}>✓ Condition letter analysis & timeline</Text>
              <Text style={styles.feature}>✓ Nutrition AI insights & patterns</Text>
              <Text style={styles.feature}>✓ AI Consultation Prep</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleUpgrade}>
              <Text style={styles.primaryButtonText}>Upgrade to Path9 Full</Text>
              <Text style={styles.priceText}>$19.99/month</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    paddingRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 24,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  features: {
    gap: 12,
  },
  feature: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
