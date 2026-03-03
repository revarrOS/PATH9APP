import { supabase } from '@/lib/supabase';

export interface SubscriptionTier {
  tier_id: 'free_evaluation' | 'path9_full' | 'free' | 'plus' | 'complete';
  display_name: string;
  description: string;
  monthly_price: number;
  annual_price: number;
  limits: Record<string, any>;
  features: string[];
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier_id: 'free_evaluation' | 'path9_full' | 'free' | 'plus' | 'complete';
  status: 'active' | 'cancelled' | 'expired' | 'trialing' | 'past_due';
  billing_cycle: 'free' | 'monthly' | 'annual';
  trial_ends_at?: string;
  current_period_start: string;
  current_period_end?: string;
  cancelled_at?: string;
  external_subscription_id?: string;
  external_customer_id?: string;
  metadata?: Record<string, any>;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  feature_key: string;
  usage_count: number;
  period_start: string;
  period_end: string;
}

class SubscriptionService {
  async getAllTiers(): Promise<SubscriptionTier[]> {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('monthly_price', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('tier_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getUserTierDetails(userId: string): Promise<{
    subscription: UserSubscription | null;
    tier: SubscriptionTier | null;
  }> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return { subscription: null, tier: null };
    }

    const { data: tier, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('tier_id', subscription.tier_id)
      .maybeSingle();

    if (error) throw error;

    return { subscription, tier };
  }

  async checkEntitlement(userId: string, featureKey: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_entitlement', {
      p_user_id: userId,
      p_feature_key: featureKey,
    });

    if (error) {
      console.error('Error checking entitlement:', error);
      return false;
    }

    return data === true;
  }

  async checkUsageLimit(userId: string, featureKey: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_usage_limit', {
      p_user_id: userId,
      p_feature_key: featureKey,
    });

    if (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }

    return data === true;
  }

  async incrementUsage(userId: string, featureKey: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_feature_key: featureKey,
    });

    if (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }

    return data === true;
  }

  async getUsageStats(userId: string): Promise<UsageTracking[]> {
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(1);
    currentPeriodStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('period_start', currentPeriodStart.toISOString());

    if (error) throw error;
    return data || [];
  }

  async canUseFeature(
    userId: string,
    featureKey: string,
    requiresUsageCheck = true
  ): Promise<{ allowed: boolean; reason?: string }> {
    const hasEntitlement = await this.checkEntitlement(userId, featureKey);

    if (!hasEntitlement) {
      return {
        allowed: false,
        reason: 'Feature not available in your current plan',
      };
    }

    if (requiresUsageCheck) {
      const withinLimit = await this.checkUsageLimit(userId, featureKey);

      if (!withinLimit) {
        return {
          allowed: false,
          reason: featureKey === 'ai_interactions_evaluation'
            ? 'Free evaluation complete. Upgrade to Path9 Full to continue.'
            : 'Usage limit reached. Upgrade to continue.',
        };
      }
    }

    return { allowed: true };
  }

  async upgradeToTrial(
    userId: string,
    targetTier: 'plus' | 'complete'
  ): Promise<{ success: boolean; error?: string }> {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const periodEnd = new Date(trialEndsAt);

    const { error } = await supabase.from('user_subscriptions').insert({
      user_id: userId,
      tier_id: targetTier,
      status: 'trialing',
      billing_cycle: 'free',
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async getAIUsageStats(userId: string): Promise<{
    used: number;
    limit: number;
    remaining: number;
    percentUsed: number;
  }> {
    const { data: usage, error: usageError } = await supabase
      .from('usage_tracking')
      .select('usage_count')
      .eq('user_id', userId)
      .eq('feature_key', 'ai_interactions_evaluation')
      .maybeSingle();

    if (usageError) {
      console.error('Error fetching AI usage:', usageError);
    }

    const used = usage?.usage_count || 0;
    const limit = 15;
    const remaining = Math.max(0, limit - used);
    const percentUsed = Math.min(100, (used / limit) * 100);

    return { used, limit, remaining, percentUsed };
  }

  async getSubscriptionStatus(userId: string): Promise<{
    tier: 'free_evaluation' | 'path9_full' | 'free' | 'plus' | 'complete';
    isTrialing: boolean;
    trialDaysRemaining?: number;
    tierLimits: Record<string, any>;
  }> {
    const { subscription, tier } = await this.getUserTierDetails(userId);

    if (!subscription || !tier) {
      return {
        tier: 'free_evaluation',
        isTrialing: false,
        tierLimits: {},
      };
    }

    let trialDaysRemaining: number | undefined;
    if (subscription.status === 'trialing' && subscription.trial_ends_at) {
      const now = new Date();
      const trialEnd = new Date(subscription.trial_ends_at);
      const diffTime = trialEnd.getTime() - now.getTime();
      trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      tier: subscription.tier_id,
      isTrialing: subscription.status === 'trialing',
      trialDaysRemaining,
      tierLimits: tier.limits,
    };
  }
}

export const subscriptionService = new SubscriptionService();
