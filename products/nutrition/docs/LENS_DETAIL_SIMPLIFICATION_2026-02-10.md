# Lens Detail UX Simplification

**Date:** 2026-02-10
**Type:** UX Refinement
**Status:** Complete

## Problem Statement

The Lens Detail view contained too much static educational content, creating cognitive overload for users with fatigue and brain fog. The UI was doing work that should belong in Gemma conversation.

### User Feedback Issues:
- 300-400 words of dense text per lens
- 4-5 bullet points with long explanations
- Multiple expandable sections requiring interaction
- Felt like documentation/leaflet rather than a companion tool
- Mentally draining for target users

## Design Principle Applied

**The Lens Detail view should answer one core question only:**

> "Why is this lens showing up for me?"

It should **orient, not educate deeply.**
Deep explanation belongs in **Gemma**, not static UI.

## Changes Implemented

### Removed Completely:
- ❌ "Why These Foods Matter" section (4-5 detailed bullets)
- ❌ Long paragraphs explaining nutritional science
- ❌ Visual emphasis explanations
- ❌ Expandable section interactions
- ❌ Footer disclaimer

### Simplified to 3 Clean Sections:

#### 1. What This Tracks
- First sentence only from education content
- Example: "This lens tracks foods often discussed for their anti-inflammatory properties."
- No bullet lists, no expanding

#### 2. What Showed Up This Week
- Kept as-is (factual, scannable list)
- No explanatory text
- Simple bullet list of detected foods

#### 3. Why This Matters for You
- Diagnosis context label (e.g., "Essential Thrombocythemia")
- One plain-English line only
- Example: "Essential Thrombocythemia involves inflammatory pathways that are frequently discussed in relation to MPN conditions."
- No visual emphasis notes

### Added:

#### Gemma Handoff
- Clear prompt: "Want to understand this deeper?"
- "Ask Gemma" button with MessageCircle icon
- Routes directly to `/nutrition/analysis`
- Styled with brand.blue color for consistency

## Impact

### Before:
- ~400 words per lens
- 4 expandable sections
- High cognitive load
- Education in UI

### After:
- ~50 words max per lens
- 3 flat, scannable sections
- Minimal cognitive load
- Education in Gemma conversation

## Technical Details

### Files Modified:
- `products/nutrition/components/LensDetailView.tsx`

### Changes:
- Removed `ExpandableSection` component
- Removed expandable state management
- Extract first sentence only from education content
- Added `useRouter` for Gemma navigation
- Simplified styles (removed unused)
- Added Gemma handoff UI

### No Changes to:
- ❌ Database schemas
- ❌ Lens computation logic
- ❌ Diagnosis emphasis system
- ❌ Education config (still used, just simplified extraction)
- ❌ Gemma behaviour in other domains

## User Flow

1. User taps lens from Trends view
2. Sees simplified 3-section detail
3. Quickly understands what's tracked and why
4. If wants deeper explanation → taps "Ask Gemma"
5. Routes to nutrition chat for conversational education

## Verification

✅ Build completed successfully
✅ Component simplified from 330 lines → 242 lines
✅ No expandable sections
✅ Clear Gemma handoff
✅ Maintains all existing logic
✅ No schema changes
✅ No regression to other domains

## Goal State Achieved

- Lens Detail feels calm, readable, lightweight
- Users don't feel forced to read
- Gemma becomes the primary explainer
- Static UI supports orientation only

---

This simplification aligns with the core design principle: **the UI should orient, not educate.** Education depth now lives where it belongs—in conversation with Gemma.
