export interface BloodTest {
  id: string;
  user_id: string;
  test_date: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BloodMarker {
  id: string;
  test_id: string;
  marker_name: string;
  value: number;
  unit: string;
  reference_range_low?: number;
  reference_range_high?: number;
  created_at: string;
  updated_at: string;
}

export interface BloodTestWithMarkers extends BloodTest {
  markers: BloodMarker[];
}

export interface CreateBloodTestInput {
  test_date: string;
  location?: string;
  notes?: string;
  markers: CreateBloodMarkerInput[];
}

export interface CreateBloodMarkerInput {
  marker_name: string;
  value: number;
  unit: string;
  reference_range_low?: number;
  reference_range_high?: number;
}

export interface UpdateBloodTestInput {
  test_date?: string;
  location?: string;
  notes?: string;
}

export interface UpdateBloodMarkerInput {
  marker_name?: string;
  value?: number;
  unit?: string;
  reference_range_low?: number;
  reference_range_high?: number;
}

export type CBCMarkerName =
  | 'WBC'
  | 'RBC'
  | 'HGB'
  | 'HCT'
  | 'MCV'
  | 'MCH'
  | 'MCHC'
  | 'PLT'
  | 'LYM'
  | 'LYM%'
  | 'MXD'
  | 'MXD%'
  | 'NEUT'
  | 'NEUT%'
  | 'RDW-SD'
  | 'RDW-CV'
  | 'PDW'
  | 'MPV'
  | 'PLCR';

export interface CBCMarkerDefinition {
  name: CBCMarkerName;
  full_name: string;
  unit: string;
  typical_range_low?: number;
  typical_range_high?: number;
}

export const CBC_MARKERS: CBCMarkerDefinition[] = [
  { name: 'WBC', full_name: 'White Blood Cell Count', unit: '10^9/L', typical_range_low: 4.0, typical_range_high: 11.0 },
  { name: 'RBC', full_name: 'Red Blood Cell Count', unit: '10^12/L', typical_range_low: 4.5, typical_range_high: 5.5 },
  { name: 'HGB', full_name: 'Hemoglobin', unit: 'g/dL', typical_range_low: 13.0, typical_range_high: 17.0 },
  { name: 'HCT', full_name: 'Hematocrit', unit: '%', typical_range_low: 40.0, typical_range_high: 52.0 },
  { name: 'MCV', full_name: 'Mean Corpuscular Volume', unit: 'fL', typical_range_low: 80.0, typical_range_high: 100.0 },
  { name: 'MCH', full_name: 'Mean Corpuscular Hemoglobin', unit: 'pg', typical_range_low: 27.0, typical_range_high: 33.0 },
  { name: 'MCHC', full_name: 'Mean Corpuscular Hemoglobin Concentration', unit: 'g/dL', typical_range_low: 32.0, typical_range_high: 36.0 },
  { name: 'PLT', full_name: 'Platelet Count', unit: '10^9/L', typical_range_low: 150.0, typical_range_high: 400.0 },
  { name: 'LYM', full_name: 'Lymphocytes (Absolute)', unit: '10^9/L', typical_range_low: 1.0, typical_range_high: 4.0 },
  { name: 'LYM%', full_name: 'Lymphocytes (Percentage)', unit: '%', typical_range_low: 20.0, typical_range_high: 40.0 },
  { name: 'MXD', full_name: 'Mid-Range Cells (Absolute)', unit: '10^9/L' },
  { name: 'MXD%', full_name: 'Mid-Range Cells (Percentage)', unit: '%' },
  { name: 'NEUT', full_name: 'Neutrophils (Absolute)', unit: '10^9/L', typical_range_low: 2.0, typical_range_high: 7.0 },
  { name: 'NEUT%', full_name: 'Neutrophils (Percentage)', unit: '%', typical_range_low: 40.0, typical_range_high: 70.0 },
  { name: 'RDW-SD', full_name: 'Red Cell Distribution Width (SD)', unit: 'fL' },
  { name: 'RDW-CV', full_name: 'Red Cell Distribution Width (CV)', unit: '%', typical_range_low: 11.5, typical_range_high: 14.5 },
  { name: 'PDW', full_name: 'Platelet Distribution Width', unit: '%' },
  { name: 'MPV', full_name: 'Mean Platelet Volume', unit: 'fL', typical_range_low: 7.5, typical_range_high: 11.5 },
  { name: 'PLCR', full_name: 'Platelet Large Cell Ratio', unit: '%' },
];

// Marker name normalization mapping
// Maps common variant names to our canonical marker names
export const MARKER_NAME_ALIASES: Record<string, CBCMarkerName> = {
  'LYM#': 'LYM',
  'LYMPH': 'LYM',
  'LYMPH#': 'LYM',
  'LYMPH%': 'LYM%',
  'MXD#': 'MXD',
  'MONO': 'MXD',
  'MONO#': 'MXD',
  'MONO%': 'MXD%',
  'NEUT#': 'NEUT',
  'NEUTRO': 'NEUT',
  'NEUTRO#': 'NEUT',
  'NEUTRO%': 'NEUT%',
  'P-LCR': 'PLCR',
  'PCT': 'HCT',
  'HEMOGLOBIN': 'HGB',
  'HB': 'HGB',
  'PLATELETS': 'PLT',
  'PLATELET': 'PLT',
};
