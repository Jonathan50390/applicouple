/*
  # Create profiles table and partner association system

  ## Description
  This migration creates the main profiles table with partner association functionality.
  Each user has a unique partner code they can share, and can be associated with one partner.

  ## New Tables
  
  ### `profiles` table
  - `id` (uuid, primary key) - Matches auth.users.id
  - `username` (text, not null) - User's display name
  - `email` (text, not null) - User's email address
  - `partner_id` (uuid, nullable) - Reference to associated partner's profile
  - `partner_code` (text, unique, not null) - Unique 6-character code for partner association
  - `points` (integer, default 0) - User's total points
  - `level` (integer, default 1) - User's current level
  - `avatar_url` (text, nullable) - URL to user's avatar image
  - `referral_code` (text, unique, not null) - Unique code for referrals
  - `referred_by` (uuid, nullable) - Reference to user who referred this user
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on `profiles` table
  - Users can view their own profile
  - Users can view their partner's profile
  - Users can update their own profile (except id, referral_code, partner_code)
  
  ## Triggers
  - Auto-create profile when user signs up
  - Generate unique partner_code and referral_code automatically
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  email text NOT NULL,
  partner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  partner_code text UNIQUE NOT NULL,
  points integer DEFAULT 0,
  level integer DEFAULT 1,
  avatar_url text,
  referral_code text UNIQUE NOT NULL,
  referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can view their partner's profile
CREATE POLICY "Users can view partner profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.partner_id = profiles.id
    )
  );

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to generate unique code
CREATE OR REPLACE FUNCTION generate_unique_code(code_length integer)
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..code_length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username text;
  new_referral_code text;
  new_partner_code text;
BEGIN
  -- Extract username from email
  new_username := split_part(NEW.email, '@', 1);
  
  -- Generate unique referral code
  LOOP
    new_referral_code := generate_unique_code(8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_referral_code);
  END LOOP;
  
  -- Generate unique partner code
  LOOP
    new_partner_code := generate_unique_code(6);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE partner_code = new_partner_code);
  END LOOP;
  
  -- Create profile
  INSERT INTO profiles (id, username, email, referral_code, partner_code)
  VALUES (NEW.id, new_username, NEW.email, new_referral_code, new_partner_code);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id ON profiles(partner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_partner_code ON profiles(partner_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);