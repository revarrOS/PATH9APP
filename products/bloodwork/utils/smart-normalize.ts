/**
 * Smart Normalization Utility
 *
 * Applies high-confidence scale normalization to bloodwork marker values.
 * This runs client-side only, just before database persistence.
 *
 * CRITICAL: Only applies normalization when mathematically provable.
 * No guessing, no ambiguous cases.
 */

export interface MarkerValue {
  value: string;
  refLow?: string;
  refHigh?: string;
}

export interface NormalizationResult {
  normalizedValues: Record<string, MarkerValue>;
  wasNormalized: boolean;
  normalizedMarkers: string[];
}

/**
 * Applies smart normalization to marker values
 *
 * High-confidence rules:
 * - HGB > 20 g/dL → divide by 10 (120 → 12.0)
 * - MCHC > 100 g/dL → divide by 10 (334 → 33.4)
 * - HCT < 1 % → multiply by 100 (0.397 → 39.7)
 * - RDW-CV < 1 % → multiply by 100 (0.15 → 15.0)
 *
 * Does NOT normalize:
 * - NEUT, LYM, MXD (absolute vs percentage is ambiguous)
 * - Any marker without clear mathematical proof of error
 */
export function smartNormalize(
  markerValues: Record<string, MarkerValue>
): NormalizationResult {
  const normalizedValues: Record<string, MarkerValue> = {};
  const normalizedMarkers: string[] = [];
  let wasNormalized = false;

  for (const [markerName, data] of Object.entries(markerValues)) {
    if (!data.value || !data.value.trim()) {
      normalizedValues[markerName] = data;
      continue;
    }

    const numValue = parseFloat(data.value);
    if (isNaN(numValue)) {
      normalizedValues[markerName] = data;
      continue;
    }

    let normalizedValue = numValue;
    let didNormalize = false;

    // High-confidence normalization rules
    switch (markerName) {
      case 'HGB':
        // Hemoglobin: if > 20, likely in g/L instead of g/dL
        if (numValue > 20) {
          normalizedValue = numValue / 10;
          didNormalize = true;
        }
        break;

      case 'MCHC':
        // Mean Corpuscular Hemoglobin Concentration: if > 100, likely 10x too high
        if (numValue > 100) {
          normalizedValue = numValue / 10;
          didNormalize = true;
        }
        break;

      case 'HCT':
        // Hematocrit: if < 1, likely in decimal format instead of percentage
        if (numValue < 1) {
          normalizedValue = numValue * 100;
          didNormalize = true;
        }
        break;

      case 'RDW-CV':
        // Red Cell Distribution Width: if < 1, likely in decimal format
        if (numValue < 1) {
          normalizedValue = numValue * 100;
          didNormalize = true;
        }
        break;

      // DO NOT normalize these markers (ambiguous):
      // - NEUT, LYM, MXD: could be absolute count or percentage
      // - Other markers: not enough confidence for automatic correction
    }

    if (didNormalize) {
      wasNormalized = true;
      normalizedMarkers.push(markerName);
      normalizedValues[markerName] = {
        ...data,
        value: normalizedValue.toString(),
      };
    } else {
      normalizedValues[markerName] = data;
    }
  }

  return {
    normalizedValues,
    wasNormalized,
    normalizedMarkers,
  };
}

/**
 * Checks if a marker value would be normalized
 * Used for display/preview purposes without actually modifying data
 */
export function wouldNormalize(markerName: string, value: string): boolean {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;

  switch (markerName) {
    case 'HGB':
      return numValue > 20;
    case 'MCHC':
      return numValue > 100;
    case 'HCT':
      return numValue < 1;
    case 'RDW-CV':
      return numValue < 1;
    default:
      return false;
  }
}
