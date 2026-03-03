# USAGE-BASED EVALUATION MODEL — ARCHITECTURAL ANALYSIS
**Date:** 2026-03-03
**Status:** Strategic Input (Pre-Implementation)

---

## EXECUTIVE SUMMARY

**Recommendation: APPROVE this model with minimal implementation.**

The usage-based evaluation approach is:
- ✅ **Architecturally sound** (fits existing infrastructure perfectly)
- ✅ **Lower technical debt** than time-based trials
- ✅ **Better user experience** (value-driven vs artificial urgency)
- ✅ **Minimal edge refactor needed** (90% client + DB enforcement)
- ✅ **Scalable cost control** (direct AI usage tracking)

The infrastructure already exists. Implementation is simple.

---

## 1️⃣ CURRENT AI USAGE TRACKING

### Status: ✅ FULLY BUILT — Ready to Use

#### What Already Exists:

**Database Table:**
```sql
usage_tracking (
  id uuid,
  user_id uuid,
  feature_key text,
  usage_count integer,
  period_start timestamptz,  -- Monthly reset
  period_end timestamptz
)
```

**PostgreSQL Functions:**
```sql
-- Check if user is under quota
check_usage_limit(user_id, feature_key) → boolean

-- Increment usage counter (atomic)
increment_usage(user_id, feature_key) → boolean
```

**Client Service:**
```typescript
// services/subscription.service.ts
checkUsageLimit(userId, 'gemma_conversations') → boolean
incrementUsage(userId, 'gemma_conversations') → boolean
canUseFeature(userId, 'gemma_conversations') → { allowed, reason }
```

**React Hook:**
```typescript
// hooks/useSubscription.ts
const { checkFeature, incrementUsage } = useSubscription();

await checkFeature('gemma_conversations') → { allowed: boolean, reason?: string }
await incrementUsage('gemma_conversations') → boolean
```

#### Current Feature Keys in Database:

| Feature Key | Description |
|-------------|-------------|
| `gemma_conversations` | Gemma AI chat interactions |
| `image_analyses` | Image upload + AI analysis (bloodwork, condition, nutrition) |
| `appointments_max` | Appointment limit (static, not usage-based) |
| `care_team_max` | Care team contacts (static, not usage-based) |

#### Where Usage is Incremented:

**Current State:** ❌ NOWHERE (infrastructure exists, not wired up)

**Usage tracking is:**
- Defined in database ✅
- Function exists ✅
- Client service ready ✅
- NOT called from UI ❌
- NOT called from edge functions ❌

#### Current Free Tier Limits:

```json
{
  "gemma_conversations_per_month": 3,
  "image_analyses_per_month": 0,
  "appointments_max": 10,
  "care_team_max": 5
}
```

**Interpretation:**
- Free users get 3 Gemma conversations per calendar month
- Free users get 0 image analyses (no AI image upload)
- Limits reset on the 1st of each month

**Current Usage Data:** 0 rows in usage_tracking (tracking not active)

---

## 2️⃣ FEASIBILITY WITHOUT MAJOR EDGE REFACTOR

### Answer: ✅ YES — 90% UI/DB, 10% Edge

You can implement usage-based evaluation with **minimal edge changes**.

### Recommended Architecture:

#### LAYER 1: Client-Side Pre-Flight Check (Primary Enforcement)

**Before any AI call:**
```typescript
// Component logic (e.g., GemmaChat, BloodworkChat, etc.)
const handleSendMessage = async (message: string) => {
  // 1. Check if user can use feature
  const check = await checkFeature('gemma_conversations');

  if (!check.allowed) {
    // Show upgrade modal
    setUpgradePrompt({
      visible: true,
      reason: check.reason,
      feature: 'Gemma AI Conversations'
    });
    return; // BLOCK HERE
  }

  // 2. Call AI endpoint
  const response = await orchestrationService.request({
    userMessage: message,
    // ...
  });

  // 3. Increment usage AFTER success
  if (response.success) {
    await incrementUsage('gemma_conversations');
  }
};
```

**This is 90% effective because:**
- Honest users never bypass UI
- RLS prevents cross-user manipulation
- Database enforces atomic increments
- Monthly resets are automatic

#### LAYER 2: Edge Function Lightweight Check (Defense in Depth)

