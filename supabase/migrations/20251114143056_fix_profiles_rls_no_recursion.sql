/*
  # Fix profiles RLS policies - Eliminate all recursion

  ## Description
  This migration completely eliminates recursion in the profiles table RLS policies
  by removing the partner profile viewing policy that causes the recursion.
  
  Instead of using RLS for partner profile access, we'll rely on application-level
  access control or use a stored function.

  ## Changes
  - Drop all existing policies on profiles
  - Create simple, non-recursive policies
  - Users can only view their own profile via RLS
  - Partner profile access will be handled differently (through views or app logic)
*/

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view partner profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new simple policies without any recursion

-- Policy: Users can view their own profile only
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

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

-- Create a security definer function to get partner profile
-- This bypasses RLS and allows safe access to partner data
CREATE OR REPLACE FUNCTION get_partner_profile(user_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  email text,
  partner_id uuid,
  partner_code text,
  points integer,
  level integer,
  avatar_url text,
  referral_code text,
  referred_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM profiles p
  WHERE p.id = (
    SELECT partner_id 
    FROM profiles 
    WHERE profiles.id = user_id
  );
END;
$$;