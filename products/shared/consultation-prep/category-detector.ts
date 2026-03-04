export type QuestionCategory = 'bloodwork' | 'condition' | 'nutrition' | 'general';

const CONDITION_KEYWORDS = [
  'diagnosis', 'condition', 'fibrosis', 'et', 'myelofibrosis', 'polycythemia',
  'portal hypertension', 'spleen', 'liver', 'bone marrow',
  'treatment', 'management', 'progression', 'prognosis',
  'biopsy', 'lymphoma', 'leukemia', 'cancer',
  'my condition', "what's causing", 'how does', 'relate to my condition',
  'jak2', 'calr', 'mpl', 'mutation', 'genetic'
];

const CONDITION_PHRASES = [
  'my condition',
  'what\'s causing',
  'how does',
  'what is causing',
  'why do i have',
  'is my condition',
  'about my diagnosis'
];

const BLOODWORK_MARKERS = [
  'wbc', 'rbc', 'hgb', 'hct', 'plt', 'platelet',
  'neut', 'lym', 'mxd', 'neutrophil', 'lymphocyte',
  'mcv', 'mch', 'mchc', 'rdw',
  'mpv', 'pdw', 'plcr',
  'hemoglobin', 'hematocrit', 'white blood cell', 'red blood cell'
];

const BLOODWORK_KEYWORDS = [
  'trend', 'trends', 'trending',
  'frequency', 'how often',
  'range', 'ranges', 'normal range',
  'value', 'values', 'level', 'levels',
  'count', 'counts',
  'test', 'tests', 'blood test', 'bloodwork',
  'result', 'results'
];

const NUTRITION_KEYWORDS = [
  'food', 'foods', 'meal', 'meals', 'eat', 'eating', 'ate',
  'diet', 'dietary', 'nutrition', 'nutritional',
  'vitamin', 'vitamins', 'supplement', 'supplements',
  'protein', 'iron', 'calcium', 'hydration', 'hydrate',
  'appetite', 'nausea', 'taste', 'swallow', 'chew',
  'weight', 'gain weight', 'lose weight', 'weight loss',
  'energy', 'fatigue', 'tired',
  'cook', 'cooking', 'recipe', 'recipes',
  'snack', 'snacks', 'drink', 'drinks', 'beverage'
];

const NUTRITION_PHRASES = [
  'what can i eat',
  'what should i eat',
  'can i eat',
  'is it safe to eat',
  'food safety',
  'safe foods',
  'avoid eating',
  'eating during',
  'diet during',
  'nutrition during',
  'help with appetite',
  'increase protein',
  'get more',
  'food choices'
];

export function detectQuestionCategory(questionText: string): QuestionCategory {
  if (!questionText || questionText.trim().length === 0) {
    return 'general';
  }

  const lowerText = questionText.toLowerCase();

  // Check for nutrition phrases first (high priority for food safety)
  const hasNutritionPhrase = NUTRITION_PHRASES.some(phrase =>
    lowerText.includes(phrase)
  );

  if (hasNutritionPhrase) {
    return 'nutrition';
  }

  // Check for condition phrases (highest priority)
  const hasConditionPhrase = CONDITION_PHRASES.some(phrase =>
    lowerText.includes(phrase)
  );

  if (hasConditionPhrase) {
    return 'condition';
  }

  // Check for condition keywords
  const conditionMatches = CONDITION_KEYWORDS.filter(keyword =>
    lowerText.includes(keyword)
  ).length;

  // Check for bloodwork markers
  const markerMatches = BLOODWORK_MARKERS.filter(marker =>
    lowerText.includes(marker)
  ).length;

  // Check for bloodwork keywords
  const bloodworkKeywordMatches = BLOODWORK_KEYWORDS.filter(keyword =>
    lowerText.includes(keyword)
  ).length;

  // Check for nutrition keywords
  const nutritionMatches = NUTRITION_KEYWORDS.filter(keyword =>
    lowerText.includes(keyword)
  ).length;

  // Decision logic
  // If mentions nutrition keywords strongly, likely nutrition
  if (nutritionMatches >= 2) {
    return 'nutrition';
  }

  // If mentions specific markers AND bloodwork keywords, likely bloodwork
  if (markerMatches > 0 && bloodworkKeywordMatches > 0) {
    return 'bloodwork';
  }

  // If only mentions markers but no bloodwork context, check condition score
  if (markerMatches > 0 && conditionMatches === 0) {
    return 'bloodwork';
  }

  // If has condition keywords and no bloodwork context, it's condition
  if (conditionMatches >= 2) {
    return 'condition';
  }

  // If one strong condition match
  if (conditionMatches >= 1 && markerMatches === 0) {
    return 'condition';
  }

  // If one nutrition match and no other strong matches
  if (nutritionMatches >= 1 && markerMatches === 0 && conditionMatches === 0) {
    return 'nutrition';
  }

  // Default to general for broad planning questions
  return 'general';
}

export function getCategoryLabel(category: QuestionCategory): string {
  switch (category) {
    case 'bloodwork':
      return 'Bloodwork';
    case 'condition':
      return 'Condition';
    case 'nutrition':
      return 'Nutrition';
    case 'general':
      return 'General';
  }
}

export function getCategoryDomain(category: QuestionCategory): string {
  return category;
}
