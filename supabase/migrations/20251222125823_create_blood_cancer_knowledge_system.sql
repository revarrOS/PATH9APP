/*
  # Blood Cancer Knowledge System

  ## Overview
  Two-layer knowledge system for blood cancer:
  - **Universal concepts** that apply across diagnoses (emotional, structural)
  - **Medical facts** that are diagnosis-specific (symptoms, treatments)

  ## New Tables

  ### `diagnosis_families`
  Groups of related diagnoses (e.g., "blood_cancer")

  ### `diagnosis_types`
  Reference data for all possible diagnoses (AML, CLL, etc.)
  Note: Different from `diagnoses` table which stores user-specific diagnoses

  ### `medical_facts`
  Diagnosis-specific medical information

  ### `canon_applicability`
  Links universal canon content to specific diagnoses

  ## Security
  All tables have RLS enabled with read access for authenticated users
*/

-- =====================================================
-- DIAGNOSIS FAMILIES (Reference Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS diagnosis_families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  active boolean DEFAULT true,
  launch_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- DIAGNOSIS TYPES (Reference Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS diagnosis_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES diagnosis_families(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  full_name text NOT NULL,
  common_name text NOT NULL,
  aliases text[] DEFAULT ARRAY[]::text[],
  active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- MEDICAL FACTS (Diagnosis-Specific Reference Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS medical_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_type_id uuid NOT NULL REFERENCES diagnosis_types(id) ON DELETE CASCADE,
  category text NOT NULL,
  fact_key text NOT NULL,
  fact_value jsonb NOT NULL,
  source text,
  confidence_level text DEFAULT 'high' CHECK (confidence_level IN ('high', 'medium', 'emerging', 'controversial')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(diagnosis_type_id, category, fact_key)
);

-- =====================================================
-- CANON APPLICABILITY
-- Links universal canon content to specific diagnoses
-- =====================================================
CREATE TABLE IF NOT EXISTS canon_applicability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canon_chunk_id uuid NOT NULL REFERENCES canon_chunks(id) ON DELETE CASCADE,
  diagnosis_type_id uuid REFERENCES diagnosis_types(id) ON DELETE CASCADE,
  diagnosis_family_id uuid REFERENCES diagnosis_families(id) ON DELETE CASCADE,
  adaptation_required boolean DEFAULT false,
  contraindications text[] DEFAULT ARRAY[]::text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  CHECK (diagnosis_type_id IS NOT NULL OR diagnosis_family_id IS NOT NULL)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_diagnosis_types_family ON diagnosis_types(family_id);
CREATE INDEX IF NOT EXISTS idx_diagnosis_types_code ON diagnosis_types(code);
CREATE INDEX IF NOT EXISTS idx_diagnosis_types_aliases ON diagnosis_types USING gin(aliases);

CREATE INDEX IF NOT EXISTS idx_medical_facts_diagnosis_type ON medical_facts(diagnosis_type_id);
CREATE INDEX IF NOT EXISTS idx_medical_facts_category ON medical_facts(category);
CREATE INDEX IF NOT EXISTS idx_medical_facts_key ON medical_facts(fact_key);

CREATE INDEX IF NOT EXISTS idx_canon_applicability_chunk ON canon_applicability(canon_chunk_id);
CREATE INDEX IF NOT EXISTS idx_canon_applicability_diagnosis_type ON canon_applicability(diagnosis_type_id);
CREATE INDEX IF NOT EXISTS idx_canon_applicability_family ON canon_applicability(diagnosis_family_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE diagnosis_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE canon_applicability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read diagnosis families"
  ON diagnosis_families FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Authenticated users can read diagnosis types"
  ON diagnosis_types FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Authenticated users can read medical facts"
  ON medical_facts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read canon applicability"
  ON canon_applicability FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage diagnosis families"
  ON diagnosis_families FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage diagnosis types"
  ON diagnosis_types FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage medical facts"
  ON medical_facts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage canon applicability"
  ON canon_applicability FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- SEED BLOOD CANCER TAXONOMY
-- =====================================================
INSERT INTO diagnosis_families (name, display_name, description, active)
VALUES (
  'blood_cancer',
  'Blood Cancer',
  'Cancers affecting blood, bone marrow, and lymphatic system',
  true
) ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
  v_family_id uuid;
BEGIN
  SELECT id INTO v_family_id FROM diagnosis_families WHERE name = 'blood_cancer';

  INSERT INTO diagnosis_types (family_id, code, full_name, common_name, aliases, active) VALUES
    -- Leukaemia
    (v_family_id, 'AML', 'Acute Myeloid Leukaemia', 'AML', ARRAY['Acute Myeloid Leukemia', 'ANLL'], true),
    (v_family_id, 'ALL', 'Acute Lymphoblastic Leukaemia', 'ALL', ARRAY['Acute Lymphoblastic Leukemia', 'Acute Lymphocytic Leukemia'], true),
    (v_family_id, 'CML', 'Chronic Myeloid Leukaemia', 'CML', ARRAY['Chronic Myeloid Leukemia', 'Chronic Myelogenous Leukemia'], true),
    (v_family_id, 'CLL', 'Chronic Lymphocytic Leukaemia', 'CLL', ARRAY['Chronic Lymphocytic Leukemia'], true),
    
    -- Lymphoma
    (v_family_id, 'HL', 'Hodgkin Lymphoma', 'Hodgkin Lymphoma', ARRAY['Hodgkin Disease', 'Hodgkins Lymphoma'], true),
    (v_family_id, 'NHL', 'Non-Hodgkin Lymphoma', 'Non-Hodgkin Lymphoma', ARRAY['Non-Hodgkins Lymphoma'], true),
    (v_family_id, 'DLBCL', 'Diffuse Large B-Cell Lymphoma', 'DLBCL', ARRAY['Diffuse Large B Cell Lymphoma'], true),
    (v_family_id, 'FL', 'Follicular Lymphoma', 'Follicular Lymphoma', ARRAY[]::text[], true),
    (v_family_id, 'MCL', 'Mantle Cell Lymphoma', 'Mantle Cell Lymphoma', ARRAY[]::text[], true),
    
    -- Myeloma
    (v_family_id, 'MM', 'Multiple Myeloma', 'Multiple Myeloma', ARRAY['Myeloma', 'Plasma Cell Myeloma'], true),
    (v_family_id, 'SMM', 'Smoldering Multiple Myeloma', 'Smoldering Myeloma', ARRAY['Smouldering Myeloma'], true),
    
    -- MDS/MPN
    (v_family_id, 'MDS', 'Myelodysplastic Syndromes', 'MDS', ARRAY['Myelodysplastic Syndrome'], true),
    (v_family_id, 'MPN', 'Myeloproliferative Neoplasms', 'MPN', ARRAY[]::text[], true)
  ON CONFLICT (code) DO NOTHING;
END $$;