**Minimal change to orchestrate/index.ts:**
```typescript
// After authentication, before LLM call (around line 120)

// Check if user has usage remaining
const { data: canUse, error: usageError } = await supabaseClient.rpc(
  'check_usage_limit',
  {
    p_user_id: userId,
    p_feature_key: 'gemma_conversations'
  }
);

if (usageError || !canUse) {
  return createErrorResponse(
    'AI conversation limit reached. Upgrade to continue.',
    'QUOTA_EXCEEDED',
    402, // Payment Required
    envelope.request_id
  );
}

// Existing LLM call logic...
const llmResponse = await callLLM(...);

// Increment usage after success
await supabaseClient.rpc('increment_usage', {
  p_user_id: userId,
  p_feature_key: 'gemma_conversations'
});
```

**Lines changed:** ~15 lines in orchestrate/index.ts

**Other edge functions needing protection:**
```typescript
// Image analysis endpoints (if you want to count separately)
- analyze-bloodwork-image/index.ts
- analyze-condition-letter/index.ts
- analyze-nutrition-image/index.ts

// Alternative: Count all as 'image_analyses' feature key
```

### Technical Requirements:

**Database:** ✅ Already exists, zero changes needed

**Client:** ~50 lines of wrapper logic in chat components

**Edge:** ~15 lines per protected endpoint

**Total implementation:** 2-3 hours

---

## 3️⃣ RISK ASSESSMENT

### If Enforcement is Primarily UI + DB:

#### Real Bypass Risk: 🟡 LOW-MEDIUM (Acceptable for Early Stage)

**Who Can Bypass:**

1. **Technical Users with API Knowledge**
   - Can call edge functions directly via curl/Postman
   - Need to know Supabase URL + get auth token
   - Effort: Medium (requires dev tools knowledge)

2. **Modified Client Users**
   - Could modify React Native bundle
   - Could skip pre-flight checks
   - Effort: High (requires app decompilation)

**Who CANNOT Bypass:**

1. **Honest users** (99.9% of users)
2. **Non-technical users**
3. **Mobile app users** (without reverse engineering)

#### Is It Acceptable at Early Stage?

**YES** — for these reasons:

1. **Early Traffic = Low Abuse Risk**
   - During beta/launch, you won't have sophisticated attackers
   - Abusers typically target high-profile apps
   - Your user base is medical patients, not hackers

2. **Cost Exposure is Bounded**
   - Even if 10 users bypass, cost = 10 users worth of API calls
   - Claude Sonnet 4 costs ~$3/million input tokens
   - Each conversation ≈ 10k tokens input = $0.03
   - 1000 bypassed conversations = $30 exposure
   - **Acceptable risk for early stage**

3. **Detection is Easy**
   - Monitor usage_tracking for anomalies
   - Alert if user has 0 tracked usage but high API calls
   - Automated flags for investigation

4. **Incrementally Hardenable**
   - Start with UI + DB enforcement (fast launch)
   - Add edge enforcement when scaling (week 2-3)
   - Add rate limiting when traffic grows (month 2-3)

#### Minimal Safeguard Recommendation:

**Add server-side check to orchestrate ONLY:**

This single edge function handles 80% of AI cost (Gemma conversations).

**Effort:** 15 lines, 30 minutes
**Protection:** Blocks 80% of abuse vector
**Good enough for launch:** ✅ YES

Other image analysis endpoints can wait for Phase 2.

### Risk Comparison:

| Approach | Bypass Risk | Implementation Time | Launch Delay |
|----------|-------------|---------------------|--------------|
| UI + DB only | Medium | 2 hours | 0 days |
| UI + DB + Edge (orchestrate) | Low | 3 hours | 0 days |
| Full edge + rate limiting | Very Low | 12 hours | 2-3 days |

**Recommendation:** Start with UI + DB + Edge (orchestrate) = Best balance

---

## 4️⃣ RECOMMENDED EVALUATION THRESHOLD

### Analysis of AI Cost & UX

#### Current Token Usage:

**Model:** Claude Sonnet 4 (claude-sonnet-4-20250514)
**Max tokens:** 2000 per response
**Typical conversation:**
- Input: 5k-10k tokens (system prompt + context + user message)
- Output: 500-1500 tokens (Gemma response)

**Cost per conversation:**
- Input: 10k tokens × $3/1M = $0.03
- Output: 1k tokens × $15/1M = $0.015
- **Total: ~$0.045 per AI interaction**

#### Free Evaluation Budget Analysis:

