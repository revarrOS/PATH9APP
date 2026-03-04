/*
  # Create Nutrition System

  1. New Tables
    - `nutrition_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `entry_date` (timestamptz) - when the meal/snack was consumed
      - `entry_type` (text) - meal, snack, drink, supplement
      - `image_path` (text) - storage path to uploaded image
      - `ai_interpretation` (jsonb) - AI analysis results (categories, support areas, confidence)
      - `user_notes` (text) - optional user notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `nutrition_preferences`
      - `user_id` (uuid, primary key, foreign key to auth.users)
      - `condition_verified` (boolean) - has user confirmed their condition
      - `condition_verified_at` (timestamptz) - when verification happened
      - `verified_diagnosis` (text) - the diagnosis they confirmed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage
    - Create `nutrition-images` bucket for meal photos

  3. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Storage policies for user-specific image uploads
*/

-- Create nutrition_entries table
CREATE TABLE IF NOT EXISTS nutrition_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date timestamptz NOT NULL DEFAULT now(),
  entry_type text NOT NULL CHECK (entry_type IN ('meal', 'snack', 'drink', 'supplement')),
  image_path text,
  ai_interpretation jsonb DEFAULT '{}'::jsonb,
  user_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_user_id ON nutrition_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_entry_date ON nutrition_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_user_date ON nutrition_entries(user_id, entry_date DESC);

-- Enable RLS
ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nutrition_entries
CREATE POLICY "Users can view own nutrition entries"
  ON nutrition_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition entries"
  ON nutrition_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition entries"
  ON nutrition_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition entries"
  ON nutrition_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create nutrition_preferences table
CREATE TABLE IF NOT EXISTS nutrition_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  condition_verified boolean DEFAULT false,
  condition_verified_at timestamptz,
  verified_diagnosis text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE nutrition_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nutrition_preferences
CREATE POLICY "Users can view own nutrition preferences"
  ON nutrition_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition preferences"
  ON nutrition_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition preferences"
  ON nutrition_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for nutrition images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nutrition-images',
  'nutrition-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload own nutrition images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'nutrition-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own nutrition images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'nutrition-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own nutrition images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'nutrition-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'nutrition-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own nutrition images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'nutrition-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_nutrition_entries_updated_at
  BEFORE UPDATE ON nutrition_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_preferences_updated_at
  BEFORE UPDATE ON nutrition_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
