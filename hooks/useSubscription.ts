import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService, SubscriptionTier } from '@/services/subscription.service';

export interface SubscriptionStatus {
  tier: 'free_evaluation' | 'path9_full' | 'free' | 'plus' | 'complete';
  isTrialing: boolean;
  trialDaysRemaining?: number;
  tierLimits: Record<string, any>;
  loading: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    tier: 'free_evaluation',
    isTrialing: false,
    tierLimits: {},
    loading: true,
  });
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [aiUsage, setAiUsage] = useState<{
    used: number;
    limit: number;
    remaining: number;
    percentUsed: number;
  }>({ used: 0, limit: 15, remaining: 15, percentUsed: 0 });

  useEffect(() => {
    if (!user) {
      setStatus({
        tier: 'free_evaluation',
        isTrialing: false,
        tierLimits: {},
        loading: false,
      });
      setAiUsage({ used: 0, limit: 15, remaining: 15, percentUsed: 0 });
      return;
    }

    loadSubscriptionStatus();
    loadTiers();
    loadAIUsage();
  }, [user]);

  const loadSubscriptionStatus = async () => {
    if (!user) return;

    try {
      const subscriptionStatus = await subscriptionService.getSubscriptionStatus(
        user.id
      );
      setStatus({
        ...subscriptionStatus,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading subscription status:', error);
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  };

  const loadTiers = async () => {
    try {
      const allTiers = await subscriptionService.getAllTiers();
      setTiers(allTiers);
    } catch (error) {
      console.error('Error loading tiers:', error);
    }
  };

  const loadAIUsage = async () => {
    if (!user) return;

    try {
      const usage = await subscriptionService.getAIUsageStats(user.id);
      setAiUsage(usage);
    } catch (error) {
      console.error('Error loading AI usage:', error);
    }
  };

  const checkFeature = async (
    featureKey: string,
    requiresUsageCheck = true
  ): Promise<{ allowed: boolean; reason?: string }> => {
    if (!user) {
      return {
        allowed: false,
        reason: 'Please sign in to use this feature',
      };
    }

    return subscriptionService.canUseFeature(
      user.id,
      featureKey,
      requiresUsageCheck
    );
  };

  const incrementUsage = async (featureKey: string): Promise<boolean> => {
    if (!user) return false;
    const result = await subscriptionService.incrementUsage(user.id, featureKey);
    if (result && featureKey === 'ai_interactions_evaluation') {
      await loadAIUsage();
    }
    return result;
  };

  const startTrial = async (
    targetTier: 'plus' | 'complete'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Please sign in to start a trial' };
    }

    const result = await subscriptionService.upgradeToTrial(user.id, targetTier);

    if (result.success) {
      await loadSubscriptionStatus();
    }

    return result;
  };

  const hasFeature = (featureKey: string): boolean => {
    if (!status.tierLimits || Object.keys(status.tierLimits).length === 0) {
      return false;
    }

    const value = status.tierLimits[featureKey];

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return false;
  };

  const isFreeEvaluation = status.tier === 'free_evaluation' || status.tier === 'free';
  const isPath9Full = status.tier === 'path9_full';
  const isPlus = status.tier === 'plus';
  const isComplete = status.tier === 'complete';
  const isPaid = isPath9Full || isPlus || isComplete;

  return {
    status,
    tiers,
    aiUsage,
    checkFeature,
    incrementUsage,
    startTrial,
    hasFeature,
    loadAIUsage,
    isFreeEvaluation,
    isPath9Full,
    isPlus,
    isComplete,
    isPaid,
    loading: status.loading,
  };
}