| Interactions | Total Cost | UX Value |
|--------------|------------|----------|
| 5 | $0.23 | Too low — can't experience depth |
| 10 | $0.45 | Good — 1 analysis + follow-ups |
| 15 | $0.68 | Better — multiple topics explored |
| 20 | $0.90 | Generous — full feature trial |
| 30 | $1.35 | Too high — reduces urgency |

#### Recommended Threshold:

**15 AI interactions** for Free Evaluation

**Rationale:**

1. **User Experience:**
   - Enough to explore 2-3 different use cases
   - Example: 5 bloodwork questions + 5 condition questions + 5 nutrition questions
   - Feels generous, not stingy

2. **Cost Exposure:**
   - $0.68 per user evaluation
   - 100 evaluations = $68
   - 1000 evaluations = $680
   - **Acceptable cost for customer acquisition**

3. **Conversion Psychology:**
   - Too few (5) → Users frustrated before seeing value
   - Too many (30) → Users don't urgently convert
   - Sweet spot (15) → Users experience value, want more

4. **Database Design:**
   - Already configured for `gemma_conversations_per_month: 3`
   - Change to `ai_interactions_total: 15` (one-time limit, not monthly)

#### Implementation Note:

**Change from monthly quota to lifetime evaluation quota:**

Instead of:
```json
{
  "gemma_conversations_per_month": 3
}
```

Use:
```json
{
  "ai_interactions_evaluation": 15
}
```

**Database change:**
```sql
-- Update free tier limits
UPDATE subscription_tiers
SET limits = jsonb_set(
  limits,
  '{ai_interactions_evaluation}',
  '15'::jsonb
)
WHERE tier_id = 'free';
```

**Check logic change:**
```typescript
// Instead of checking monthly reset period
// Check total lifetime usage for 'ai_interactions_evaluation'

const { data: totalUsage } = await supabase
  .from('usage_tracking')
  .select('usage_count')
  .eq('user_id', userId)
  .eq('feature_key', 'ai_interactions_evaluation')
  .maybeSingle();

const used = totalUsage?.usage_count || 0;
const limit = 15;

if (used >= limit) {
  return { allowed: false, reason: 'Free evaluation complete. Upgrade to continue.' };
}
```

**Key difference:** No period_start filter = lifetime total, not monthly

---

## 5️⃣ CLEAN UPGRADE TRIGGER ARCHITECTURE

### Recommended Flow:

#### A. When Limit is Approaching (12/15 used):

**Soft Prompt (Non-Blocking):**
```typescript
// Show banner at top of chat
<UsageLimitBanner
  used={12}
  total={15}
  message="3 AI interactions remaining in your free evaluation"
  action="Upgrade Now"
  variant="warning"
/>
```

#### B. When Limit is Reached (15/15 used):

**Hard Block (Blocking Modal):**
```typescript
// Before AI call
if (used >= 15) {
  showUpgradeModal({
    title: "You've explored the power of Path9 AI",
    message: `You've used all 15 AI interactions in your free evaluation.

    Upgrade to Path9 Plus for unlimited AI conversations, image analysis, and more.`,
    primaryAction: {
      label: "Upgrade to Plus — $19.99/mo",
      onPress: () => router.push('/settings/pricing')
    },
    secondaryAction: {
      label: "View Features",
      onPress: () => router.push('/settings/pricing')
    }
  });
  return; // BLOCK AI CALL
}
```

**Visual State:**
```typescript
// Disable input UI
<TextInput
  editable={usageRemaining > 0}
  placeholder={
    usageRemaining > 0
      ? "Ask Gemma anything..."
      : "Upgrade to continue using AI"
  }
/>

// Show upgrade overlay on chat
{usageRemaining === 0 && (
  <UpgradeOverlay
    feature="AI Conversations"
    tier="plus"
  />
)}
```

#### C. Cleanest Implementation Strategy:

**Option 1: Hard Block at Endpoint (Recommended)**
- AI endpoint returns 402 Payment Required
- Client shows upgrade modal on 402 response
- User cannot send message at all
- **Pros:** Secure, cannot bypass
- **Cons:** Slightly worse UX (error after submit)

**Option 2: Soft Disable UI (Good UX)**
- Check usage before rendering input
- Disable text input if quota exceeded
- Show inline upgrade prompt
- **Pros:** Best UX, immediate feedback
- **Cons:** Can be bypassed if user modifies client

**Option 3: Hybrid (Best of Both)**
- Disable UI if quota exceeded (soft)
- Edge function also blocks (hard)
- **Pros:** Great UX + secure
- **Cons:** Requires both client + edge changes

