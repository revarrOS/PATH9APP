import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionTier } from '@/services/subscription.service';

export default function PricingScreen() {
  const router = useRouter();
  const { status, tiers, startTrial, loading } = useSubscription();
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>('monthly');
  const [startingTrial, setStartingTrial] = useState(false);

  if (loading || tiers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const handleStartTrial = async (tier: 'plus' | 'complete') => {
    setStartingTrial(true);

    const result = await startTrial(tier);

    setStartingTrial(false);

    if (result.success) {
      Alert.alert(
        'Trial Started!',
        `You now have full access to Path9 ${tier === 'plus' ? 'Plus' : 'Complete'} for 30 days. No credit card required.`,
        [
          {
            text: 'Get Started',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to start trial');
    }
  };

  const renderTierCard = (tier: SubscriptionTier) => {
    const isFree = tier.tier_id === 'free';
    const isCurrentTier = status.tier === tier.tier_id;
    const isRecommended = tier.tier_id === 'plus';

    const price =
      selectedCycle === 'monthly'
        ? tier.monthly_price
        : tier.annual_price / 12;

    const annualSavings =
      selectedCycle === 'annual' && !isFree
        ? tier.monthly_price * 12 - tier.annual_price
        : 0;

    return (
      <View
        key={tier.tier_id}
        style={[
          styles.tierCard,
          isRecommended && styles.tierCardRecommended,
          isCurrentTier && styles.tierCardCurrent,
        ]}
      >
        {isRecommended && (
          <View style={styles.recommendedBadge}>
            <Sparkles size={14} color="#FFFFFF" />
            <Text style={styles.recommendedText}>Most Popular</Text>
          </View>
        )}

        {isCurrentTier && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentText}>Current Plan</Text>
          </View>
        )}

        <Text style={styles.tierName}>{tier.display_name}</Text>
        <Text style={styles.tierDescription}>{tier.description}</Text>

        {!isFree && (
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>${price.toFixed(2)}</Text>
              <Text style={styles.priceLabel}>/month</Text>
            </View>
            {annualSavings > 0 && (
              <Text style={styles.savings}>
                Save ${annualSavings.toFixed(0)}/year
              </Text>
            )}
          </View>
        )}

        {isFree && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceFree}>Free</Text>
          </View>
        )}

        <View style={styles.featuresContainer}>
          {tier.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.checkIcon}>
                <Check size={16} color="#4CAF50" />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {!isCurrentTier && !isFree && (
          <TouchableOpacity
            style={[
              styles.ctaButton,
              isRecommended && styles.ctaButtonPrimary,
            ]}
            onPress={() =>
              handleStartTrial(tier.tier_id as 'plus' | 'complete')
            }
            disabled={startingTrial}
          >
            <Text
              style={[
                styles.ctaButtonText,
                isRecommended && styles.ctaButtonTextPrimary,
              ]}
            >
              {startingTrial ? 'Starting...' : 'Start 30-Day Free Trial'}
            </Text>
          </TouchableOpacity>
        )}

        {isCurrentTier && !isFree && status.isTrialing && (
          <View style={styles.trialInfo}>
            <Text style={styles.trialText}>
              {status.trialDaysRemaining} days left in trial
            </Text>
          </View>
        )}

        {isFree && !isCurrentTier && (
          <TouchableOpacity style={styles.ctaButtonDisabled} disabled>
            <Text style={styles.ctaButtonTextDisabled}>
              Included With Account
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Path</Text>
        <Text style={styles.subtitle}>
          Start with a 30-day free trial. No credit card required.
        </Text>
      </View>

      <View style={styles.cycleToggle}>
        <TouchableOpacity
          style={[
            styles.cycleButton,
            selectedCycle === 'monthly' && styles.cycleButtonActive,
          ]}
          onPress={() => setSelectedCycle('monthly')}
        >
          <Text
            style={[
              styles.cycleButtonText,
              selectedCycle === 'monthly' && styles.cycleButtonTextActive,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.cycleButton,
            selectedCycle === 'annual' && styles.cycleButtonActive,
          ]}
          onPress={() => setSelectedCycle('annual')}
        >
          <Text
            style={[
              styles.cycleButtonText,
              selectedCycle === 'annual' && styles.cycleButtonTextActive,
            ]}
          >
            Annual
          </Text>
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsBadgeText}>Save 25%</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.tiersContainer}>
        {tiers.map((tier) => renderTierCard(tier))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All plans include secure data storage, regular backups, and email
          support.
        </Text>
        <Text style={styles.footerText}>
          Cancel anytime. Your data stays accessible at the Free tier level.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  cycleToggle: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  cycleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    position: 'relative',
  },
  cycleButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  cycleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  cycleButtonTextActive: {
    color: '#1A1A1A',
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  savingsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tiersContainer: {
    paddingHorizontal: 20,
  },
  tierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  tierCardRecommended: {
    borderColor: '#2196F3',
  },
  tierCardCurrent: {
    borderColor: '#4CAF50',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  currentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tierName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  tierDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  priceContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  priceLabel: {
    fontSize: 18,
    color: '#666666',
    marginLeft: 4,
  },
  priceFree: {
    fontSize: 42,
    fontWeight: '700',
    color: '#4CAF50',
  },
  savings: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaButtonPrimary: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  ctaButtonTextPrimary: {
    color: '#FFFFFF',
  },
  ctaButtonDisabled: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaButtonTextDisabled: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999999',
  },
  trialInfo: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  trialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
