# Support Lenses Implementation

**Status:** ✅ Complete — Core system operational
**Date:** 2026-02-10

## What Was Built

A diagnosis-aware visual pattern system that helps blood cancer patients observe nutrition patterns without scoring, prescriptions, or medical claims.

### Core Components

1. **Support Lenses Config** (`products/nutrition/config/support-lenses.ts`)
   - 5 lenses: Inflammation Support, Defence & Repair, Blood Cell Support, Micronutrient Signals, Macronutrient Balance
   - Visual metadata only
   - NO logic or computation

2. **Food → Nutrient Mapping** (`products/nutrition/knowledge/food-nutrient-map.ts`)
   - ~50 common whole foods
   - Conservative, high-confidence associations
   - Human-auditable TypeScript object

3. **Nutrient → Lens Mapping** (`products/nutrition/knowledge/nutrient-lens-map.ts`)
   - Simple one-to-many lookups
   - NO inference, NO medical logic
   - Plain associations

4. **Diagnosis Emphasis Config** (`products/nutrition/config/diagnosis-emphasis.ts`)
   - 6 initial profiles (ET, PV, MF, CML, post-chemo, general)
   - Multipliers for visual emphasis (0.5-1.0)
   - Never exclusionary

5. **Lens Computation Service** (`products/nutrition/services/lens-computation.service.ts`)
   - Reads existing `nutrition_entries.ai_interpretation`
   - Extracts recognized foods
   - Computes presence (0.0-1.0) NOT scores
   - Weekly aggregation

6. **UI Components** (`products/nutrition/components/WeeklyLensView.tsx`)
   - Visual bars with diagnosis-aware emphasis
   - Neutral colors, no red/green
   - Frequency display
   - Contributing foods listed

7. **Gemma Integration** (`supabase/functions/orchestrate/domain-context-builder.ts`)
   - Lens patterns included in nutrition context
   - Non-prescriptive language enforced
   - Safety boundaries added

## Architecture Decisions

### Zero New Tables
- NO `support_lenses` table
- NO `diagnosis_lens_weights` table
- NO `nutrition_lens_signals` table

**Why:** Maximum flexibility during validation phase. All configs in version-controlled TypeScript.

### On-Demand Computation
- Lens signals computed at render time
- NO caching, NO persistence
- Recomputes from existing `ai_interpretation` field

**Why:** Fast iteration, easy to change mappings, no lock-in.

### Config-Driven Emphasis
- Diagnosis emphasis in TypeScript config files
- Easy to add/modify profiles
- No migrations needed

**Why:** Can evolve based on user feedback without database changes.

## Visual Grammar Rules

### Presence NOT Scores
- 0.0 = no signal
- 0.1-0.3 = minimal presence
- 0.4-0.6 = moderate presence
- 0.7-1.0 = strong presence

Based on number of contributing foods, NOT nutrient adequacy.

### Diagnosis Emphasis
- Multipliers applied at render time
- Affects: bar length, opacity, order
- ALL lenses shown, none hidden
- Example: ET emphasizes inflammation support (1.0), reduces others (0.6-0.8)

### Neutral Colors Only
- Slate, gray, stone, zinc
- NO red/green
- NO pass/fail visual language

## Gemma Conversation Rules

### Indicative Language Only
- ✅ "I've noticed inflammation-supporting foods appearing consistently"
- ❌ "You're doing well with inflammation support"
- ❌ "You need more protein"

### Pattern Observation
- ✅ "Omega-3 rich foods appeared in 5 of 7 meals this week"
- ❌ "You're getting enough omega-3"
- ❌ "You should eat more fish"

### Medical Deflection
- User asks "Is this enough?" → Reframe as observation + suggest care team
- User asks about symptoms → Offer consultation prep
- User asks about food safety → Immediate care team deflection

## What Was NOT Built

Deliberately deferred for validation:

- ❌ Lens signal persistence
- ❌ Historical trend tracking (>14 days)
- ❌ Advanced semantic inference
- ❌ Meal planning or recommendations
- ❌ More than 5 lenses

## End-to-End Flow

1. User uploads meal photo (existing)
2. `analyze-nutrition-image` extracts food items (existing)
3. Stored in `nutrition_entries.ai_interpretation` (existing)
4. UI reads entries, computes lens signals on-demand (NEW)
5. Diagnosis profile loaded (existing)
6. Emphasis multipliers applied at render (NEW)
7. Weekly pattern visualization shown (NEW)
8. Gemma receives lens context for conversation (NEW)

## Testing

Manual validation required:

1. Upload meals with known foods (salmon, spinach, oats)
2. Verify lens computation recognizes foods
3. Check weekly aggregation shows patterns
4. Test diagnosis emphasis changes visual presentation
5. Verify Gemma references patterns without prescribing
6. Test with multiple diagnosis profiles

## Expansion Path

When validated:

1. Add diagnosis profiles based on user feedback
2. Expand food mapping (50 → 100+ foods)
3. Add persistence IF performance degrades
4. Refine emphasis weights based on user research
5. Consider historical tracking if requested

## Success Criteria

✅ User uploads meals
✅ Sees weekly visual patterns
✅ Diagnosis subtly changes emphasis
✅ Gemma says: "I notice inflammation-supporting foods appearing consistently this week"

Nothing more. Nothing less.