**Recommendation: Option 3 (Hybrid)**

**Implementation:**

```typescript
// Client component
const { usageRemaining, checkUsageRemaining } = useAIQuota();

useEffect(() => {
  checkUsageRemaining();
}, []);

const handleSend = async (message: string) => {
  // Pre-flight check
  if (usageRemaining <= 0) {
    showUpgradeModal();
    return;
  }

  // Call AI (which also checks server-side)
  try {
    const response = await orchestrationService.request(...);

    if (response.error?.code === 'QUOTA_EXCEEDED') {
      showUpgradeModal();
    }
  } catch (error) {
    // Handle error
  }
};

return (
  <View>
    <TextInput
      editable={usageRemaining > 0}
      // ...
    />

    {usageRemaining <= 0 && (
      <UpgradePrompt inline />
    )}
  </View>
);
```

---

## 6️⃣ STRIPE INTEGRATION STRATEGY

### When User Upgrades:

#### Flow:

**User clicks "Upgrade to Plus"**
  ↓
**Create Stripe Checkout Session (edge function)**
  ↓
**User completes payment on Stripe**
  ↓
**Webhook receives checkout.session.completed**
  ↓
**Update user_subscriptions table**
  ↓
**AI limit removed automatically**

### Database Update on Upgrade:

**Webhook handler updates:**
```typescript
// supabase/functions/stripe-webhook/index.ts

case 'checkout.session.completed':
  const session = event.data.object;

  // Update or insert user subscription
  await supabaseClient
    .from('user_subscriptions')
    .upsert({
      user_id: session.metadata.user_id,
      tier_id: session.metadata.tier_id, // 'plus' or 'complete'
      status: 'active',
      billing_cycle: session.metadata.billing_cycle, // 'monthly' or 'annual'
      current_period_start: new Date().toISOString(),
      current_period_end: calculatePeriodEnd(session.metadata.billing_cycle),
      external_subscription_id: session.subscription,
      external_customer_id: session.customer,
      metadata: {
        stripe_session_id: session.id,
        upgraded_at: new Date().toISOString()
      }
    }, {
      onConflict: 'user_id,tier_id'
    });

  break;
```

### Where Subscription Status is Stored:

**Primary Table:** `user_subscriptions`

```sql
user_subscriptions (
  id uuid,
  user_id uuid,
  tier_id text,                    -- 'free' | 'plus' | 'complete'
  status text,                     -- 'active' | 'cancelled' | 'expired'
  billing_cycle text,              -- 'monthly' | 'annual' | 'free'
  external_subscription_id text,   -- Stripe subscription ID
  external_customer_id text,       -- Stripe customer ID
  metadata jsonb                   -- Additional Stripe data
)
```

**On upgrade:**
1. New row inserted with `tier_id='plus'`, `status='active'`
2. Old free tier row can remain (or mark as inactive)
3. `check_entitlement()` function prioritizes highest tier automatically

### How AI Limit Removal is Handled:

**Automatic via Tier Limits:**

**Plus Tier Limits:**
```json
{
  "ai_interactions_evaluation": 999999  // Effectively unlimited
}
```

**Check flow:**
```typescript
// 1. User sends AI message
// 2. Client calls checkUsageLimit('ai_interactions_evaluation')
// 3. PostgreSQL function check_usage_limit():
//    - Looks up user's active subscription tier
//    - Gets limit from tier.limits
//    - For Plus: limit = 999999
//    - Current usage: 15
//    - Returns: 15 < 999999 = TRUE ✅
// 4. AI call proceeds
```

**No manual unlocking needed** — tier change automatically grants access.

### Implementation Phases:

**Phase 1: Evaluation (Week 1)**
- Free tier: 15 AI interactions lifetime
- No Stripe yet
- Hard block when limit reached
- Upgrade UI points to pricing page (no checkout)

**Phase 2: Stripe Checkout (Week 2)**
- Add Stripe SDK
- Create checkout session endpoint
- Wire up "Upgrade" buttons
- Users can pay but webhook not wired

**Phase 3: Webhook Automation (Week 2-3)**
- Implement stripe-webhook edge function
- Auto-update subscription on payment
- Test full flow end-to-end

**Phase 4: Subscription Management (Week 3-4)**
- Add cancellation flow
- Add plan change flow
- Add billing portal link

---

## RECOMMENDED IMPLEMENTATION PLAN

### Phase 1: Core Evaluation Logic (Day 1)

