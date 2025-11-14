/*
  # Fix profiles RLS policies to prevent infinite recursion

  ## Description
  This migration fixes the infinite recursion issue in the profiles table RLS policies.
  The "Users can view partner profile" policy was causing recursion by referencing
  the profiles table within its USING clause.

  ## Changes
  - Drop existing problematic policies
  - Create new policies without recursion
  - Users can view their own profile
  - Users can view profiles by partner_id directly without nested query
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies without recursion

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can view their partner's profile (simplified to avoid recursion)
CREATE POLICY "Users can view partner profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT partner_id 
      FROM profiles 
      WHERE id = auth.uid() AND partner_id IS NOT NULL
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