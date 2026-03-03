-- Seed Script: Medical Journey Test Data
-- Purpose: Create sample data to test the medical journey visualization
-- Usage: Run this in Supabase SQL Editor after replacing USER_ID with actual user ID

-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with actual user UUID from auth.users or profiles table

-- 1. Create a diagnosis
INSERT INTO diagnoses (
  user_id,
  diagnosis_name,
  diagnosis_date,
  stage_or_severity,
  icd_code,
  plain_english_summary,
  raw_pathology_text
) VALUES (
  'YOUR_USER_ID_HERE'::uuid,
  'Invasive Ductal Carcinoma',
  CURRENT_DATE - INTERVAL '7 days',
  'Stage IIA (T2N0M0)',
  'C50.9',
  'You have a type of breast cancer that started in the milk ducts and has grown into nearby breast tissue. The cancer is about 2-5 cm in size and hasn''t spread to lymph nodes or other parts of your body. Your tumor responds to hormones (estrogen and progesterone), which is actually good news—it means hormone therapy can help. It''s not growing extremely fast (Grade 2 is moderate). The growth rate (Ki-67) shows about 20% of cells are actively dividing, which is moderate.',
  'Invasive ductal carcinoma, Stage IIA (T2N0M0), ER+/PR+/HER2-, Grade 2, Ki-67 20%'
) ON CONFLICT DO NOTHING;

-- 2. Create upcoming appointments
INSERT INTO appointments (
  user_id,
  appointment_datetime,
  provider_name,
  provider_role,
  appointment_type,
  location,
  preparation_notes,
  questions_to_ask,
  status
) VALUES
(
  'YOUR_USER_ID_HERE'::uuid,
  CURRENT_DATE + INTERVAL '3 days' + INTERVAL '14 hours',
  'Dr. Sarah Chen',
  'medical oncologist',
  'consultation',
  'City Hospital - Cancer Center',
  'Bring all previous test results, insurance card, and a family member for support',
  '["What are my treatment options?", "What''s the treatment timeline?", "Will I need chemotherapy, radiation, or both?", "What are the side effects I should watch for?", "What''s my prognosis?"]'::jsonb,
  'scheduled'
),
(
  'YOUR_USER_ID_HERE'::uuid,
  CURRENT_DATE + INTERVAL '10 days' + INTERVAL '10 hours',
  'Dr. Michael Rodriguez',
  'surgical oncologist',
  'consultation',
  'City Hospital - Surgical Wing',
  'Come prepared to discuss surgical options',
  '["What type of surgery do you recommend?", "How long is the recovery period?", "Will I need reconstruction?", "What are the risks?", "What happens after surgery?"]'::jsonb,
  'scheduled'
),
(
  'YOUR_USER_ID_HERE'::uuid,
  CURRENT_DATE + INTERVAL '5 days' + INTERVAL '9 hours',
  'City Imaging Center',
  'radiologist',
  'imaging',
  'City Imaging Center',
  'Wear comfortable clothing without metal. Do not eat 4 hours before appointment.',
  '["When will results be available?", "What type of scan is this?", "How long will it take?"]'::jsonb,
  'scheduled'
) ON CONFLICT DO NOTHING;

