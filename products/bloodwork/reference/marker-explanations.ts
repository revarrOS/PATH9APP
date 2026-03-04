export interface MarkerExplanation {
  name: string;
  explanation: string;
}

export const markerExplanations: Record<string, MarkerExplanation> = {
  WBC: {
    name: 'White Blood Cells',
    explanation: 'Cells that help fight infection and disease.',
  },
  RBC: {
    name: 'Red Blood Cells',
    explanation: 'Cells that carry oxygen throughout your body.',
  },
  HGB: {
    name: 'Hemoglobin',
    explanation: 'Protein in red blood cells that carries oxygen.',
  },
  HCT: {
    name: 'Hematocrit',
    explanation: 'Percentage of your blood made up of red blood cells.',
  },
  MCV: {
    name: 'Mean Corpuscular Volume',
    explanation: 'Average size of your red blood cells.',
  },
  MCH: {
    name: 'Mean Corpuscular Hemoglobin',
    explanation: 'Average amount of hemoglobin in each red blood cell.',
  },
  MCHC: {
    name: 'Mean Corpuscular Hemoglobin Concentration',
    explanation: 'Average concentration of hemoglobin in red blood cells.',
  },
  RDW: {
    name: 'Red Cell Distribution Width',
    explanation: 'Variation in the size of your red blood cells.',
  },
  PLT: {
    name: 'Platelets',
    explanation: 'Cells that help your blood clot.',
  },
  MPV: {
    name: 'Mean Platelet Volume',
    explanation: 'Average size of your platelets.',
  },
  NEUT: {
    name: 'Neutrophils',
    explanation: 'White blood cells that fight bacterial infections.',
  },
  LYMPH: {
    name: 'Lymphocytes',
    explanation: 'White blood cells that fight viral infections.',
  },
  MONO: {
    name: 'Monocytes',
    explanation: 'White blood cells that remove dead cells and fight infection.',
  },
  EOS: {
    name: 'Eosinophils',
    explanation: 'White blood cells involved in allergic reactions and parasites.',
  },
  BASO: {
    name: 'Basophils',
    explanation: 'White blood cells involved in allergic and inflammatory responses.',
  },
  ANC: {
    name: 'Absolute Neutrophil Count',
    explanation: 'Total number of neutrophils in your blood.',
  },
  ALC: {
    name: 'Absolute Lymphocyte Count',
    explanation: 'Total number of lymphocytes in your blood.',
  },
  AMC: {
    name: 'Absolute Monocyte Count',
    explanation: 'Total number of monocytes in your blood.',
  },
  AEC: {
    name: 'Absolute Eosinophil Count',
    explanation: 'Total number of eosinophils in your blood.',
  },
  ABC: {
    name: 'Absolute Basophil Count',
    explanation: 'Total number of basophils in your blood.',
  },
  RETIC: {
    name: 'Reticulocytes',
    explanation: 'Immature red blood cells that show bone marrow activity.',
  },
  ESR: {
    name: 'Erythrocyte Sedimentation Rate',
    explanation: 'Measure of inflammation in your body.',
  },
  CRP: {
    name: 'C-Reactive Protein',
    explanation: 'Protein that indicates inflammation in your body.',
  },
  FERRITIN: {
    name: 'Ferritin',
    explanation: 'Protein that stores iron in your body.',
  },
  B12: {
    name: 'Vitamin B12',
    explanation: 'Vitamin needed for red blood cell formation and nerve function.',
  },
  FOLATE: {
    name: 'Folate',
    explanation: 'Vitamin needed for red blood cell formation and cell growth.',
  },
  'VIT D': {
    name: 'Vitamin D',
    explanation: 'Vitamin that helps your body absorb calcium.',
  },
  TSH: {
    name: 'Thyroid Stimulating Hormone',
    explanation: 'Hormone that controls your thyroid gland activity.',
  },
  'FREE T4': {
    name: 'Free Thyroxine',
    explanation: 'Thyroid hormone that regulates metabolism.',
  },
  GLUCOSE: {
    name: 'Blood Glucose',
    explanation: 'Sugar level in your blood.',
  },
  HBA1C: {
    name: 'Hemoglobin A1C',
    explanation: 'Average blood sugar level over the past 2-3 months.',
  },
  CREATININE: {
    name: 'Creatinine',
    explanation: 'Waste product filtered by your kidneys.',
  },
  'EGFR': {
    name: 'Estimated Glomerular Filtration Rate',
    explanation: 'Measure of how well your kidneys are filtering waste.',
  },
  ALT: {
    name: 'Alanine Aminotransferase',
    explanation: 'Enzyme that indicates liver function.',
  },
  AST: {
    name: 'Aspartate Aminotransferase',
    explanation: 'Enzyme that indicates liver or muscle function.',
  },
  'ALK PHOS': {
    name: 'Alkaline Phosphatase',
    explanation: 'Enzyme that indicates liver or bone function.',
  },
  BILIRUBIN: {
    name: 'Bilirubin',
    explanation: 'Breakdown product of red blood cells processed by the liver.',
  },
  ALBUMIN: {
    name: 'Albumin',
    explanation: 'Protein made by the liver that carries substances in blood.',
  },
  'TOTAL PROTEIN': {
    name: 'Total Protein',
    explanation: 'All proteins in your blood, including albumin and antibodies.',
  },
  CALCIUM: {
    name: 'Calcium',
    explanation: 'Mineral important for bones, muscles, and nerves.',
  },
  SODIUM: {
    name: 'Sodium',
    explanation: 'Mineral that helps control fluid balance.',
  },
  POTASSIUM: {
    name: 'Potassium',
    explanation: 'Mineral important for heart and muscle function.',
  },
  CHLORIDE: {
    name: 'Chloride',
    explanation: 'Mineral that helps maintain fluid balance.',
  },
  MAGNESIUM: {
    name: 'Magnesium',
    explanation: 'Mineral important for muscle, nerve, and bone health.',
  },
  PHOSPHATE: {
    name: 'Phosphate',
    explanation: 'Mineral important for bone health and energy production.',
  },
  UREA: {
    name: 'Blood Urea Nitrogen',
    explanation: 'Waste product filtered by your kidneys.',
  },
  LDH: {
    name: 'Lactate Dehydrogenase',
    explanation: 'Enzyme found in many tissues that can indicate cell damage.',
  },
  'URIC ACID': {
    name: 'Uric Acid',
    explanation: 'Waste product from breaking down purines in food.',
  },
  CHOLESTEROL: {
    name: 'Total Cholesterol',
    explanation: 'Fat-like substance in your blood.',
  },
  HDL: {
    name: 'High-Density Lipoprotein',
    explanation: 'Cholesterol that helps remove other cholesterol from blood.',
  },
  LDL: {
    name: 'Low-Density Lipoprotein',
    explanation: 'Cholesterol that can build up in arteries.',
  },
  TRIGLYCERIDES: {
    name: 'Triglycerides',
    explanation: 'Type of fat found in your blood.',
  },
  IGG: {
    name: 'Immunoglobulin G',
    explanation: 'Antibody that helps fight bacterial and viral infections.',
  },
  IGA: {
    name: 'Immunoglobulin A',
    explanation: 'Antibody that protects against infections in mucous membranes.',
  },
  IGM: {
    name: 'Immunoglobulin M',
    explanation: 'Antibody that appears first when fighting new infections.',
  },
};

export function getMarkerExplanation(markerName: string): MarkerExplanation | null {
  const normalized = markerName.toUpperCase().trim();
  return markerExplanations[normalized] || null;
}
