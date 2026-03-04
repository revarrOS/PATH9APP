# Subscription System Implementation Summary

## What Was Built

A complete 3-tier subscription system for Path9 with feature gating, usage tracking, and trial management.

---

## Database Schema

### Tables Created

**`subscription_tiers`**
- Master reference table defining all available tiers
- Stores pricing, limits, and feature lists
- Pre-seeded with Free, Plus, and Complete tiers

**`user_subscriptions`**
- Tracks which tier each user is on
- Manages trial periods and billing cycles
- Stores external payment provider IDs (RevenueCat)

**`usage_tracking`**
- Tracks monthly usage of quota-limited features
- Auto-resets on the 1st of each month
- Used for enforcing limits (e.g., 3 Gemma conversations/month on Free)

### Database Functions

**`check_entitlement(user_id, feature_key)`**
- Returns boolean: does user have access to this feature?
- Used for boolean features (e.g., `bloodwork_image_upload`)

**`check_usage_limit(user_id, feature_key)`**
- Returns boolean: is user within monthly quota?
- Used for usage-tracked features (e.g., `gemma_conversations`)

**`increment_usage(user_id, feature_key)`**
- Increments usage counter for a feature
- Call after successful feature use

---

## Pricing Tiers

### Free (Always Free)
- Timeline view
- Up to 10 appointments
- Up to 5 care team contacts
- 3 Gemma conversations/month
- Basic tracking (no AI)

### Path9 Plus - $19.99/month or $179/year
- Everything in Free
- Unlimited Gemma conversations
- Unlimited appointments & care team
- Bloodwork: Image upload + AI analysis + trends
- Condition: Letter upload + AI analysis + timeline
- AI Consultation Prep (bloodwork + condition)

### Path9 Complete - $39.99/month or $359/year
- Everything in Plus
- Full Nutrition OS
- Full Movement OS
- Full Meditation OS
- Full Mindfulness OS
- Priority support
- Early access

---

## Frontend Implementation

### Services

**`services/subscription.service.ts`**
- Core service for all subscription operations
- Methods:
  - `getUserSubscription()` - Get user's current subscription
  - `checkEntitlement()` - Check if user has feature access
  - `checkUsageLimit()` - Check if user is within quota
  - `incrementUsage()` - Track feature usage
  - `canUseFeature()` - Combined entitlement + usage check
  - `upgradeToTrial()` - Start a 30-day trial
  - `getSubscriptionStatus()` - Get full status with trial info

### Hooks

**`hooks/useSubscription.ts`**
- React hook for easy subscription access in components
- Provides:
  - `status` - Current tier, trial status, limits
  - `checkFeature()` - Check access before action
  - `incrementUsage()` - Track usage
  - `startTrial()` - Begin trial
  - `hasFeature()` - Simple boolean check
  - Helper booleans: `isFree`, `isPlus`, `isComplete`, `isPaid`

### Components

**`components/UpgradePrompt.tsx`**
- Beautiful modal for upgrade prompts
- Shows feature benefits, pricing, and trial CTA
- Customizable per feature

**`components/UsageLimitBanner.tsx`**
- Warning banner when approaching usage limits
- Progress bar visualization
- Quick upgrade CTA

**`app/(tabs)/settings/pricing.tsx`**
- Full pricing comparison screen
- Monthly/annual toggle
- Start trial functionality
- Shows current tier and trial countdown

---

## Usage Examples

### Basic Feature Gating

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function MyFeature() {
  const { checkFeature } = useSubscription();

  const handleAction = async () => {
    const { allowed, reason } = await checkFeature('feature_key');

    if (!allowed) {
      showUpgradePrompt(reason);
      return;
    }

    // Do the thing
  };
}
```

### Usage Tracking

```typescript
const { checkFeature, incrementUsage } = useSubscription();

const sendMessage = async () => {
  const { allowed } = await checkFeature('gemma_conversations', true);

  if (!allowed) return;

  await sendToGemma();
  await incrementUsage('gemma_conversations');
};
```

### Conditional Rendering

```typescript
const { hasFeature } = useSubscription();

if (!hasFeature('nutrition_enabled')) {
  return <UpgradeScreen />;
}

return <NutritionContent />;
```

---

## Integration Points

### Where to Add Feature Gates

1. **Bloodwork:**
   - Image upload → `bloodwork_image_upload`
   - AI analysis → `bloodwork_ai_analysis`
   - Trends view → `bloodwork_trends`

2. **Condition:**
   - Letter upload → `condition_image_upload`
   - AI analysis → `condition_ai_analysis`
   - Timeline view → `condition_timeline`

3. **Consultation Prep:**
   - Access → `consultation_prep_enabled`

4. **Nutrition:**
   - All features → `nutrition_enabled`
   - AI analysis → `nutrition_ai_analysis`
   - Patterns → `nutrition_pattern_detection`
   - Trends → `nutrition_trends`
   - Lens insights → `nutrition_lens_insights`

5. **Gemma:**
   - Conversations → `gemma_conversations` (usage tracked)

6. **Image Analysis:**
   - All images → `image_analyses` (usage tracked)

### Edge Functions

All AI edge functions should:
1. Check entitlement via `check_entitlement` RPC
2. Check usage limit via `check_usage_limit` RPC
3. Process the request
4. Increment usage via `increment_usage` RPC
5. Return result or 403/429 error

Example pattern in every edge function:

```typescript
// Check access
const { data: hasAccess } = await supabase.rpc('check_entitlement', {
  p_user_id: user.id,
  p_feature_key: 'some_feature',
});

