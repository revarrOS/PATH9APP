/**
 * Nutrient → Support Lens Mappings
 *
 * Conservative associations between nutrients and support lenses.
 * One nutrient may contribute to multiple lenses.
 *
 * These mappings reflect commonly discussed relationships in nutrition science,
 * NOT medical claims or treatment recommendations.
 */

/**
 * Map of nutrients to the support lenses they contribute to
 */
export const NUTRIENT_LENS_MAP: Record<string, string[]> = {
  // Omega-3 fatty acids
  'omega-3': ['inflammation_support', 'defence_repair'],

  // Vitamins - Fat Soluble
  'vitamin-a': ['defence_repair', 'micronutrient_signals'],
  'vitamin-d': ['defence_repair', 'blood_cell_support', 'micronutrient_signals'],
  'vitamin-e': ['inflammation_support', 'defence_repair', 'micronutrient_signals'],
  'vitamin-k': ['blood_cell_support', 'micronutrient_signals'],

  // Vitamins - Water Soluble
  'vitamin-c': ['defence_repair', 'inflammation_support', 'micronutrient_signals'],
  'vitamin-b6': ['blood_cell_support', 'micronutrient_signals'],
  'vitamin-b12': ['blood_cell_support', 'micronutrient_signals'],
  'folate': ['blood_cell_support', 'micronutrient_signals'],
  'b-vitamins': ['blood_cell_support', 'micronutrient_signals'],
  'niacin': ['micronutrient_signals'],
  'choline': ['micronutrient_signals'],

  // Minerals
  'iron': ['blood_cell_support', 'micronutrient_signals'],
  'zinc': ['defence_repair', 'micronutrient_signals'],
  'selenium': ['defence_repair', 'micronutrient_signals'],
  'magnesium': ['micronutrient_signals'],
  'calcium': ['micronutrient_signals'],
  'potassium': ['micronutrient_signals'],
  'iodine': ['micronutrient_signals'],

  // Macronutrients
  'protein': ['defence_repair', 'macronutrient_balance'],
  'fiber': ['macronutrient_balance', 'inflammation_support'],
  'healthy-fats': ['inflammation_support', 'macronutrient_balance'],

  // Phytonutrients & Compounds
  'anthocyanins': ['inflammation_support'],
  'polyphenols': ['inflammation_support'],
  'antioxidants': ['inflammation_support', 'defence_repair'],
  'curcumin': ['inflammation_support'],
  'gingerol': ['inflammation_support'],
  'allicin': ['inflammation_support', 'defence_repair'],
  'flavonoids': ['inflammation_support'],
  'lycopene': ['inflammation_support', 'defence_repair'],
  'nitrates': ['micronutrient_signals'],

  // Other
  'probiotics': ['defence_repair'],
};

/**
 * Get which lenses a nutrient contributes to
 */
export function getLensesForNutrient(nutrient: string): string[] {
  return NUTRIENT_LENS_MAP[nutrient] || [];
}

/**
 * Get all nutrients that contribute to a specific lens
 */
export function getNutrientsForLens(lensId: string): string[] {
  return Object.entries(NUTRIENT_LENS_MAP)
    .filter(([_, lenses]) => lenses.includes(lensId))
    .map(([nutrient]) => nutrient);
}
