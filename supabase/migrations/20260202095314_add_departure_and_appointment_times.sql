/*
  # Add Departure Time and Appointment Time to Bloodwork Appointments

  ## Purpose
  Enhance appointment scheduling by separating departure time from appointment time,
  allowing users to track both when they need to leave and when the appointment starts.

  ## Changes Made

  ### `bloodwork_appointments` table updates
  - Add `departure_time` (timestamptz, nullable) - When user needs to leave
  - Add `appointment_time` (timestamptz, not null) - Actual appointment start time
  - Migrate existing `appointment_datetime` data to `appointment_time`
  - Keep `appointment_datetime` temporarily for backward compatibility

  ## Migration Strategy
  1. Add new columns
  2. Copy data from appointment_datetime to appointment_time
  3. Add constraint ensuring departure_time <= appointment_time

  ## Backward Compatibility
  - Existing appointment_datetime column preserved
  - New columns added without breaking existing data
*/

-- Add new columns
DO $$
BEGIN
  -- Add departure_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bloodwork_appointments' AND column_name = 'departure_time'
  ) THEN
    ALTER TABLE bloodwork_appointments ADD COLUMN departure_time timestamptz;
  END IF;

  -- Add appointment_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bloodwork_appointments' AND column_name = 'appointment_time'
  ) THEN
    ALTER TABLE bloodwork_appointments ADD COLUMN appointment_time timestamptz;
  END IF;
END $$;

-- Migrate existing data: copy appointment_datetime to appointment_time
UPDATE bloodwork_appointments
SET appointment_time = appointment_datetime
WHERE appointment_time IS NULL;

-- Make appointment_time NOT NULL after data migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bloodwork_appointments' 
    AND column_name = 'appointment_time'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE bloodwork_appointments 
      ALTER COLUMN appointment_time SET NOT NULL;
  END IF;
END $$;

-- Add constraint: departure_time must be before or equal to appointment_time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bloodwork_appointments_departure_before_appointment'
  ) THEN
    ALTER TABLE bloodwork_appointments 
      ADD CONSTRAINT bloodwork_appointments_departure_before_appointment 
      CHECK (departure_time IS NULL OR departure_time <= appointment_time);
  END IF;
END $$;
