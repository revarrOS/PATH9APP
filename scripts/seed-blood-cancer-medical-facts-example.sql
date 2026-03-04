/*
  Example: Populating Medical Facts for CLL (Chronic Lymphocytic Leukaemia)

  This shows the pattern for ONE diagnosis.
  You'll repeat this for all 13 blood cancer types.

  Categories to cover for each diagnosis:
  - presentation (how it typically shows up)
  - symptoms (what patients experience)
  - watch_and_wait (if applicable)
  - treatment_approach (overview)
  - treatment_triggers (when to start)
  - diagnostic_tests (what tests confirm it)
  - prognosis_factors (what affects outlook)
  - timeline (typical journey arc)
*/

-- Get the CLL diagnosis type ID
DO $$
DECLARE
  v_cll_id uuid;
BEGIN
  SELECT id INTO v_cll_id FROM diagnosis_types WHERE code = 'CLL';

  -- ==================================================
  -- PRESENTATION
  -- ==================================================
  INSERT INTO medical_facts (diagnosis_type_id, category, fact_key, fact_value, source, confidence_level)
  VALUES
    (v_cll_id, 'presentation', 'typical_discovery', '{
      "context": "Often discovered incidentally during routine bloodwork",
      "common_scenarios": [
        "Annual physical exam with CBC",
        "Pre-surgical bloodwork",
        "Investigation of fatigue"
      ],
      "symptomatic_at_diagnosis": "30-40% of patients",
      "asymptomatic_at_diagnosis": "60-70% of patients"
    }'::jsonb, 'Uptodate 2024', 'high');

  -- ==================================================
  -- SYMPTOMS
  -- ==================================================
  INSERT INTO medical_facts (diagnosis_type_id, category, fact_key, fact_value, source, confidence_level)
  VALUES
    (v_cll_id, 'symptoms', 'common_symptoms', '{
      "early_stage": [
        "Often none",
        "Mild fatigue"
      ],
      "progressive_disease": [
        "Enlarged lymph nodes (neck, armpits, groin)",
        "Fatigue and weakness",
        "Night sweats",
        "Unintentional weight loss",
        "Frequent infections",
        "Feeling full quickly (enlarged spleen)"
      ],
      "advanced_disease": [
        "Severe anemia (low red blood cells)",
        "Thrombocytopenia (low platelets)",
        "Neutropenia (low white blood cells)"
      ]
    }'::jsonb, 'NCCN Guidelines 2024', 'high');

  -- ==================================================
  -- WATCH AND WAIT
  -- ==================================================
  INSERT INTO medical_facts (diagnosis_type_id, category, fact_key, fact_value, source, confidence_level)
  VALUES
    (v_cll_id, 'watch_and_wait', 'is_standard', '{
      "applicable": true,
      "medical_term": "active surveillance",
      "percentage_of_patients": "70-80% at diagnosis",
      "median_duration_months": 24,
      "range": "6 months to many years",
      "rationale": "Early treatment does not improve survival. Waiting until symptoms or progression preserves quality of life.",
      "monitoring_frequency": {
        "early_stage": "Every 3-6 months",
        "stable_disease": "Every 6 months"
      }
    }'::jsonb, 'NCCN Guidelines 2024', 'high');

  INSERT INTO medical_facts (diagnosis_type_id, category, fact_key, fact_value, source, confidence_level)
  VALUES
    (v_cll_id, 'watch_and_wait', 'what_doctors_monitor', '{
      "blood_counts": {
        "lymphocyte_count": "Absolute lymphocyte count trend",
        "hemoglobin": "Watching for anemia",
        "platelets": "Watching for thrombocytopenia"
      },
      "physical_exam": {
        "lymph_nodes": "Size and locations",
        "spleen": "Enlargement",
        "liver": "Enlargement"
      },
      "symptoms": [
        "Fevers without infection",
        "Night sweats",
        "Unintentional weight loss",
        "Increasing fatigue"
      ],
      "doubling_time": "Lymphocyte doubling time < 6 months suggests more active disease"
    }'::jsonb, 'Clinical Practice', 'high');

  -- ==================================================
  -- TREATMENT TRIGGERS
  -- ==================================================
  INSERT INTO medical_facts (diagnosis_type_id, category, fact_key, fact_value, source, confidence_level)
  VALUES
    (v_cll_id, 'treatment_triggers', 'when_to_treat', '{
      "criteria": [
        "Progressive bone marrow failure (worsening anemia or thrombocytopenia)",
        "Massive or progressive lymphadenopathy",
        "Massive or progressive splenomegaly",
        "Progressive lymphocytosis (>50% increase over 2 months)",
        "Constitutional symptoms (fever, night sweats, weight loss >10% in 6 months)",
        "Autoimmune complications not responsive to steroids",
        "Recurrent infections"
      ],
      "note": "Need at least ONE of these criteria to start treatment"
    }'::jsonb, 'iwCLL Guidelines', 'high');

  -- ==================================================
  -- TREATMENT APPROACH
  -- ==================================================
  INSERT INTO medical_facts (diagnosis_type_id, category, fact_key, fact_value, source, confidence_level)
  VALUES
    (v_cll_id, 'treatment_approach', 'first_line', '{
      "goal": "Control disease, not cure (for most patients)",
      "treatment_types": {
        "targeted_therapy": {
          "examples": ["Venetoclax + Obinutuzumab", "Acalabrutinib", "Ibrutinib"],
          "description": "Pills taken daily, generally well-tolerated",
          "duration": "Fixed duration (1-2 years) or continuous"
        },
        "chemoimmunotherapy": {
          "examples": ["FCR (Fludarabine, Cyclophosphamide, Rituximab)"],
          "description": "Used in specific patients, especially younger fit patients without TP53 issues",
          "duration": "6 cycles (6 months)"
        }
      },
      "treatment_selection": "Based on age, fitness, genetic markers (TP53, IGHV), and patient preference"
    }'::jsonb, 'NCCN Guidelines 2024', 'high');

  -- ==================================================
  -- DIAGNOSTIC TESTS
  -- ==================================================
  INSERT INTO medical_facts (diagnosis_type_id, category, fact_key, fact_value, source, confidence_level)
  VALUES
    (v_cll_id, 'diagnostic_tests', 'required_tests', '{
      "initial_diagnosis": {
        "CBC_with_differential": "Shows elevated lymphocytes (>5,000/µL for >3 months)",
        "flow_cytometry": "Confirms CLL cell markers (CD5+, CD23+, low CD20)",
        "peripheral_blood_smear": "Shows characteristic small mature lymphocytes"
      },
      "prognostic_tests": {
        "FISH_testing": "Looks for chromosomal abnormalities (del17p, del11q, trisomy 12, del13q)",
        "TP53_mutation": "Important for treatment selection",
        "IGHV_mutation_status": "Mutated = better prognosis"
      },
      "staging_tests": {
        "physical_exam": "Lymph node and organ assessment",
        "CT_scans": "Not always needed, reserved for specific situations"
      }
    }'::jsonb, 'Clinical Practice', 'high');

  -- ==================================================
  -- PROGNOSIS FACTORS
  -- ==================================================
  INSERT INTO medical_facts (diagnosis_type_id, category, fact_key, fact_value, source, confidence_level)
  VALUES
    (v_cll_id, 'prognosis_factors', 'favorable_vs_unfavorable', '{
      "favorable": {
        "del13q_only": "Best prognosis",
        "mutated_IGHV": "Slower progression",
        "early_stage": "Rai 0-I, Binet A"
      },
      "unfavorable": {
        "del17p_or_TP53": "Requires targeted therapy",
        "del11q": "May need earlier treatment",
        "unmutated_IGHV": "More aggressive disease",
        "high_beta2_microglobulin": "Associated with worse outcome"
      },
      "note": "CLL is highly variable. Some patients never need treatment. Others require multiple lines of therapy."
    }'::jsonb, 'Research Literature', 'high');

  -- ==================================================
  -- TIMELINE
  -- ==================================================
  INSERT INTO medical_facts (diagnosis_type_id, category, fact_key, fact_value, source, confidence_level)
  VALUES
    (v_cll_id, 'timeline', 'typical_journey', '{
      "diagnosis": {
        "timeframe": "Day 0",
        "activities": "Blood tests, flow cytometry, possible FISH/genetics"
      },
      "initial_period": {
        "timeframe": "Weeks 1-4",
        "activities": "Staging, prognostic testing, care team establishment, education"
      },
      "watch_and_wait": {
        "timeframe": "Months to years",
        "activities": "Regular monitoring every 3-6 months",
        "note": "Most patients start here"
      },
      "treatment_initiation": {
        "timeframe": "When criteria met",
        "activities": "Treatment selection, baseline tests, treatment start"
      },
      "active_treatment": {
        "timeframe": "6-24 months (depending on regimen)",
        "activities": "Regular visits, monitoring for response and side effects"
      },
      "remission_monitoring": {
        "timeframe": "Post-treatment",
        "activities": "Regular follow-up, watching for relapse"
      }
    }'::jsonb, 'Clinical Practice', 'high');

