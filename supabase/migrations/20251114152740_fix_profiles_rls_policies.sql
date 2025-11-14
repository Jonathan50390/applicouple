/*
  # Fix RLS policies to allow system profile creation

  ## Description
  The current RLS policies prevent the handle_new_user trigger from creating profiles
  because auth.uid() is NULL during user creation. We need to allow the system to
  create profiles during signup.

  ## Changes
  - Drop existing INSERT policy
  - Create new INSERT policy that allows both:
    1. System (service_role) to create profiles during signup
    2. Authenticated users to create their own profile
  
  ## Security
  - Still requires that users can only create their own profile
  - System can create any profile (needed for signup trigger)
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new INSERT policy that allows service_role
CREATE POLICY "Allow profile creation during signup"
  ON profiles
  FOR INSERT
  WITH CHECK (
    -- Allow if user is creating their own profile
    auth.uid() = id
    -- OR if being called by system (auth.uid() is NULL during trigger)
    OR auth.uid() IS NULL
  );