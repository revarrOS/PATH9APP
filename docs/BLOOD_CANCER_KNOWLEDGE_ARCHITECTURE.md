# Blood Cancer Knowledge Architecture

## The Problem You Solved

You have one amazing document about leukaemia that explains "why watch and wait" - and you have similar documents for lymphoma, myeloma, etc.

**The challenge:** The CONCEPT is universal ("why wait to treat"), but the MEDICAL FACTS are different (CLL symptoms vs. AML symptoms).

**The solution:** Two-layer knowledge system.

---

## The Two-Layer System

### Layer 1: Universal Canon (Structural/Emotional)
**What it contains:**
- Emotional concepts that apply to ALL blood cancers
- Structural understanding (why doctors do things)
- Decision-making frameworks
- Questions to ask
- Coping strategies

**Example:**
```
CONCEPT: "Why Watch and Wait Feels Wrong But Might Be Right"

This concept applies to:
- CLL (often watch and wait)
- Follicular Lymphoma (often watch and wait)
- Smoldering Myeloma (often watch and wait)
- Early-stage Hodgkin Lymphoma (sometimes watch and wait)

But NOT to:
- AML (almost never watch and wait)
- DLBCL (rarely watch and wait)
```

### Layer 2: Medical Facts (Diagnosis-Specific)
**What it contains:**
- Symptoms for each diagnosis
- Treatment protocols
- Test types
- Timelines
- Prognosis factors

**Example:**
```json
{
  "diagnosis_type": "CLL",
  "category": "symptoms",
  "facts": {
    "common_presentation": "Often no symptoms at diagnosis",
    "typical_symptoms": ["fatigue", "swollen_lymph_nodes", "night_sweats"],
    "diagnostic_tests": ["CBC", "flow_cytometry", "FISH"],
    "watch_and_wait_criteria": "Rai stage 0-II with no symptoms"
  }
}
```

---

## Database Structure

### Tables Created

#### `diagnosis_families`
Top-level grouping (only one for now: `blood_cancer`)

```sql
SELECT * FROM diagnosis_families;
-- Returns: blood_cancer
```

#### `diagnosis_types`
All specific blood cancers (13 types seeded)

```sql
SELECT code, full_name, common_name FROM diagnosis_types;
-- AML | Acute Myeloid Leukaemia | AML
-- CLL | Chronic Lymphocytic Leukaemia | CLL
-- HL  | Hodgkin Lymphoma | Hodgkin Lymphoma
-- ... etc
```

#### `medical_facts`
Diagnosis-specific medical information

```sql
-- Example structure (you'll populate this)
INSERT INTO medical_facts (
  diagnosis_type_id,
  category,
  fact_key,
  fact_value,
  source,
  confidence_level
) VALUES (
  (SELECT id FROM diagnosis_types WHERE code = 'CLL'),
  'watch_and_wait',
  'typical_duration',
  '{"average_months": 24, "range": "6 months to years", "triggers_for_treatment": ["progression", "symptoms", "cytopenias"]}'::jsonb,
  'NCCN Guidelines 2024',
  'high'
);
```

#### `canon_applicability`
Links universal content to specific diagnoses

```sql
-- Example: Mark a canon chunk as applying to multiple diagnoses
INSERT INTO canon_applicability (
  canon_chunk_id,
  diagnosis_type_id,
  adaptation_required,
  notes
) VALUES
  -- "Why watch and wait" applies to CLL
  ('chunk-id-1', (SELECT id FROM diagnosis_types WHERE code = 'CLL'), true, 'Emphasize long observation periods'),
  -- Same concept applies to FL
  ('chunk-id-1', (SELECT id FROM diagnosis_types WHERE code = 'FL'), true, 'Mention "watchful waiting" term'),
  -- But NOT to AML (no row = not applicable)
  ...
```

---

## How Gemma Uses This System

### Step 1: Identify User's Diagnosis

```typescript
// When user says "I have CLL"
const userDiagnosisType = await supabase
  .from('diagnosis_types')
  .select('id, code, full_name')
  .or(`code.eq.CLL,aliases.cs.{CLL}`)
  .single();

// Store in user profile
await supabase
  .from('diagnoses')
  .insert({
    user_id: userId,
    diagnosis_name: userDiagnosisType.full_name,
    // ... other fields
  });
```

### Step 2: Retrieve Universal Canon

```typescript
// User asks: "Why aren't they treating me yet?"
// Gemma retrieves applicable canon chunks

const applicableContent = await supabase
  .from('canon_chunks')
  .select(`
    *,
    applicability:canon_applicability!inner(
      adaptation_required,
      notes
    )
  `)
  .eq('canon_applicability.diagnosis_type_id', userDiagnosisType.id)
  .contains('tags', ['watch_and_wait', 'treatment_urgency']);
```

### Step 3: Retrieve Medical Facts

```typescript
// Get CLL-specific facts to adapt the canon
const medicalFacts = await supabase
  .from('medical_facts')
  .select('*')
  .eq('diagnosis_type_id', userDiagnosisType.id)
  .in('category', ['watch_and_wait', 'symptoms', 'treatment_triggers']);
```

### Step 4: Assemble Prompt

```typescript
const prompt = `
You are Gemma, a guide for people with blood cancer.

USER CONTEXT:
- Diagnosis: ${userDiagnosisType.full_name} (${userDiagnosisType.code})
- Question: "Why aren't they treating me yet?"

UNIVERSAL GUIDANCE:
${applicableContent.content}
// ^ Your amazing leukaemia document content

MEDICAL FACTS (${userDiagnosisType.code}-specific):
${JSON.stringify(medicalFacts, null, 2)}

