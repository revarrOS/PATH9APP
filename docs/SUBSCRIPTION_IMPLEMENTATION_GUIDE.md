# Subscription Implementation Guide

This guide shows developers how to implement subscription-based feature gating throughout Path9.

---

## Quick Start

### 1. Check If User Has Access

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function MyFeatureScreen() {
  const { checkFeature } = useSubscription();

  const handleFeatureAction = async () => {
    const { allowed, reason } = await checkFeature('feature_key');

    if (!allowed) {
      // Show upgrade prompt
      setUpgradeModalVisible(true);
      setUpgradeReason(reason);
      return;
    }

    // Proceed with feature
    doFeatureAction();
  };
}
```

### 2. Track Usage

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function GemmaChat() {
  const { checkFeature, incrementUsage } = useSubscription();

  const sendMessage = async (message: string) => {
    // Check if user has access
    const { allowed, reason } = await checkFeature(
      'gemma_conversations',
      true // requires usage check
    );

    if (!allowed) {
      showUpgradePrompt(reason);
      return;
    }

    // Send message
    await sendMessageToGemma(message);

    // Increment usage counter
    await incrementUsage('gemma_conversations');
  };
}
```

### 3. Show Upgrade Prompts

```typescript
import { UpgradePrompt } from '@/components/UpgradePrompt';

function BloodworkAnalysis() {
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  return (
    <>
      <UpgradePrompt
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
        onUpgrade={handleStartTrial}
        featureName="AI Bloodwork Analysis"
        description="Upload images and get instant AI-powered analysis of your bloodwork results"
        targetTier="plus"
        benefits={[
          'Instant image-to-data extraction',
          'AI analysis of trends and patterns',
          'Unlimited bloodwork entries',
          'Never manually enter data again',
        ]}
      />
    </>
  );
}
```

---

## Feature Keys Reference

### Boolean Entitlements

Check with `checkFeature(key, false)` - no usage tracking needed:

```typescript
// Bloodwork
'bloodwork_image_upload'
'bloodwork_ai_analysis'
'bloodwork_trends'

// Condition
'condition_image_upload'
'condition_ai_analysis'
'condition_timeline'

// Consultation Prep
'consultation_prep_enabled'

// Nutrition
'nutrition_enabled'
'nutrition_ai_analysis'
'nutrition_pattern_detection'
'nutrition_trends'
'nutrition_lens_insights'

// Other Pillars
'movement_enabled'
'meditation_enabled'
'mindfulness_enabled'

// Support
'priority_support'
'early_access'
```

### Usage-Tracked Features

Check with `checkFeature(key, true)` - requires usage tracking:

```typescript
'gemma_conversations'      // Free: 3/month, Plus/Complete: unlimited
'image_analyses'           // Free: 0/month, Plus/Complete: unlimited
```

### Numeric Limits

Check with direct limit comparison:

```typescript
const { status } = useSubscription();
const appointmentsMax = status.tierLimits['appointments_max'];
const careTeamMax = status.tierLimits['care_team_max'];

// Compare current count against max
if (currentAppointments >= appointmentsMax) {
  showUpgradePrompt();
}
```

---

## Implementation Patterns

### Pattern 1: Gate Entire Screen

```typescript
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'expo-router';

export default function NutritionScreen() {
  const { hasFeature } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (!hasFeature('nutrition_enabled')) {
      router.replace('/(tabs)/nutrition/upgrade');
    }
  }, [hasFeature]);

  if (!hasFeature('nutrition_enabled')) {
    return null;
  }

  return <NutritionContent />;
}
```

### Pattern 2: Gate Specific Actions

```typescript
function BloodworkEntryScreen() {
  const { checkFeature } = useSubscription();
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  const handleImageUpload = async () => {
    const { allowed } = await checkFeature('bloodwork_image_upload', false);

    if (!allowed) {
      setUpgradeVisible(true);
      return;
    }

    // Proceed with image upload
    const image = await pickImage();
    await uploadBloodworkImage(image);
  };

  return (
    <>
      <TouchableOpacity onPress={handleImageUpload}>
        <Text>Upload Image</Text>
      </TouchableOpacity>

      <UpgradePrompt
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
        targetTier="plus"
        featureName="Image Upload"
        description="Never manually enter bloodwork data again"
        benefits={[...]}
      />
    </>
  );
}
```

### Pattern 3: Soft Paywall (Preview + Upgrade)

```typescript
function TrendsScreen() {
  const { hasFeature } = useSubscription();

  if (!hasFeature('bloodwork_trends')) {
    return (
      <View style={styles.preview}>
        <BlurView intensity={80} style={styles.blur}>
          <TrendsChartPreview />
        </BlurView>

        <View style={styles.overlay}>
          <Lock size={48} color="#2196F3" />
          <Text style={styles.title}>Unlock Trends Analysis</Text>
          <Text style={styles.description}>
            See patterns and insights over time
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleUpgrade}>
            <Text style={styles.buttonText}>Upgrade to Plus</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <TrendsChart />;
}
```

### Pattern 4: Usage Limit Warning

```typescript
import { UsageLimitBanner } from '@/components/UsageLimitBanner';

function GemmaScreen() {
  const { status } = useSubscription();
  const [currentUsage, setCurrentUsage] = useState(0);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    const stats = await subscriptionService.getUsageStats(user.id);
    const gemmaUsage = stats.find((s) => s.feature_key === 'gemma_conversations');
    setCurrentUsage(gemmaUsage?.usage_count || 0);
  };

  const limit = status.tierLimits['gemma_conversations_per_month'] || 3;

  return (
    <>
      <UsageLimitBanner
        current={currentUsage}
        limit={limit}
        featureName="Gemma conversations"
        onUpgrade={handleUpgrade}
      />

      <GemmaChat />
    </>
  );
}
```

