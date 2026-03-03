/*
  # Create Storage Bucket for Condition Letters

  1. Storage Bucket
    - `condition-letters` (private)
      - For storing user-uploaded condition/medical letters
      - Private access only
      - No public access
  
  2. Security
    - Bucket is private by default
    - No RLS policies added (will be configured separately if needed)
*/

-- Create the storage bucket for condition letters
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'condition-letters',
  'condition-letters',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