if (!hasAccess) {
  return new Response(JSON.stringify({ error: 'Upgrade required' }), {
    status: 403,
  });
}

// Do the work
const result = await doAIStuff();

// Track usage
await supabase.rpc('increment_usage', {
  p_user_id: user.id,
  p_feature_key: 'some_feature',
});

return new Response(JSON.stringify(result));
```

---

## Next Steps

### Phase 1: Testing (Current)
- [ ] Test free tier limits
- [ ] Test trial start flow
- [ ] Test upgrade prompts in each feature
- [ ] Verify usage tracking accuracy
- [ ] Test edge function gating

### Phase 2: UI Polish
- [ ] Add upgrade prompts to all gated features
- [ ] Implement usage limit warnings
- [ ] Create subscription management screen
- [ ] Add trial countdown indicators
- [ ] Design paywall screens

### Phase 3: Payment Integration
- [ ] Set up RevenueCat account
- [ ] Configure iOS in-app purchases
- [ ] Configure Android subscriptions
- [ ] Create webhook handler for subscription events
- [ ] Test end-to-end purchase flow

### Phase 4: Analytics
- [ ] Track upgrade prompt views
- [ ] Track trial start conversions
- [ ] Track trial→paid conversions
- [ ] Track feature usage by tier
- [ ] Set up revenue dashboards

---

## Files Created

### Database
- `supabase/migrations/create_subscription_system.sql`

### Services
- `services/subscription.service.ts`

### Hooks
- `hooks/useSubscription.ts`

### Components
- `components/UpgradePrompt.tsx`
- `components/UsageLimitBanner.tsx`

### Screens
- `app/(tabs)/settings/pricing.tsx`

### Documentation
- `docs/SUBSCRIPTION_PRICING_STRATEGY.md` - Business strategy and pricing rationale
- `docs/SUBSCRIPTION_IMPLEMENTATION_GUIDE.md` - Developer guide for implementing gates
- `SUBSCRIPTION_SYSTEM_SUMMARY.md` - This file

---

## Key Design Decisions

### 1. Generous Free Tier
- Core medical tracking always free
- 3 Gemma conversations to demonstrate value
- No credit card required for trial

**Why:** Ethical obligation to support people during medical crisis, builds trust, provides value before asking for payment.

### 2. Clear Value Tiers
- Free = Organization
- Plus = Medical AI companion
- Complete = Holistic wellness

**Why:** Users self-select based on needs. Plus targets active treatment, Complete targets recovery/survivorship.

### 3. 30-Day Trial
- Long enough to experience multiple medical touchpoints
- No credit card required

**Why:** Removes barrier to entry during vulnerable time. Once users rely on Gemma/AI features, conversion is natural.

### 4. Usage Tracking, Not Paywalls
- Track usage server-side
- Graceful degradation (show prompt, don't break app)
- Clear communication of limits

**Why:** Better UX than hard blocks. Users understand value before being stopped.

### 5. Database-First Design
- All tier logic in database
- Easy to change limits without code deploy
- Centralized entitlement checking

**Why:** Flexibility to adjust pricing/limits without app updates. Single source of truth.

---

## Economics

### Target Margins
- Free: ~$0.50/month cost (sustainable loss leader)
- Plus: ~$10-12 margin (50-60%)
- Complete: ~$20-25 margin (50-62%)

### Scale Projections

**1,000 paying users (70% Plus, 30% Complete):**
- MRR: $25,990
- AI costs: ~$9,000
- **Margin: ~$17k/month**

**10,000 paying users:**
- MRR: $259,900
- AI costs: ~$90,000
- **Margin: ~$170k/month**

### Break-Even
- At ~500 paying users (~$13k MRR), covers operational costs
- Path to profitability clear at 2-3x that scale

---

## Success Metrics

### Conversion Rates (Targets)
- Free → Trial: 15%
- Trial → Paid: 40%
- Plus → Complete: 10%

### Retention (Targets)
- Month 1: 85%
- Month 3: 70%
- Month 6: 60%
- Month 12: 50%

### Engagement (Proxies for Value)
- Gemma conversations/week
- Image uploads/week
- Consultation prep usage
- Daily active usage

---

**System Status:** ✅ Complete - Ready for Testing
**Last Updated:** 2026-02-12
**Version:** 1.0