END $$;

/*
  ==========================================================================
  PATTERN TO REPEAT FOR OTHER DIAGNOSES
  ==========================================================================

  For each of your 13 blood cancers, you'll create similar entries:

  1. AML (Acute Myeloid Leukaemia)
     - presentation: "Acute onset, requires urgent treatment"
     - watch_and_wait: '{"applicable": false, "reason": "Requires immediate treatment"}'
     - treatment_triggers: "Diagnosis = treatment trigger"
     - timeline: Much more compressed

  2. NHL (Non-Hodgkin Lymphoma)
     - presentation: "Varies by subtype"
     - watch_and_wait: "Depends on subtype and stage"
     - Include multiple subtypes if needed

  3. MM (Multiple Myeloma)
     - presentation: "CRAB criteria or bone lesions"
     - watch_and_wait: "Smoldering myeloma may watch and wait"
     - treatment_approach: "Triplet therapy is standard"

  ... etc for all 13 types

  ==========================================================================
  SOURCES TO REFERENCE
  ==========================================================================

  - NCCN Guidelines (freely available)
  - UpToDate (if you have access)
  - Patient advocacy organizations (LLS, Lymphoma Action, etc.)
  - Your existing documents (!)
  - Reputable cancer center websites (Mayo, MD Anderson, etc.)
*/
