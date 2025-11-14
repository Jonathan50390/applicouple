/*
  # Temporarily disable the trigger to test login

  ## Description
  Disable the on_auth_user_created trigger to see if it's causing the login issue.
  This will help us isolate the problem.

  ## Changes
  - Drop the trigger (we can recreate it later with the right approach)
*/

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;