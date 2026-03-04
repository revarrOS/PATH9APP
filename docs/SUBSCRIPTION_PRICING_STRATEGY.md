# Path9 Subscription & Pricing Strategy

## Pricing Philosophy

Path9's pricing reflects our mission: **Make medical tracking accessible, while sustaining comprehensive AI support through treatment and recovery.**

We believe:
- Core medical tracking should never be paywalled during crisis
- AI guidance is premium value worth paying for
- Holistic recovery support justifies a complete-tier offering
- Pricing should feel like support, not software

---

## Three-Tier Model

### Free (Always Free)
**"Your medical timeline, organized"**

**Target User:** Newly diagnosed, exploring options, budget-conscious

**What's Included:**
- Timeline view (read-only, no AI insights)
- Up to 10 appointments
- Up to 5 care team contacts
- 3 Gemma conversations/month (basic responses)
- ❌ No image upload/analysis
- ❌ No consultation prep
- ❌ No nutrition tracking

**Value Prop:** "Get organized and oriented without commitment"

**Usage Limits:**
- `gemma_conversations_per_month`: 3
- `appointments_max`: 10
- `care_team_max`: 5
- `image_analyses_per_month`: 0

---

### Path9 Plus: $19.99/month or $179/year
**"Your medical companion through treatment"**

**Target User:** Active treatment patients who need medical AI support

**What's Included:**
- ✅ Everything in Free
- ✅ Unlimited Gemma conversations
- ✅ Unlimited appointments & care team
- ✅ **Bloodwork:** Unlimited entries + image upload + AI analysis + trends
- ✅ **Condition:** Unlimited letters + image upload + AI analysis + timeline
- ✅ AI Consultation Prep (bloodwork + condition domains only)
- ❌ Nutrition OS locked
- ❌ Movement/Meditation/Mindfulness locked

**Value Prop:** "Less than one copay per month for unlimited medical AI support"

