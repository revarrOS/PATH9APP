/*
  # Add Nutrition Domain to Consultation Questions

  1. Changes
    - Update domain CHECK constraint to include 'nutrition'
    - Allows nutrition questions to be saved in consultation prep
  
  2. Security
    - No changes to RLS policies
    - Existing policies remain unchanged
*/

ALTER TABLE consultation_questions 
DROP CONSTRAINT IF EXISTS consultation_questions_domain_check;

ALTER TABLE consultation_questions
ADD CONSTRAINT consultation_questions_domain_check 
CHECK (domain IN ('bloodwork', 'condition', 'nutrition', 'general'));
