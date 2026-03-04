/**
 * Educational Content for Support Lenses
 *
 * Plain-English explanations for each lens.
 * General, non-condition-specific.
 * No medical claims, no outcomes.
 */

export interface LensEducation {
  lensId: string;
  whatItMeans: string;
  whyFoodsMatter: string[];
  emphasisReasons: Record<string, string>; // diagnosis key -> explanation
}

export const LENS_EDUCATION: LensEducation[] = [
  {
    lensId: 'inflammation_support',
    whatItMeans: 'This lens tracks foods often discussed for their anti-inflammatory properties. Inflammation is a natural immune response, and certain foods contain compounds like omega-3 fatty acids, polyphenols, and antioxidants that research suggests may help manage inflammatory processes in the body.',
    whyFoodsMatter: [
      'Fatty fish like salmon and sardines contain omega-3 fatty acids (EPA and DHA), which are often discussed in relation to inflammatory pathways.',
      'Leafy greens, berries, and colorful vegetables contain polyphenols and flavonoids that may support the body\'s natural anti-inflammatory responses.',
      'Nuts and seeds provide healthy fats and vitamin E, nutrients that appear in research on inflammation management.',
      'Turmeric, ginger, and other spices contain curcumin and gingerol, compounds studied for their potential anti-inflammatory effects.'
    ],
    emphasisReasons: {
      'MPN-ET': 'Essential Thrombocythemia involves inflammatory pathways that are frequently discussed in relation to MPN conditions. Foods with anti-inflammatory properties are commonly explored in this context.',
      'MPN-PV': 'Polycythemia Vera involves inflammatory processes that are commonly discussed in MPN care. Anti-inflammatory foods appear frequently in conversations about PV management.',
      'MPN-MF': 'Myelofibrosis involves inflammatory signaling that is often discussed in relation to disease progression. Anti-inflammatory foods are a common topic in MF support.',
      'post-chemotherapy': 'Post-chemotherapy recovery often involves managing inflammation from treatment. Anti-inflammatory foods are commonly discussed in recovery contexts.',
      'CML': 'Chronic inflammation is often discussed in CML contexts. Anti-inflammatory foods may be a supportive part of overall health management.',
      'general': 'Inflammation management is broadly relevant to health and wellbeing.'
    }
  },
  {
    lensId: 'defence_repair',
    whatItMeans: 'This lens tracks protein-rich foods and nutrients associated with cellular repair and immune function. Protein provides amino acids that are essential building blocks for cells, antibodies, and enzymes. These nutrients are fundamental to the body\'s maintenance and repair processes.',
    whyFoodsMatter: [
      'Lean meats, poultry, and fish provide complete proteins with all essential amino acids needed for cellular repair.',
      'Eggs contain high-quality protein along with vitamins and minerals that support cell function and immune health.',
      'Legumes like beans and lentils offer plant-based protein plus fiber and micronutrients that contribute to overall nutrition.',
      'Greek yogurt and cottage cheese combine protein with probiotics that may support gut health and immune function.',
      'Nuts, seeds, and quinoa provide protein along with healthy fats and minerals that support cellular processes.'
    ],
    emphasisReasons: {
      'post-chemotherapy': 'Post-treatment recovery often focuses on rebuilding and repair. Protein and repair-supporting nutrients are frequently emphasized during this phase.',
      'CML': 'Maintaining cellular health is commonly discussed in CML management. Protein and repair nutrients are often highlighted.',
      'MPN-ET': 'Supporting healthy cell function is relevant to ET management, though emphasis is moderate compared to other areas.',
      'MPN-PV': 'Cell repair is relevant to PV care, though other areas may be more prominently discussed.',
      'MPN-MF': 'Cellular repair is discussed in MF contexts, with moderate emphasis on protein and repair nutrients.',
      'general': 'Repair and maintenance are universally important for health and recovery.'
    }
  },
  {
    lensId: 'blood_cell_support',
    whatItMeans: 'This lens tracks nutrients often discussed in relation to blood cell production and health. Iron, folate, vitamin B12, and other nutrients play roles in how the body makes and maintains red blood cells, white blood cells, and platelets. These are commonly discussed in blood health contexts.',
    whyFoodsMatter: [
      'Red meat, poultry, and fish provide heme iron (easily absorbed) plus B12, both important for red blood cell production.',
      'Leafy greens like spinach and kale contain non-heme iron and folate, nutrients involved in blood cell formation.',
      'Fortified cereals and whole grains can provide iron, folate, and B vitamins that support blood health.',
      'Citrus fruits and bell peppers contain vitamin C, which helps the body absorb iron from plant sources.',
      'Eggs, dairy, and nutritional yeast provide B vitamins including B12 and riboflavin.'
    ],
    emphasisReasons: {
      'MPN-MF': 'Blood cell production is frequently discussed in myelofibrosis, where bone marrow function is affected. Nutrients supporting blood cells are commonly emphasized.',
      'CML': 'Blood cell health is a central topic in CML management. Nutrients supporting blood cells are often discussed.',
      'MPN-PV': 'Blood cell regulation is a key aspect of PV. Nutrients supporting healthy blood cells are commonly discussed.',
      'MPN-ET': 'Platelet and blood cell health are relevant to ET management, with moderate emphasis on supporting nutrients.',
      'post-chemotherapy': 'Blood count recovery is often discussed post-treatment. Nutrients supporting blood cells may be emphasized.',
      'general': 'Blood cell health is fundamental to overall wellbeing.'
    }
  },
  {
    lensId: 'micronutrient_signals',
    whatItMeans: 'This lens tracks foods rich in vitamins and minerals from whole food sources. Micronutrients like vitamins A, C, D, E, K, and minerals like zinc, selenium, and magnesium support countless body processes including immune function, energy production, and cellular health.',
    whyFoodsMatter: [
      'Colorful vegetables and fruits provide a spectrum of vitamins, antioxidants, and phytonutrients that support multiple body systems.',
      'Nuts and seeds offer vitamin E, magnesium, zinc, and selenium - minerals involved in immune and cellular function.',
      'Whole grains provide B vitamins, magnesium, and trace minerals that support energy metabolism.',
      'Dairy and fortified alternatives provide calcium, vitamin D, and phosphorus for bone health and cellular signaling.',
      'Mushrooms, fatty fish, and fortified foods provide vitamin D, which plays roles in immune function and cell growth.'
    ],
    emphasisReasons: {
      'MPN-MF': 'Micronutrient status is often discussed in MF, where nutrition becomes a focus. Vitamin and mineral intake is frequently emphasized.',
      'post-chemotherapy': 'Micronutrient replenishment is commonly discussed after treatment. Vitamins and minerals are often highlighted.',
      'general': 'Micronutrients are essential for all body functions and overall health.',
      'MPN-PV': 'Micronutrient balance is discussed in PV care as part of overall nutrition.',
      'MPN-ET': 'Vitamins and minerals are relevant to ET management as part of comprehensive nutrition.',
      'CML': 'Micronutrient status may be discussed in CML care as part of overall health maintenance.'
    }
  },
  {
    lensId: 'macronutrient_balance',
    whatItMeans: 'This lens tracks the presence of protein, carbohydrates, and fats in your meals. These three macronutrients provide energy and perform essential functions: protein builds and repairs, carbohydrates fuel activity and brain function, and fats support hormone production and nutrient absorption.',
    whyFoodsMatter: [
      'Protein from meats, fish, eggs, legumes, and dairy supports tissue repair, immune function, and muscle maintenance.',
      'Complex carbohydrates from whole grains, starchy vegetables, and fruits provide sustained energy and fiber.',
      'Healthy fats from fish, avocados, nuts, seeds, and olive oil support cell membranes and help absorb fat-soluble vitamins.',
      'Balanced meals that include all three macronutrients help maintain stable energy and support diverse body functions.',
      'The ratio and type of macronutrients can vary based on individual needs, activity levels, and health contexts.'
    ],
    emphasisReasons: {
      'post-chemotherapy': 'Macronutrient balance is often emphasized during recovery to support energy needs and rebuilding processes.',
      'general': 'Balanced macronutrient intake is foundational to nutrition for everyone.',
      'MPN-MF': 'Adequate macronutrient intake is discussed in MF care, particularly when maintaining energy and weight.',
      'MPN-ET': 'Macronutrient balance is relevant to overall nutrition in ET management.',
      'MPN-PV': 'Macronutrient patterns may be discussed as part of comprehensive nutrition in PV care.',
      'CML': 'Balanced macronutrients support overall health and are discussed as part of general wellness in CML.'
    }
  }
];

export function getEducationForLens(lensId: string): LensEducation | undefined {
  return LENS_EDUCATION.find(edu => edu.lensId === lensId);
}
