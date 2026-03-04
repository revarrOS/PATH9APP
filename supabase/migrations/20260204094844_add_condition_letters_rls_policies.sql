/*
  # Add RLS Policies for Condition Letters Storage Bucket

  1. Security Policies
    - Enable authenticated users to INSERT their own files
    - Enable authenticated users to SELECT their own files
    - Enable authenticated users to UPDATE their own files
    - Enable authenticated users to DELETE their own files
  
  2. Path Structure
    - Files are stored with path: {user_id}/{filename}
    - Users can only access files in their own user_id folder
*/

-- Policy: Allow authenticated users to insert their own files
CREATE POLICY "Users can upload their own condition letters"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'condition-letters' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow authenticated users to select their own files
CREATE POLICY "Users can view their own condition letters"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'condition-letters' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update their own condition letters"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'condition-letters' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'condition-letters' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own condition letters"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'condition-letters' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
