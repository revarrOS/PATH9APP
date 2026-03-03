/**
 * Diagnosis-Specific Lens Emphasis Configuration
 *
 * Multipliers for visual emphasis based on diagnosis.
 * These affect ONLY visual presentation (size, opacity, order).
 *
 * All lenses are shown for all users.
 * Emphasis does NOT imply correctness or recommendation.
 * It reflects patterns commonly discussed for specific conditions.
 */

export interface DiagnosisEmphasis {
  diagnosisKey: string;
  displayName: string;
  lensEmphasis: Record<string, number>; // 0.5 to 1.0
}

/**
 * Emphasis configurations for different blood cancer diagnoses
 *
 * Scale: 1.0 = full emphasis, 0.5 = reduced emphasis
 * All values between 0.5-1.0 to ensure no lens is hidden
 */
export const DIAGNOSIS_EMPHASIS_CONFIG: DiagnosisEmphasis[] = [
  {
    diagnosisKey: 'MPN-ET',
    displayName: 'Essential Thrombocythemia',
    lensEmphasis: {
      inflammation_support: 1.0,
      blood_cell_support: 0.8,
      micronutrient_signals: 0.7,
      defence_repair: 0.6,
      macronutrient_balance: 0.6,
    }
  },
  {
    diagnosisKey: 'MPN-PV',
    displayName: 'Polycythemia Vera',
    lensEmphasis: {
      inflammation_support: 1.0,
      blood_cell_support: 0.9,
      micronutrient_signals: 0.7,
      defence_repair: 0.6,
      macronutrient_balance: 0.6,
    }
  },
  {
    diagnosisKey: 'MPN-MF',
    displayName: 'Myelofibrosis',
    lensEmphasis: {
      blood_cell_support: 1.0,
      micronutrient_signals: 0.9,
      inflammation_support: 0.8,
      defence_repair: 0.7,
      macronutrient_balance: 0.7,
    }
  },
  {
    diagnosisKey: 'post-chemotherapy',
    displayName: 'Post-Chemotherapy',
    lensEmphasis: {
      defence_repair: 1.0,
      micronutrient_signals: 0.9,
      macronutrient_balance: 0.8,
      inflammation_support: 0.7,
      blood_cell_support: 0.7,
    }
  },
  {
    diagnosisKey: 'CML',
    displayName: 'Chronic Myeloid Leukemia',
    lensEmphasis: {
      blood_cell_support: 1.0,
      defence_repair: 0.8,
      micronutrient_signals: 0.8,
      inflammation_support: 0.7,
      macronutrient_balance: 0.6,
    }
  },
  {
    diagnosisKey: 'general',
    displayName: 'General Blood Cancer Support',
    lensEmphasis: {
      defence_repair: 1.0,
      micronutrient_signals: 1.0,
      inflammation_support: 1.0,
      blood_cell_support: 1.0,
      macronutrient_balance: 1.0,
    }
  }
];

/**
 * Get emphasis configuration for a diagnosis
 * Falls back to 'general' if diagnosis not found
 */
export function getEmphasisForDiagnosis(diagnosisKey: string | null): Record<string, number> {
  if (!diagnosisKey) {
    return DIAGNOSIS_EMPHASIS_CONFIG.find(d => d.diagnosisKey === 'general')!.lensEmphasis;
  }

  const config = DIAGNOSIS_EMPHASIS_CONFIG.find(d => d.diagnosisKey === diagnosisKey);
  return config
    ? config.lensEmphasis
    : DIAGNOSIS_EMPHASIS_CONFIG.find(d => d.diagnosisKey === 'general')!.lensEmphasis;
}

/**
 * Get display name for diagnosis
 */
export function getDiagnosisDisplayName(diagnosisKey: string | null): string {
  if (!diagnosisKey) return 'General Blood Cancer Support';

  const config = DIAGNOSIS_EMPHASIS_CONFIG.find(d => d.diagnosisKey === diagnosisKey);
  return config?.displayName || 'General Blood Cancer Support';
}
