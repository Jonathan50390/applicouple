/*
  # Fix handle_new_user function with SECURITY DEFINER

  ## Description
  This migration updates the handle_new_user function to use SECURITY DEFINER
  so it can bypass RLS policies when creating new user profiles.

  ## Changes
  - Drop and recreate handle_new_user function with SECURITY DEFINER
  - This allows the function to read/write profiles table without RLS restrictions
  - Essential for user registration to work correctly

  ## Security
  - Function only creates profiles for the NEW user being registered
  - No risk of data leakage as it only operates on the current user's data
*/

-- Drop existing function
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Recreate with SECURITY DEFINER
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code);
  END LOOP;
  
  -- Generate unique partner code
  LOOP
    new_partner_code := generate_unique_code(6);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE partner_code = new_partner_code);
  END LOOP;
  
  -- Create profile
  INSERT INTO public.profiles (id, username, email, referral_code, partner_code)
  VALUES (NEW.id, new_username, NEW.email, new_referral_code, new_partner_code);
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();