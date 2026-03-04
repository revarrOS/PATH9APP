/**
 * Lens Computation Service
 *
 * Computes support lens signals from nutrition entries.
 * NO persistence, NO caching — all computation on-demand.
 *
 * Returns "presence" values (0.0-1.0) indicating observed food patterns.
 * NOT scores, NOT targets, NOT recommendations.
 */

import { FOOD_NUTRIENT_MAP, getFoodNutrients } from '../knowledge/food-nutrient-map';
import { NUTRIENT_LENS_MAP, getLensesForNutrient } from '../knowledge/nutrient-lens-map';
import { SUPPORT_LENSES } from '../config/support-lenses';
import type { NutritionEntry } from '../types/nutrition.types';

export interface LensSignal {
  lensId: string;
  presence: number; // 0.0 to 1.0
  contributingFoods: string[];
  contributingNutrients: string[];
}

export interface WeeklyLensPattern {
  lensId: string;
  presence: number;
  frequency: number; // How many days this lens appeared
  contributingFoods: string[];
}

/**
 * Extract food items from AI interpretation
 * Uses foodCategories from the structured AI interpretation
 */
function extractFoodsFromInterpretation(interpretation: any): string[] {
  if (!interpretation || !interpretation.foodCategories) return [];

  const recognizedFoods: string[] = [];

  // Check each food category against our food map
  interpretation.foodCategories.forEach((category: string) => {
    const lowerCategory = category.toLowerCase();

    // Check if this category matches any food in our map
    Object.keys(FOOD_NUTRIENT_MAP).forEach(food => {
      if (lowerCategory.includes(food.toLowerCase()) || food.toLowerCase().includes(lowerCategory)) {
        recognizedFoods.push(food);
      }
    });
  });

  return [...new Set(recognizedFoods)]; // Remove duplicates
}

/**
 * Compute lens signals for a single nutrition entry
 */
export function computeLensSignalsForEntry(entry: NutritionEntry): LensSignal[] {
  const foods = extractFoodsFromInterpretation(entry.ai_interpretation);

  // Map to track lens contributions
  const lensContributions = new Map<string, {
    foods: Set<string>;
    nutrients: Set<string>;
    count: number;
  }>();

  // Initialize all lenses
  SUPPORT_LENSES.forEach(lens => {
    lensContributions.set(lens.id, {
      foods: new Set(),
      nutrients: new Set(),
      count: 0
    });
  });

  // Process each recognized food
  foods.forEach(food => {
    const nutrients = getFoodNutrients(food);
    if (!nutrients) return;

    nutrients.forEach(nutrient => {
      const lenses = getLensesForNutrient(nutrient);

      lenses.forEach(lensId => {
        const contribution = lensContributions.get(lensId);
        if (contribution) {
          contribution.foods.add(food);
          contribution.nutrients.add(nutrient);
          contribution.count += 1;
        }
      });
    });
  });

  // Convert to lens signals
  return SUPPORT_LENSES.map(lens => {
    const contribution = lensContributions.get(lens.id)!;

    // Presence calculation:
    // - 0.0 = no signal
    // - 0.1-0.3 = minimal presence (1-2 foods)
    // - 0.4-0.6 = moderate presence (3-5 foods)
    // - 0.7-1.0 = strong presence (6+ foods)
    const foodCount = contribution.foods.size;
    let presence = 0;

    if (foodCount === 0) {
      presence = 0;
    } else if (foodCount <= 2) {
      presence = Math.min(0.3, foodCount * 0.15);
    } else if (foodCount <= 5) {
      presence = 0.3 + ((foodCount - 2) * 0.1);
    } else {
      presence = Math.min(1.0, 0.6 + ((foodCount - 5) * 0.08));
    }

    return {
      lensId: lens.id,
      presence,
      contributingFoods: Array.from(contribution.foods),
      contributingNutrients: Array.from(contribution.nutrients)
    };
  });
}

/**
 * Aggregate lens signals across multiple entries (weekly view)
 */
export function aggregateWeeklyLensSignals(entries: NutritionEntry[]): WeeklyLensPattern[] {
  if (entries.length === 0) {
    return SUPPORT_LENSES.map(lens => ({
      lensId: lens.id,
      presence: 0,
      frequency: 0,
      contributingFoods: []
    }));
  }

  // Track per-lens aggregation
  const lensAggregation = new Map<string, {
    totalPresence: number;
    daysWithSignal: number;
    allFoods: Set<string>;
  }>();

  SUPPORT_LENSES.forEach(lens => {
    lensAggregation.set(lens.id, {
      totalPresence: 0,
      daysWithSignal: 0,
      allFoods: new Set()
    });
  });

  // Process each entry
  entries.forEach(entry => {
    const signals = computeLensSignalsForEntry(entry);

    signals.forEach(signal => {
      const agg = lensAggregation.get(signal.lensId);
      if (agg) {
        agg.totalPresence += signal.presence;
        if (signal.presence > 0.1) {
          agg.daysWithSignal += 1;
        }
        signal.contributingFoods.forEach(food => agg.allFoods.add(food));
      }
    });
  });

  // Convert to weekly patterns
  return SUPPORT_LENSES.map(lens => {
    const agg = lensAggregation.get(lens.id)!;

    // Average presence across all entries
    const avgPresence = agg.totalPresence / entries.length;

    return {
      lensId: lens.id,
      presence: Math.min(1.0, avgPresence),
      frequency: agg.daysWithSignal,
      contributingFoods: Array.from(agg.allFoods)
    };
  });
}

/**
 * Get lens signals for recent entries (last N days)
 */
export function computeRecentLensPatterns(
  entries: NutritionEntry[],
  days: number = 7
): WeeklyLensPattern[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentEntries = entries.filter(entry => {
    const entryDate = new Date(entry.entry_date);
    return entryDate >= cutoffDate;
  });

  return aggregateWeeklyLensSignals(recentEntries);
}
