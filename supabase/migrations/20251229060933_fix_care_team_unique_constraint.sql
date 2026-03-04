/*
  # Fix care_team unique constraint for upsert operations

  ## Problem
  The understand-appointment edge function uses upsert with onConflict:
  `upsert(..., { onConflict: "user_id,provider_name" })`

  This requires a unique constraint on (user_id, provider_name) to work,
  but the original migration didn't include this constraint.

  ## Changes
  1. Add unique constraint on (user_id, provider_name)
  2. This enables proper upsert behavior when the same provider is mentioned multiple times

  ## Impact
  - Prevents duplicate care team members for the same user
  - Allows understand-appointment to update existing providers instead of failing
*/

-- Add unique constraint for care_team upsert operations
ALTER TABLE care_team
ADD CONSTRAINT care_team_user_provider_unique
UNIQUE (user_id, provider_name);
