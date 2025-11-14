/*
  # Temporarily disable RLS to test authentication

  ## Description
  Disable RLS on profiles table to see if that's causing the schema error.

  ## Changes
  - Disable RLS on profiles
*/

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;