-- 3. Create treatment timeline
INSERT INTO treatment_timeline (
  user_id,
  diagnosis_id,
  timeline_phase,
  phase_order,
  estimated_start_date,
  estimated_duration_weeks,
  description,
  key_milestones,
  status
) VALUES
(
  'YOUR_USER_ID_HERE'::uuid,
  (SELECT id FROM diagnoses WHERE user_id = 'YOUR_USER_ID_HERE'::uuid LIMIT 1),
  'Diagnosis & Testing',
  1,
  CURRENT_DATE - INTERVAL '7 days',
  2,
  'Additional tests to understand your cancer fully. May include imaging scans, biopsies, and blood work.',
  '["Complete imaging (MRI, CT, or PET scan)", "Genetic testing consultation", "Meet with surgical oncologist", "Meet with medical oncologist"]'::jsonb,
  'in_progress'
),
(
  'YOUR_USER_ID_HERE'::uuid,
  (SELECT id FROM diagnoses WHERE user_id = 'YOUR_USER_ID_HERE'::uuid LIMIT 1),
  'Surgery',
  2,
  CURRENT_DATE + INTERVAL '2 weeks',
  4,
  'Surgical removal of the tumor. May be lumpectomy (breast-conserving) or mastectomy (full breast removal).',
  '["Pre-surgery consultation and planning", "Surgery day", "Post-surgery pathology results", "Surgical recovery (1-2 weeks)"]'::jsonb,
  'upcoming'
),
(
  'YOUR_USER_ID_HERE'::uuid,
  (SELECT id FROM diagnoses WHERE user_id = 'YOUR_USER_ID_HERE'::uuid LIMIT 1),
  'Chemotherapy',
  3,
  CURRENT_DATE + INTERVAL '6 weeks',
  16,
  'Systemic treatment to kill cancer cells throughout your body. Typically given in cycles every 2-3 weeks.',
  '["Port placement (if needed)", "First infusion", "Mid-treatment scans", "Final infusion"]'::jsonb,
  'upcoming'
),
(
  'YOUR_USER_ID_HERE'::uuid,
  (SELECT id FROM diagnoses WHERE user_id = 'YOUR_USER_ID_HERE'::uuid LIMIT 1),
  'Radiation Therapy',
  4,
  CURRENT_DATE + INTERVAL '22 weeks',
  6,
  'Targeted radiation to kill any remaining cancer cells in the breast area. Usually 5 days/week.',
  '["Radiation planning session (mapping)", "First treatment", "Mid-treatment check-in", "Final treatment"]'::jsonb,
  'upcoming'
),
(
  'YOUR_USER_ID_HERE'::uuid,
  (SELECT id FROM diagnoses WHERE user_id = 'YOUR_USER_ID_HERE'::uuid LIMIT 1),
  'Hormone Therapy',
  5,
  CURRENT_DATE + INTERVAL '28 weeks',
  260,
  'Daily medication for 5-10 years to block hormones that fuel cancer growth.',
  '["Start daily medication", "3-month follow-up", "6-month follow-up", "Annual check-ins"]'::jsonb,
  'upcoming'
),
(
  'YOUR_USER_ID_HERE'::uuid,
  (SELECT id FROM diagnoses WHERE user_id = 'YOUR_USER_ID_HERE'::uuid LIMIT 1),
  'Survivorship & Monitoring',
  6,
  CURRENT_DATE + INTERVAL '288 weeks',
  520,
  'Regular monitoring for recurrence. Focus shifts to long-term health and wellness.',
  '["3-month check-ups (first 2 years)", "6-month check-ups (years 3-5)", "Annual mammograms", "Return to normal life"]'::jsonb,
  'upcoming'
) ON CONFLICT DO NOTHING;

-- 4. Create emotional check-ins (showing improvement over time)
INSERT INTO emotional_checkins (
  user_id,
  checkin_time,
  anxiety_level,
  overwhelm_level,
  hope_level,
  physical_wellbeing,
  detected_from
) VALUES
(
  'YOUR_USER_ID_HERE'::uuid,
  CURRENT_DATE - INTERVAL '7 days',
  9,
  10,
  3,
  4,
  'initial_diagnosis_conversation'
),
(
  'YOUR_USER_ID_HERE'::uuid,
  CURRENT_DATE - INTERVAL '5 days',
  8,
  9,
  4,
  5,
  'message_analysis'
),
(
  'YOUR_USER_ID_HERE'::uuid,
  CURRENT_DATE - INTERVAL '3 days',
  7,
  7,
  5,
  5,
  'message_analysis'
),
(
  'YOUR_USER_ID_HERE'::uuid,
  CURRENT_DATE - INTERVAL '1 day',
  6,
  6,
  6,
  6,
  'message_analysis'
) ON CONFLICT DO NOTHING;

-- 5. Add provider to care team
INSERT INTO care_team (
  user_id,
  provider_name,
  role,
  specialty,
  contact_info,
  first_seen_date
) VALUES
(
  'YOUR_USER_ID_HERE'::uuid,
  'Dr. Sarah Chen',
  'medical oncologist',
  'Breast Cancer Oncology',
  '{"phone": "555-0123", "email": "schen@cityhospital.org"}'::jsonb,
  CURRENT_DATE + INTERVAL '3 days'
) ON CONFLICT DO NOTHING;

-- Query to verify data was created
SELECT
  'Diagnosis' as data_type,
  COUNT(*) as count
FROM diagnoses
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid

UNION ALL

SELECT
  'Appointments',
  COUNT(*)
FROM appointments
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid

UNION ALL

SELECT
  'Timeline Phases',
  COUNT(*)
FROM treatment_timeline
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid

UNION ALL

SELECT
  'Emotional Check-ins',
  COUNT(*)
FROM emotional_checkins
WHERE user_id = 'YOUR_USER_ID_HERE'::uuid;