INSTRUCTIONS:
1. Use the universal guidance as your framework
2. Adapt it with the specific medical facts for ${userDiagnosisType.code}
3. Be medically precise about ${userDiagnosisType.code}
4. Maintain the emotional intelligence of the universal guidance
`;
```

### Step 5: Gemma Responds

**User with CLL:**
> "I know it feels urgent - you have cancer, and every instinct says 'treat it now.' But with CLL, here's what's happening behind the scenes: Your doctors are monitoring your specific markers (like your lymphocyte count and lymph node size). CLL often moves slowly, and research shows that treating too early doesn't improve outcomes - but it does expose you to side effects you don't need yet..."

**User with Follicular Lymphoma:**
> "I know it feels urgent - you have cancer, and every instinct says 'treat it now.' But with Follicular Lymphoma, here's what's happening behind the scenes: Your doctors are monitoring your disease burden and symptoms. FL is often slow-growing, and 'watchful waiting' is a standard approach. Studies show that starting treatment before you have symptoms doesn't make you live longer..."

**User with AML (canon chunk NOT applicable):**
> "I understand the urgency feels overwhelming right now. With AML, treatment typically does need to start quickly - and your team is likely already moving fast. Here's why: AML is an acute leukemia, meaning it progresses rapidly..."

---

## Content Creation Strategy

### What You'll Do

1. **Take your existing leukaemia document**
2. **Tag it in the canon_chunks table** with:
   ```sql
   tags = [
     'newly_diagnosed',
     'treatment_urgency',
     'watch_and_wait',
     'acute_vs_chronic',
     'behind_the_scenes_testing'
   ]
   ```

3. **Mark which diagnoses it applies to**:
   ```sql
   -- Applies to CLL (with adaptation)
   INSERT INTO canon_applicability VALUES (
     chunk_id,
     (SELECT id FROM diagnosis_types WHERE code = 'CLL'),
     NULL, -- not family-wide
     true, -- adaptation_required
     ARRAY[]::text[], -- no contraindications
     'Emphasize slow progression, watch and wait is standard'
   );

   -- Applies to FL (with adaptation)
   INSERT INTO canon_applicability VALUES (
     chunk_id,
     (SELECT id FROM diagnosis_types WHERE code = 'FL'),
     NULL,
     true,
     ARRAY[]::text[],
     'Use "watchful waiting" terminology, mention grade'
   );

   -- Does NOT apply to AML (no row)
   -- Does NOT apply to DLBCL (no row)
   ```

4. **Add medical facts for each diagnosis**:
   ```sql
   -- For CLL
   INSERT INTO medical_facts VALUES
     (cll_id, 'watch_and_wait', 'common', '{"applicable": true, "typical_duration_months": 24}'::jsonb, ...),
     (cll_id, 'symptoms', 'presentation', '{"typical": "asymptomatic at diagnosis"}'::jsonb, ...),
     (cll_id, 'treatment_triggers', 'criteria', '{"triggers": ["progression", "symptoms", "cytopenias"]}'::jsonb, ...);

   -- For AML
   INSERT INTO medical_facts VALUES
     (aml_id, 'watch_and_wait', 'common', '{"applicable": false, "reason": "requires urgent treatment"}'::jsonb, ...),
     (aml_id, 'symptoms', 'presentation', '{"typical": "acute onset, severe"}'::jsonb, ...),
     (aml_id, 'treatment_timeline', 'urgency', '{"typical_start_days": 1-7}'::jsonb, ...);
   ```

---

## Example Query: "Show me everything for CLL"

```sql
-- Get the diagnosis type
WITH cll AS (
  SELECT id, code, full_name
  FROM diagnosis_types
  WHERE code = 'CLL'
)

-- Get applicable canon
SELECT
  cc.content AS universal_guidance,
  ca.adaptation_required,
  ca.notes AS adaptation_notes,

  -- Get relevant medical facts
  (
    SELECT jsonb_object_agg(category, facts)
    FROM (
      SELECT
        category,
        jsonb_object_agg(fact_key, fact_value) AS facts
      FROM medical_facts
      WHERE diagnosis_type_id = cll.id
      GROUP BY category
    ) facts_grouped
  ) AS medical_facts

FROM canon_chunks cc
INNER JOIN canon_applicability ca ON ca.canon_chunk_id = cc.id
CROSS JOIN cll
WHERE ca.diagnosis_type_id = cll.id;
```

---

## Expansion Path

### Phase 1: Blood Cancer (Current)
- 13 diagnosis types seeded
- Add medical facts for each
- Tag your existing documents
- Gemma is smart about blood cancer

### Phase 2: Solid Tumors
```sql
INSERT INTO diagnosis_families VALUES ('solid_tumors', ...);
INSERT INTO diagnosis_types VALUES
  ('BRCA', 'Breast Cancer', ...),
  ('NSCLC', 'Non-Small Cell Lung Cancer', ...);
```

### Phase 3: Autoimmune
```sql
INSERT INTO diagnosis_families VALUES ('autoimmune', ...);
INSERT INTO diagnosis_types VALUES
  ('MS', 'Multiple Sclerosis', ...),
  ('RA', 'Rheumatoid Arthritis', ...);
```

**The system stays the same. Just new content.**

---

## Next Steps

1. I can help you create a script to populate `medical_facts` for your 13 blood cancers
2. We can tag your existing leukaemia document and link it to applicable diagnoses
3. We can update Gemma's prompts to use this two-layer system
4. We can build UI that shows users content relevant to THEIR diagnosis

**Want to start with step 1 (medical facts schema) or step 2 (tagging your existing document)?**
