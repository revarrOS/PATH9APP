/**
 * Food → Nutrient Associations
 *
 * Conservative mappings of common foods to their well-established nutrient content.
 * Only includes foods with high-confidence associations.
 *
 * This is NOT medical advice. These are observable nutritional facts.
 */

export type NutrientConfidence = 'high' | 'medium';

export interface FoodNutrientAssociation {
  nutrients: string[];
  confidence: NutrientConfidence;
}

/**
 * ~50 common whole foods with conservative nutrient mappings
 */
export const FOOD_NUTRIENT_MAP: Record<string, FoodNutrientAssociation> = {
  // Fish & Seafood
  'salmon': { nutrients: ['omega-3', 'protein', 'vitamin-d'], confidence: 'high' },
  'tuna': { nutrients: ['omega-3', 'protein', 'selenium'], confidence: 'high' },
  'sardines': { nutrients: ['omega-3', 'protein', 'calcium', 'vitamin-d'], confidence: 'high' },
  'mackerel': { nutrients: ['omega-3', 'protein', 'vitamin-b12'], confidence: 'high' },

  // Leafy Greens
  'spinach': { nutrients: ['folate', 'iron', 'vitamin-k', 'vitamin-c'], confidence: 'high' },
  'kale': { nutrients: ['vitamin-k', 'vitamin-c', 'calcium', 'folate'], confidence: 'high' },
  'collard greens': { nutrients: ['vitamin-k', 'calcium', 'folate'], confidence: 'high' },
  'swiss chard': { nutrients: ['vitamin-k', 'vitamin-a', 'magnesium'], confidence: 'high' },

  // Other Vegetables
  'broccoli': { nutrients: ['vitamin-c', 'vitamin-k', 'folate', 'fiber'], confidence: 'high' },
  'brussels sprouts': { nutrients: ['vitamin-c', 'vitamin-k', 'folate'], confidence: 'high' },
  'bell pepper': { nutrients: ['vitamin-c', 'vitamin-a'], confidence: 'high' },
  'tomato': { nutrients: ['vitamin-c', 'vitamin-k', 'lycopene'], confidence: 'high' },
  'carrot': { nutrients: ['vitamin-a', 'fiber'], confidence: 'high' },
  'sweet potato': { nutrients: ['vitamin-a', 'fiber', 'vitamin-c'], confidence: 'high' },

  // Fruits
  'blueberries': { nutrients: ['vitamin-c', 'vitamin-k', 'anthocyanins'], confidence: 'high' },
  'strawberries': { nutrients: ['vitamin-c', 'folate', 'anthocyanins'], confidence: 'high' },
  'orange': { nutrients: ['vitamin-c', 'folate'], confidence: 'high' },
  'banana': { nutrients: ['potassium', 'vitamin-b6'], confidence: 'high' },
  'apple': { nutrients: ['fiber', 'vitamin-c'], confidence: 'high' },
  'avocado': { nutrients: ['healthy-fats', 'folate', 'vitamin-k', 'potassium'], confidence: 'high' },

  // Legumes & Beans
  'lentils': { nutrients: ['protein', 'fiber', 'folate', 'iron'], confidence: 'high' },
  'chickpeas': { nutrients: ['protein', 'fiber', 'folate'], confidence: 'high' },
  'black beans': { nutrients: ['protein', 'fiber', 'folate', 'iron'], confidence: 'high' },
  'kidney beans': { nutrients: ['protein', 'fiber', 'iron'], confidence: 'high' },

  // Nuts & Seeds
  'almonds': { nutrients: ['healthy-fats', 'vitamin-e', 'magnesium', 'protein'], confidence: 'high' },
  'walnuts': { nutrients: ['omega-3', 'healthy-fats', 'protein'], confidence: 'high' },
  'chia seeds': { nutrients: ['omega-3', 'fiber', 'protein', 'calcium'], confidence: 'high' },
  'flax seeds': { nutrients: ['omega-3', 'fiber'], confidence: 'high' },
  'pumpkin seeds': { nutrients: ['zinc', 'magnesium', 'protein'], confidence: 'high' },
  'sunflower seeds': { nutrients: ['vitamin-e', 'selenium'], confidence: 'high' },

  // Whole Grains
  'oats': { nutrients: ['fiber', 'iron', 'b-vitamins'], confidence: 'high' },
  'quinoa': { nutrients: ['protein', 'fiber', 'iron', 'magnesium'], confidence: 'high' },
  'brown rice': { nutrients: ['fiber', 'b-vitamins', 'magnesium'], confidence: 'high' },

  // Protein Sources
  'chicken breast': { nutrients: ['protein', 'vitamin-b6', 'niacin'], confidence: 'high' },
  'turkey': { nutrients: ['protein', 'selenium', 'b-vitamins'], confidence: 'high' },
  'eggs': { nutrients: ['protein', 'vitamin-d', 'vitamin-b12', 'choline'], confidence: 'high' },
  'greek yogurt': { nutrients: ['protein', 'calcium', 'probiotics'], confidence: 'high' },
  'tofu': { nutrients: ['protein', 'calcium', 'iron'], confidence: 'high' },
  'tempeh': { nutrients: ['protein', 'probiotics', 'iron'], confidence: 'high' },

  // Other
  'olive oil': { nutrients: ['healthy-fats', 'vitamin-e'], confidence: 'high' },
  'green tea': { nutrients: ['polyphenols', 'antioxidants'], confidence: 'high' },
  'turmeric': { nutrients: ['curcumin'], confidence: 'high' },
  'ginger': { nutrients: ['gingerol'], confidence: 'high' },
  'garlic': { nutrients: ['allicin', 'vitamin-c'], confidence: 'high' },
  'mushrooms': { nutrients: ['vitamin-d', 'selenium', 'b-vitamins'], confidence: 'high' },
  'seaweed': { nutrients: ['iodine', 'iron', 'calcium'], confidence: 'high' },
  'dark chocolate': { nutrients: ['flavonoids', 'iron', 'magnesium'], confidence: 'medium' },
  'beets': { nutrients: ['folate', 'nitrates', 'vitamin-c'], confidence: 'high' },
  'asparagus': { nutrients: ['folate', 'vitamin-k'], confidence: 'high' },
};

/**
 * Check if a food has nutrient associations
 */
export function getFoodNutrients(food: string): string[] | null {
  const normalized = food.toLowerCase().trim();
  const association = FOOD_NUTRIENT_MAP[normalized];
  return association ? association.nutrients : null;
}

/**
 * Get all foods that contain a specific nutrient
 */
export function getFoodsWithNutrient(nutrient: string): string[] {
  return Object.entries(FOOD_NUTRIENT_MAP)
    .filter(([_, assoc]) => assoc.nutrients.includes(nutrient))
    .map(([food]) => food);
}
