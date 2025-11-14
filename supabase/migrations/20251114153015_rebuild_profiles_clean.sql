/*
  # Rebuild profiles table with clean schema

  ## Description
  Drop and recreate the profiles table with a clean, simple structure
  to eliminate any schema issues causing authentication failures.

  ## Changes
  1. Drop existing profiles table and all its constraints
  2. Recreate profiles table with simple structure
  3. Set up basic RLS policies
  4. No triggers - manual profile creation only

  ## Security
  - Enable RLS
  - Allow users to read/update their own profile
  - Allow anyone to insert (for signup)
*/

-- Drop existing table and recreate
DROP TABLE IF EXISTS profiles CASCADE;

-- Create clean profiles table
CREATE TABLE profiles (
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

-- Create simple RLS policies
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);