---

## Edge Function Integration

### Check Entitlement in Edge Functions

```typescript
// supabase/functions/some-ai-feature/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );

  // Get authenticated user
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check entitlement
  const { data: hasAccess } = await supabaseClient.rpc('check_entitlement', {
    p_user_id: user.id,
    p_feature_key: 'bloodwork_ai_analysis',
  });

  if (!hasAccess) {
    return new Response(
      JSON.stringify({
        error: 'Feature not available in your current plan',
        upgrade_required: true,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Check usage limit
  const { data: withinLimit } = await supabaseClient.rpc('check_usage_limit', {
    p_user_id: user.id,
    p_feature_key: 'image_analyses',
  });

  if (!withinLimit) {
    return new Response(
      JSON.stringify({
        error: 'Monthly usage limit reached',
        upgrade_required: true,
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Proceed with AI processing
  const result = await processAIFeature();

  // Increment usage
  await supabaseClient.rpc('increment_usage', {
    p_user_id: user.id,
    p_feature_key: 'image_analyses',
  });

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## Upgrade Flow Implementation

### 1. Start Trial

```typescript
import { useSubscription } from '@/hooks/useSubscription';
import { Alert } from 'react-native';

function UpgradeModal() {
  const { startTrial } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleStartTrial = async (tier: 'plus' | 'complete') => {
    setLoading(true);

    const result = await startTrial(tier);

    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Trial Started!',
        'You now have full access for 30 days. No credit card required.',
        [{ text: 'Get Started', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to start trial');
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => handleStartTrial('plus')}
      disabled={loading}
    >
      <Text style={styles.buttonText}>
        {loading ? 'Starting Trial...' : 'Start Free 30-Day Trial'}
      </Text>
    </TouchableOpacity>
  );
}
```

### 2. RevenueCat Integration (Future)

```typescript
// When RevenueCat integration is added:
import Purchases from 'react-native-purchases';

const handlePurchase = async (productId: string) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(productId);

    // RevenueCat webhook will update our backend
    // Frontend refreshes subscription status
    await subscriptionService.getUserSubscription(user.id);

    Alert.alert('Success', 'Subscription activated!');
  } catch (error) {
    console.error('Purchase error:', error);
  }
};
```

---

## Testing Subscriptions

### Manual Testing

1. **Test Free Tier:**
   - Sign up new user
   - Verify user has free tier by default
   - Try to use gated features → should see upgrade prompt
   - Use Gemma 3 times → should hit limit

2. **Test Plus Trial:**
   - Click "Start Trial" on Plus feature
   - Verify trial status in subscription
   - Use unlimited features
   - Verify 30-day countdown

3. **Test Complete Tier:**
   - Upgrade to Complete trial
   - Verify all features unlocked
   - Check nutrition/movement/meditation access

### Database Testing

```sql
-- Check user's current subscription
SELECT * FROM user_subscriptions WHERE user_id = 'user-uuid-here';

-- Check subscription tier details
SELECT * FROM subscription_tiers;

-- Check usage tracking
SELECT * FROM usage_tracking WHERE user_id = 'user-uuid-here';

-- Manually set user to Plus tier
UPDATE user_subscriptions
SET tier_id = 'plus', status = 'active'
WHERE user_id = 'user-uuid-here';

-- Manually expire trial
UPDATE user_subscriptions
SET trial_ends_at = now() - interval '1 day'
WHERE user_id = 'user-uuid-here';
```

---

## UI/UX Best Practices

### Upgrade Messaging

❌ **Don't:**
- "This feature is locked"
- "Premium only"
- "Upgrade to continue"

✅ **Do:**
- "Unlock unlimited Gemma conversations"
- "Never manually enter bloodwork again"
- "Get AI-powered insights"

### Timing

**Show upgrade prompts:**
- After user tries to use feature (moment of intent)
- When hitting usage limit (moment of need)
- After successful feature use (moment of value)

**Don't show prompts:**
- On app launch (annoying)
- During critical flows (disruptive)
- Repeatedly without value demonstration

### Visual Design

- Use soft colors, not red/urgent
- Show clear value proposition
- Include specific benefits, not generic features
- Make "Start Trial" the primary CTA
- Allow easy dismissal

---

## Common Issues & Solutions

### Issue: User has access but feature still gated

**Solution:** Check that the feature key matches exactly:
```typescript
// Wrong
await checkFeature('bloodwork_image')

// Correct
await checkFeature('bloodwork_image_upload')
```

### Issue: Usage tracking not updating

**Solution:** Make sure to call `incrementUsage` after successful feature use:
```typescript
// Do feature action
await doSomething();

// THEN increment
await incrementUsage('feature_key');
```

### Issue: Subscription status not updating after upgrade

**Solution:** Force refresh subscription status:
```typescript
const { status } = useSubscription();

// Force reload
useEffect(() => {
  subscriptionService.getUserSubscription(user.id);
}, []);
```

---

## Checklist for Adding New Gated Feature

- [ ] Define feature key in subscription_tiers.limits
- [ ] Add feature key to documentation
- [ ] Implement frontend check with `checkFeature()`
- [ ] Implement usage tracking (if needed)
- [ ] Add edge function entitlement check
- [ ] Create upgrade prompt with clear benefits
- [ ] Test free tier (should block)
- [ ] Test Plus tier (if applicable)
- [ ] Test Complete tier (should allow)
- [ ] Add analytics tracking for upgrade prompts

---

**Last Updated:** 2026-02-12
**Version:** 1.0
