# CURRENT STATE MAP — USAGE-BASED CONVERSION SYSTEM

**Date:** 2026-03-03
**Purpose:** Pre-implementation diagnostic
**Status:** NO CHANGES MADE YET

---

## 📊 WHAT EXISTS NOW

### DATABASE OBJECTS

**Tables:**
- ✅ `subscription_tiers` — defines tier limits
- ✅ `user_subscriptions` — tracks active subscriptions
- ✅ `usage_tracking` — tracks feature usage (currently unused, 0 rows)

**PostgreSQL Functions:**
- ✅ `check_entitlement(user_id, feature_key)` — checks if tier allows feature
- ✅ `check_usage_limit(user_id, feature_key)` — checks if under quota
- ✅ `increment_usage(user_id, feature_key)` — increments usage counter

**Current Tiers:**
- free (3 Gemma conversations/month)
- plus ($19.99/mo)
- complete ($39.99/mo)

**AI Entrypoint:**
- `/supabase/functions/orchestrate/index.ts` — all AI calls route here

**Client Components Using AI:**
- `/products/bloodwork/components/BloodworkChat.tsx`
- `/products/condition/components/ConditionChat.tsx`
- `/products/nutrition/components/NutritionChat.tsx`

**Service Layer:**
- `/services/subscription.service.ts` — quota checking
- `/services/orchestration.service.ts` — AI gateway
- `/hooks/useSubscription.ts` — React hook

---

## 🎯 WHAT CHANGES

1. **Database:** free_evaluation (15 lifetime) + path9_full (unlimited)
2. **Client:** Pre-flight check before AI calls
3. **Server:** 15-line quota check in orchestrate
4. **UI:** Usage counter + upgrade modal
5. **Pricing:** Remove Plus/Complete, show only Path9 Full

**Total implementation: ~2.5 hours**