**Conversion Drivers:**
1. Image upload (massive time-saver for bloodwork/letters)
2. Unlimited Gemma (after 3 free conversations, they're hooked)
3. Consultation prep (game-changer before appointments)
4. Trends analysis (see progress over time)

**Annual Discount:** Save $60/year (25% off)

---

### Path9 Complete: $39.99/month or $359/year
**"Your complete healing journey companion"**

**Target User:** Long-term survivors, holistic wellness focus, post-treatment recovery

**What's Included:**
- ✅ Everything in Plus
- ✅ **Nutrition OS:** Unlimited entries, AI analysis, pattern detection, trends, lens insights
- ✅ **Movement OS:** Full tracking + AI guidance
- ✅ **Meditation OS:** Full library + personalized recommendations
- ✅ **Mindfulness OS:** Full journal + emotion tracking
- ✅ AI Consultation Prep (includes nutrition domain)
- ✅ Priority support
- ✅ Early access to new features

**Value Prop:** "Complete support for healing beyond treatment"

**Conversion Drivers:**
1. Nutrition insights (treatment side effects drive need)
2. Holistic recovery (beyond chemo into lifestyle)
3. Complete picture (medical + wellness unified)
4. Priority support (direct help when needed)

**Annual Discount:** Save $120/year (25% off)

---

## Trial Strategy

### 30-Day Free Trial
- Available for **Plus** and **Complete** tiers
- Full access to all features during trial
- **No credit card required** to start trial
- Clear reminder 7 days before trial ends
- Seamless conversion to paid at trial end

**Why 30 Days:**
- Captures 1-2 medical touchpoints (appointments, bloodwork)
- Enough time to experience value during overwhelming diagnosis period
- Long enough to build habit and dependency on Gemma
- Industry standard for health/wellness apps

---

## Feature Gating Implementation

### How It Works

All features check entitlements before allowing access:

```typescript
const { allowed, reason } = await subscriptionService.canUseFeature(
  userId,
  'bloodwork_image_upload'
);

if (!allowed) {
  // Show upgrade prompt with reason
  showUpgradeModal(reason);
  return;
}

// Feature allowed, proceed
```

### Usage Tracking

Monthly limits auto-reset on the 1st of each month:

- Gemma conversations
- Image analyses
- Consultation prep generations

```typescript
// Before allowing feature
const withinLimit = await subscriptionService.checkUsageLimit(
  userId,
  'gemma_conversations'
);

// After successful usage
await subscriptionService.incrementUsage(userId, 'gemma_conversations');
```

### Entitlement Keys

**Boolean entitlements** (enabled/disabled):
- `bloodwork_image_upload`
- `bloodwork_ai_analysis`
- `bloodwork_trends`
- `condition_image_upload`
- `condition_ai_analysis`
- `condition_timeline`
- `consultation_prep_enabled`
- `nutrition_enabled`
- `nutrition_ai_analysis`
- `nutrition_pattern_detection`
- `nutrition_trends`
- `nutrition_lens_insights`
- `movement_enabled`
- `meditation_enabled`
- `mindfulness_enabled`
- `priority_support`
- `early_access`

**Numeric limits** (with usage tracking):
- `gemma_conversations_per_month`
- `appointments_max`
- `care_team_max`
- `image_analyses_per_month`

---

## Economic Model

### Cost Analysis

**Free Tier:**
- ~$0.50/month in AI costs (3 Gemma conversations @ ~$0.15 each)
- Sustainable loss-leader to build user base

**Plus Tier:**
- Estimated AI costs: $8-12/month
  - Gemma conversations: ~20/month @ $0.15 = $3
  - Image analyses: ~10/month @ $0.50 = $5
  - Consultation prep: ~5/month @ $0.30 = $1.50
  - Trends computation: $0.50
  - Buffer: $2
- **Margin: $8-12/month** (40-60%)

**Complete Tier:**
- Estimated AI costs: $15-20/month
  - All Plus costs: $10
  - Nutrition analyses: ~15/month @ $0.30 = $4.50
  - Pattern detection: ~10/month @ $0.20 = $2
  - Additional compute: $3.50
- **Margin: $20-25/month** (50-62%)

### Sustainability

At scale:
- **1,000 paying users:**
  - 70% Plus ($13,993/mo) = ~$10k margin
  - 30% Complete ($11,997/mo) = ~$7k margin
  - **Total: $17k/month margin** after AI costs

- **10,000 paying users:**
  - 70% Plus ($139,930/mo) = ~$100k margin
  - 30% Complete ($119,970/mo) = ~$70k margin
  - **Total: $170k/month margin** after AI costs

---

## Conversion Funnels

### Free → Plus
**Triggers:**
1. Hit 3 Gemma conversation limit
2. Try to upload bloodwork image
3. Attempt to generate consultation prep
4. View trends (teaser shown, unlock prompt)

**Messaging:**
- "Unlock unlimited Gemma support for less than one copay"
- "Never manually enter bloodwork again"
- "Never walk into an appointment unprepared again"

### Plus → Complete
**Triggers:**
1. Try to access Nutrition tab
2. Try to access Movement/Meditation/Mindfulness
3. Experience side effects (AI suggests nutrition tracking)
4. Post-treatment milestone (AI suggests holistic recovery)

**Messaging:**
- "Your treatment is working. Now support your whole recovery."
- "Nutrition matters during treatment. Track it intelligently."
- "Healing is more than medical. Upgrade for complete support."

---

## Payment Integration

### RevenueCat Integration

Path9 uses **RevenueCat** for:
- Apple In-App Purchases (iOS)
- Google Play Billing (Android)
- Web payments (Stripe integration via RevenueCat)

**Why RevenueCat:**
- Handles cross-platform subscriptions
- Manages trial periods automatically
- Syncs entitlements across devices
- Provides analytics dashboard
- Simplifies tax/compliance

**Implementation:**
```typescript
// RevenueCat will sync subscription status to our backend
// Edge function `sync-subscription-status` receives webhooks
// Updates user_subscriptions table
// Frontend checks entitlements via subscriptionService
```

### External Subscription Sync

When RevenueCat confirms purchase:
1. Webhook hits `supabase/functions/sync-subscription-status`
2. Edge function updates `user_subscriptions` table
3. Sets `external_subscription_id` and `external_customer_id`
4. Updates `status` to 'active' or 'trialing'
5. Frontend immediately reflects new entitlements

---

## Upgrade Experience

### In-App Upgrade Flows

**Paywall Components:**
1. **Soft Paywall:** Show preview of feature, explain value, CTA to upgrade
2. **Hard Paywall:** Block feature entirely, show upgrade modal
3. **Usage Limit:** Show progress bar as limit approaches, upgrade CTA

**Upgrade Modal:**
- Clear tier comparison table
- Highlight relevant feature for context
- Show annual savings
- One-tap trial start (no CC required)
- One-tap purchase for immediate access

### Messaging Principles

❌ Don't say: "This feature is locked"
✅ Say: "Unlock unlimited Gemma support"

❌ Don't say: "Upgrade to Pro"
✅ Say: "Get Path9 Plus to never walk into an appointment unprepared"

❌ Don't say: "Premium feature"
✅ Say: "Start your free 30-day trial"

---

## Ethical Considerations

### What We Don't Do

❌ **No dark patterns** - Clear, honest upgrade prompts
❌ **No predatory pricing** - Fair value for real support
❌ **No data ransoming** - Core medical data always accessible
❌ **No fear-based upsells** - Supportive, not manipulative
❌ **No hidden fees** - Transparent, simple pricing

### What We Do

✅ **Generous free tier** - Core utility always available
✅ **Long trial period** - 30 days to evaluate during crisis
✅ **No CC for trial** - Trust before commitment
✅ **Data export** - Users own their data, always
✅ **Downgrade anytime** - Keep data, lose AI features
✅ **Compassionate messaging** - Supportive, never pushy

---

## Success Metrics

### Key Metrics to Track

**Conversion Rates:**
- Free → Trial: Target 15%
- Trial → Plus: Target 40%
- Plus → Complete: Target 10%

**Retention:**
- Month 1: Target 85%
- Month 3: Target 70%
- Month 6: Target 60%
- Month 12: Target 50%

**Engagement:**
- Gemma conversations/week (proxy for value)
- Image uploads/week (feature stickiness)
- Consultation prep usage (high-value feature)

**Revenue:**
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost)
- LTV:CAC ratio (target 3:1)

---

## Future Considerations

### Potential Add-Ons

- **Support Network Access:** $4.99/month for supporter accounts
- **Extended History:** $2.99/month for 5+ years of data
- **Priority Lab Results:** $9.99/month for expedited image processing
- **Expert Consultations:** $49/session for human review

### Enterprise/Provider Tier

**Path9 for Providers:** $X/patient/month
- Provider dashboard
- Multi-patient management
- Custom insights
- API access
- White-label options

---

## Implementation Checklist

- [x] Database schema (subscription_tiers, user_subscriptions, usage_tracking)
- [x] RPC functions (check_entitlement, check_usage_limit, increment_usage)
- [x] Client service (subscriptionService)
- [ ] RevenueCat integration
- [ ] Upgrade modals (soft/hard paywalls)
- [ ] Usage tracking in UI
- [ ] Trial countdown components
- [ ] Subscription management screen
- [ ] Payment webhook handler
- [ ] Analytics tracking
- [ ] Marketing pages (pricing, features)
- [ ] Onboarding flow with trial offer

---

**Last Updated:** 2026-02-12
**Version:** 1.0
**Owner:** Path9 Product Team
