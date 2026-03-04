export type SupportArea = {
  id: string;
  label: string;
  indicativeStatement: string;
};

export type ConditionNutritionKnowledge = {
  supportAreas: SupportArea[];
  educationTopics: string[];
  cautionTopics: string[];
  searchTerms: string[];
};

export const conditionNutritionMap: Record<string, ConditionNutritionKnowledge> = {
  'acute-myeloid-leukemia': {
    supportAreas: [
      {
        id: 'protein-rich',
        label: 'Protein-Rich Foods',
        indicativeStatement: 'Protein-rich foods may support recovery and rebuilding during treatment',
      },
      {
        id: 'iron-rich',
        label: 'Iron-Rich Foods',
        indicativeStatement: 'Iron-rich foods may support red blood cell production',
      },
      {
        id: 'hydration',
        label: 'Hydration',
        indicativeStatement: 'Staying hydrated is important during treatment',
      },
      {
        id: 'anti-inflammatory',
        label: 'Anti-Inflammatory Foods',
        indicativeStatement: 'Anti-inflammatory foods may support overall wellness',
      },
      {
        id: 'easily-digestible',
        label: 'Easily Digestible Foods',
        indicativeStatement: 'Easily digestible foods may help when experiencing digestive sensitivity',
      },
      {
        id: 'energy-dense',
        label: 'Energy-Dense Foods',
        indicativeStatement: 'Energy-dense foods may help maintain weight during treatment',
      },
    ],
    educationTopics: [
      'managing-nausea-nutrition',
      'protein-during-treatment',
      'food-safety-neutropenia',
      'hydration-strategies',
      'eating-small-frequent-meals',
    ],
    cautionTopics: [
      'food-safety',
      'supplement-interactions',
      'raw-foods',
      'unpasteurized',
      'neutropenic-diet',
    ],
    searchTerms: [
      'AML nutrition',
      'leukemia nutrition protein',
      'cancer treatment nutrition registered dietitian',
    ],
  },
  'chronic-lymphocytic-leukemia': {
    supportAreas: [
      {
        id: 'protein-rich',
        label: 'Protein-Rich Foods',
        indicativeStatement: 'Protein-rich foods may support immune function',
      },
      {
        id: 'antioxidant-rich',
        label: 'Antioxidant-Rich Foods',
        indicativeStatement: 'Antioxidant-rich foods may support overall wellness',
      },
      {
        id: 'hydration',
        label: 'Hydration',
        indicativeStatement: 'Staying well-hydrated supports overall health',
      },
      {
        id: 'anti-inflammatory',
        label: 'Anti-Inflammatory Foods',
        indicativeStatement: 'Anti-inflammatory foods may support overall wellness',
      },
      {
        id: 'immune-supporting',
        label: 'Immune-Supporting Foods',
        indicativeStatement: 'Foods that may support immune function',
      },
    ],
    educationTopics: [
      'nutrition-immune-support',
      'protein-sources',
      'antioxidant-foods',
      'food-safety-general',
    ],
    cautionTopics: [
      'supplement-interactions',
      'food-safety',
    ],
    searchTerms: [
      'CLL nutrition',
      'chronic leukemia nutrition',
      'nutrition immune support registered dietitian',
    ],
  },
  'multiple-myeloma': {
    supportAreas: [
      {
        id: 'protein-rich',
        label: 'Protein-Rich Foods',
        indicativeStatement: 'Protein-rich foods may support bone and muscle health',
      },
      {
        id: 'calcium-rich',
        label: 'Calcium-Rich Foods',
        indicativeStatement: 'Calcium-rich foods may support bone health',
      },
      {
        id: 'vitamin-d-rich',
        label: 'Vitamin D-Rich Foods',
        indicativeStatement: 'Vitamin D-rich foods may support bone health',
      },
      {
        id: 'hydration',
        label: 'Hydration',
        indicativeStatement: 'Staying well-hydrated supports kidney function',
      },
      {
        id: 'anti-inflammatory',
        label: 'Anti-Inflammatory Foods',
        indicativeStatement: 'Anti-inflammatory foods may support overall wellness',
      },
    ],
    educationTopics: [
      'nutrition-bone-health',
      'protein-during-treatment',
      'hydration-kidney-health',
      'food-safety-myeloma',
    ],
    cautionTopics: [
      'food-safety',
      'supplement-interactions',
      'calcium-supplements',
    ],
    searchTerms: [
      'multiple myeloma nutrition',
      'myeloma nutrition bone health',
      'cancer nutrition registered dietitian',
    ],
  },
  'lymphoma': {
    supportAreas: [
      {
        id: 'protein-rich',
        label: 'Protein-Rich Foods',
        indicativeStatement: 'Protein-rich foods may support recovery during treatment',
      },
      {
        id: 'energy-dense',
        label: 'Energy-Dense Foods',
        indicativeStatement: 'Energy-dense foods may help maintain weight during treatment',
      },
      {
        id: 'hydration',
        label: 'Hydration',
        indicativeStatement: 'Staying hydrated is important during treatment',
      },
      {
        id: 'anti-inflammatory',
        label: 'Anti-Inflammatory Foods',
        indicativeStatement: 'Anti-inflammatory foods may support overall wellness',
      },
      {
        id: 'easily-digestible',
        label: 'Easily Digestible Foods',
        indicativeStatement: 'Easily digestible foods may help with treatment side effects',
      },
    ],
    educationTopics: [
      'nutrition-during-chemotherapy',
      'managing-side-effects-nutrition',
      'protein-sources',
      'food-safety-cancer',
    ],
    cautionTopics: [
      'food-safety',
      'supplement-interactions',
    ],
    searchTerms: [
      'lymphoma nutrition',
      'cancer nutrition chemotherapy',
      'nutrition registered dietitian lymphoma',
    ],
  },
  'generic-wellness': {
    supportAreas: [
      {
        id: 'protein-rich',
        label: 'Protein-Rich Foods',
        indicativeStatement: 'Protein-rich foods support overall health',
      },
      {
        id: 'fruits-vegetables',
        label: 'Fruits & Vegetables',
        indicativeStatement: 'Fruits and vegetables provide important nutrients',
      },
      {
        id: 'whole-grains',
        label: 'Whole Grains',
        indicativeStatement: 'Whole grains provide energy and fiber',
      },
      {
        id: 'hydration',
        label: 'Hydration',
        indicativeStatement: 'Staying well-hydrated supports overall health',
      },
      {
        id: 'healthy-fats',
        label: 'Healthy Fats',
        indicativeStatement: 'Healthy fats support overall wellness',
      },
    ],
    educationTopics: [
      'balanced-nutrition',
      'meal-planning-basics',
      'hydration-health',
    ],
    cautionTopics: [],
    searchTerms: [
      'general nutrition health',
      'balanced diet registered dietitian',
    ],
  },
};

export function getConditionNutritionKnowledge(
  condition: string | null | undefined
): ConditionNutritionKnowledge {
  if (!condition) {
    return conditionNutritionMap['generic-wellness'];
  }

  const normalizedCondition = condition.toLowerCase().trim();

  if (normalizedCondition.includes('aml') || normalizedCondition.includes('acute myeloid')) {
    return conditionNutritionMap['acute-myeloid-leukemia'];
  }

  if (normalizedCondition.includes('cll') || normalizedCondition.includes('chronic lymphocytic')) {
    return conditionNutritionMap['chronic-lymphocytic-leukemia'];
  }

  if (normalizedCondition.includes('myeloma')) {
    return conditionNutritionMap['multiple-myeloma'];
  }

  if (normalizedCondition.includes('lymphoma')) {
    return conditionNutritionMap['lymphoma'];
  }

  return conditionNutritionMap['generic-wellness'];
}

export const GENERIC_SUPPORT_AREAS: SupportArea[] = conditionNutritionMap['generic-wellness'].supportAreas;
