/*
  # Add partner preferences and association system

  ## Description
  This migration adds a partner code system for easy pairing and preferences
  for receiving challenges.

  ## Changes to existing tables
  
  ### `profiles` table
  - Add `partner_code` (text, unique) - Unique code to share with partner for association
  
  ## New Tables
  
  ### `challenge_preferences`
  Stores user preferences for receiving challenges
  
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - User who owns these preferences
  - `mode` (text) - 'random', 'categories', 'off'
  - `allowed_categories` (text[]) - Array of allowed categories (when mode='categories')
  - `allowed_difficulties` (text[]) - Array of allowed difficulties
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on `challenge_preferences` table
  - Users can only view and update their own preferences
*/

-- Add partner_code to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'partner_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN partner_code text UNIQUE;
  END IF;
END $$;

-- Generate unique partner codes for existing users
DO $$
DECLARE
  profile_record RECORD;
  new_code text;
BEGIN
  FOR profile_record IN SELECT id FROM profiles WHERE partner_code IS NULL
  LOOP
    LOOP
      new_code := upper(substring(md5(random()::text || profile_record.id::text) from 1 for 6));
      BEGIN
        UPDATE profiles SET partner_code = new_code WHERE id = profile_record.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        CONTINUE;
      END;
    END LOOP;
  END LOOP;
END $$;

-- Create challenge_preferences table
CREATE TABLE IF NOT EXISTS challenge_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  mode text NOT NULL DEFAULT 'random',
  allowed_categories text[] DEFAULT ARRAY['romantique', 'coquin', 'aventure', 'culinaire', 'creatif', 'sport', 'culture', 'communication', 'bien-etre'],
  allowed_difficulties text[] DEFAULT ARRAY['facile', 'moyen', 'difficile'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_mode CHECK (mode IN ('random', 'categories', 'off'))
);

-- Enable RLS
ALTER TABLE challenge_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON challenge_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON challenge_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON challenge_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create default preferences for existing users
INSERT INTO challenge_preferences (user_id, mode, allowed_categories, allowed_difficulties)
SELECT id, 'random', 
  ARRAY['romantique', 'coquin', 'aventure', 'culinaire', 'creatif', 'sport', 'culture', 'communication', 'bien-etre'],
  ARRAY['facile', 'moyen', 'difficile']
FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- Function to auto-create preferences on profile creation
CREATE OR REPLACE FUNCTION create_default_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO challenge_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences when profile is created
DROP TRIGGER IF EXISTS on_profile_created_preferences ON profiles;
CREATE TRIGGER on_profile_created_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_preferences();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_challenge_preferences_user ON challenge_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_partner_code ON profiles(partner_code);