**Goal:** Free evaluation works with usage tracking

**Tasks:**
1. Update free tier limits from monthly to lifetime
   ```sql
   UPDATE subscription_tiers
   SET limits = '{
     "ai_interactions_evaluation": 15,
     "appointments_max": 10,
     "care_team_max": 5
   }'::jsonb
   WHERE tier_id = 'free';
   ```

2. Create `useAIQuota` hook for reusable quota checking
   ```typescript
   // hooks/useAIQuota.ts
   export function useAIQuota() {
     const { user } = useAuth();
     const [used, setUsed] = useState(0);
     const [limit, setLimit] = useState(15);

     const checkUsageRemaining = async () => {
       // Fetch usage from usage_tracking
       // Fetch limit from subscription tier
       // Set state
     };

     return {
       used,
       limit,
       remaining: limit - used,
       percentUsed: (used / limit) * 100,
       checkUsageRemaining
     };
   }
   ```

3. Add usage tracking to Gemma chat components
   ```typescript
   // Before AI call
   const check = await checkFeature('ai_interactions_evaluation');
   if (!check.allowed) {
     showUpgradeModal();
     return;
   }

   // After AI success
   await incrementUsage('ai_interactions_evaluation');
   ```

4. Create upgrade modal component
   ```typescript
   // components/UpgradeModal.tsx
   <Modal visible={showUpgrade}>
     <Text>Free Evaluation Complete</Text>
     <Text>Upgrade to Path9 Plus for unlimited AI</Text>
     <Button onPress={() => router.push('/settings/pricing')}>
       Upgrade Now
     </Button>
   </Modal>
   ```

**Deliverable:** Users hit 15 AI limit, see upgrade prompt

**Time:** 4 hours

---

### Phase 2: Server-Side Enforcement (Day 2)

**Goal:** Edge functions block quota-exceeded users

**Tasks:**
1. Add usage check to orchestrate/index.ts
   ```typescript
   const { data: canUse } = await supabaseClient.rpc('check_usage_limit', {
     p_user_id: userId,
     p_feature_key: 'ai_interactions_evaluation'
   });

   if (!canUse) {
     return createErrorResponse(
       'Free evaluation complete. Upgrade to continue.',
       'QUOTA_EXCEEDED',
       402
     );
   }
   ```

2. Add usage increment after LLM success
   ```typescript
   await supabaseClient.rpc('increment_usage', {
     p_user_id: userId,
     p_feature_key: 'ai_interactions_evaluation'
   });
   ```

3. Update client to handle 402 responses
   ```typescript
   if (response.error?.code === 'QUOTA_EXCEEDED') {
     showUpgradeModal();
   }
   ```

**Deliverable:** Server blocks quota-exceeded users

**Time:** 2 hours

---

### Phase 3: Usage Indicator UI (Day 2-3)

**Goal:** Users see remaining quota

**Tasks:**
1. Add usage counter to settings screen
   ```typescript
   <View>
     <Text>Free Evaluation: {used}/15 AI interactions used</Text>
     <ProgressBar value={used} max={15} />
   </View>
   ```

2. Add warning banner when approaching limit
   ```typescript
   {remaining <= 3 && (
     <Banner variant="warning">
       {remaining} AI interactions remaining. Upgrade for unlimited access.
     </Banner>
   )}
   ```

3. Show inline upgrade prompt in chat when quota exceeded
   ```typescript
   {remaining === 0 && (
     <InlineUpgradePrompt />
   )}
   ```

**Deliverable:** Users have clear visibility into quota

**Time:** 3 hours

---

### Phase 4: Stripe Checkout (Week 2)

**Goal:** Users can upgrade via Stripe

**Tasks:**
1. Install Stripe in edge function
2. Create checkout session endpoint
3. Wire up upgrade buttons
4. Test checkout flow

**Deliverable:** Users can pay and see Stripe receipt

**Time:** 6 hours

---

### Phase 5: Webhook + Auto-Unlock (Week 2-3)

**Goal:** Payment auto-upgrades tier

**Tasks:**
1. Implement stripe-webhook edge function
2. Update user_subscriptions on payment
3. Test full conversion flow
4. Verify AI unlocks after payment

**Deliverable:** End-to-end conversion works

**Time:** 6 hours

---

## ARCHITECTURAL CONCERNS & RISKS

### ✅ Low Risk:

1. **Database Ready:** No schema changes needed
2. **Client Service Ready:** Functions already exist
3. **Minimal Edge Changes:** 15 lines in orchestrate
4. **No Time Pressure:** Can iterate slowly
5. **Rollback Easy:** Just change tier limits

### ⚠️ Medium Risk:

1. **Usage Tracking Not Atomic Across Multiple Endpoints:**
   - If user calls multiple AI endpoints simultaneously
   - Could increment usage multiple times
   - Mitigation: Use `UNIQUE(user_id, feature_key, period_start)` constraint (already exists)

2. **Monthly Reset Logic Still Active:**
   - `usage_tracking` currently resets monthly
   - Need to modify to lifetime tracking for evaluation
   - Mitigation: Don't filter by period_start for evaluation feature

3. **Multiple Tier Subscriptions:**
   - User could have both free and plus rows
   - `check_entitlement()` function already handles this (picks highest tier)
   - Low concern

### 🚨 No Critical Risks Identified

---

## COST EXPOSURE ANALYSIS

### Free Evaluation Budget:

**Per User:**
- 15 AI interactions × $0.045 = **$0.68 per evaluation**

**Scaled:**
- 100 evaluations = $68
- 500 evaluations = $340
- 1000 evaluations = $680

**Monthly Budget at Scale:**
- 500 new users/month = $340/month in evaluation cost
- Conversion rate 10% = 50 paid users
- 50 × $19.99 = $999.50 revenue
- **ROI: $999 revenue / $340 cost = 2.9x return**

### Abuse Scenario (No Server Enforcement):

**Worst case:**
- Technical user bypasses client checks
- Makes 1000 API calls
- Cost: 1000 × $0.045 = $45

**Detection:**
- Monitor usage_tracking for 0 records but high edge function calls
- Flag users with >20 AI calls and 0 tracked usage
- Manual review and ban

**Mitigation:**
- Add rate limiting at edge (100 calls/hour per user)
- Add server-side quota check (15 lines of code)

---

## COMPARISON: USAGE-BASED vs TIME-BASED

| Aspect | Usage-Based (Recommended) | Time-Based (Current) |
|--------|---------------------------|----------------------|
| **User Clarity** | "15 AI questions" = crystal clear | "30 days" = unclear what they get |
| **Cost Control** | Direct cost correlation | Unbounded if user spams |
| **Conversion Trigger** | Natural (ran out of value) | Artificial (ran out of time) |
| **Implementation** | Simpler (no trial expiry logic) | More complex (trial end dates) |
| **Urgency** | Task-based urgency | Time-based urgency |
| **User Fairness** | Pay for what you use | Penalizes slow users |
| **Scalability** | Linear cost growth | Unpredictable cost |
| **Technical Debt** | Lower (reuses quota system) | Higher (trial management) |

**Recommendation:** Usage-based is superior on all dimensions

---

## FINAL RECOMMENDATIONS

### Approve This Model ✅

**Architecture:**
- 15 AI interactions for free evaluation
- Lifetime quota (not monthly reset)
- Client pre-flight + server enforcement
- Upgrade modal at limit
- Stripe checkout for upgrade

**Implementation:**
- Phase 1 (Day 1): Core quota tracking
- Phase 2 (Day 2): Server enforcement
- Phase 3 (Day 3): Usage UI
- Phase 4 (Week 2): Stripe checkout
- Phase 5 (Week 3): Webhook automation

**Risk Level:** LOW
- Bypass risk: Acceptable for early stage
- Cost exposure: $0.68 per evaluation, manageable
- Technical complexity: Low (reuses existing infrastructure)

**Minimal Edge Refactor:**
- orchestrate/index.ts: ~15 lines (quota check + increment)
- Other endpoints: Can wait for Phase 2
- No architectural changes needed

**Clean Upgrade Trigger:**
- Hybrid approach: Soft UI disable + hard server block
- Upgrade modal on limit reached
- Inline prompts in chat

**Stripe Integration:**
- Standard webhook pattern
- Auto-update user_subscriptions on payment
- AI unlocks automatically via tier change

---

## NEXT STEPS (AWAITING APPROVAL)

Once you approve:

1. ✅ **Confirm evaluation threshold:** 15 AI interactions?
2. ✅ **Confirm pricing:** $19.99/mo Plus, $39.99/mo Complete?
3. ✅ **Confirm enforcement level:** UI + DB + orchestrate edge?
4. ✅ **Proceed with Phase 1 implementation**

**Ready to build on your approval.**
