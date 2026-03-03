/*
  # Add event_category to appointments table

  1. Changes
    - Add `event_category` column to appointments table to distinguish:
      - 'investigation': Initial referrals, diagnostic appointments, routine follow-ups
      - 'diagnosis': Critical diagnosis discussions, results delivery
      - 'treatment': Treatment planning, therapy administration
      - 'administrative': General check-ins, paperwork
    - Defaults to 'investigation' for referral letters
  
  2. Security
    - No RLS changes needed (uses existing policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'event_category'
  ) THEN
    ALTER TABLE appointments 
    ADD COLUMN event_category text DEFAULT 'investigation'
    CHECK (event_category IN ('investigation', 'diagnosis', 'treatment', 'administrative'));
  END IF;
END $$;