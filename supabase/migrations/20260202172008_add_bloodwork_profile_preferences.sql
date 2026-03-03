/*
  # Add bloodwork profile preferences
  
  1. Changes
    - Add `bloodwork_sex` field to store user's biological sex for reference ranges
    - Add `bloodwork_age_group` field to store user's age group for reference ranges
    
  2. Purpose
    - Allow persistent storage of bloodwork profile selections
    - Avoid forcing users to re-enter sex and age group on every Trends visit
    - Enable accurate reference range calculations across sessions
    
  3. Notes
    - These fields are optional and only used for bloodwork reference ranges
    - Values persist across sessions and app reloads
    - Can be updated at any time by the user
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' AND column_name = 'bloodwork_sex'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN bloodwork_sex text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' AND column_name = 'bloodwork_age_group'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN bloodwork_age_group text;
  END IF;
END $$;
