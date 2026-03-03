/**
 * Support Lenses Configuration
 *
 * Visual categories for observing nutrition patterns over time.
 * These are NOT scores, targets, or recommendations.
 * They represent observed presence of food categories that may support different body systems.
 */

export interface SupportLens {
  id: string;
  displayName: string;
  description: string;
  visualType: 'bar' | 'ring' | 'density';
  baseColor: string; // Neutral colors only
}

export const SUPPORT_LENSES: SupportLens[] = [
  {
    id: 'inflammation_support',
    displayName: 'Inflammation Support',
    description: 'Foods often discussed for their anti-inflammatory properties',
    visualType: 'bar',
    baseColor: '#64748B' // Neutral slate
  },
  {
    id: 'defence_repair',
    displayName: 'Defence & Repair',
    description: 'Protein and nutrients associated with cellular repair processes',
    visualType: 'bar',
    baseColor: '#6B7280' // Neutral gray
  },
  {
    id: 'blood_cell_support',
    displayName: 'Blood Cell Support',
    description: 'Nutrients often discussed in relation to blood cell health',
    visualType: 'bar',
    baseColor: '#78716C' // Neutral stone
  },
  {
    id: 'micronutrient_signals',
    displayName: 'Micronutrient Signals',
    description: 'Vitamins and minerals from whole food sources',
    visualType: 'bar',
    baseColor: '#71717A' // Neutral zinc
  },
  {
    id: 'macronutrient_balance',
    displayName: 'Macronutrient Balance',
    description: 'Protein, carbohydrate, and fat presence patterns',
    visualType: 'bar',
    baseColor: '#737373' // Neutral neutral
  }
];

export function getLensById(id: string): SupportLens | undefined {
  return SUPPORT_LENSES.find(lens => lens.id === id);
}
