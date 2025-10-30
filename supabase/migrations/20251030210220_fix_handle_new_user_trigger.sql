/*
  # Fix handle_new_user trigger with proper error handling

  ## Description
  This migration fixes the handle_new_user trigger to handle errors properly
  and ensure it has the correct permissions to create profiles.

  ## Changes
  - Drop and recreate the handle_new_user function with better error handling
  - Add proper SECURITY DEFINER and SET search_path for security
  - Add error logging and graceful failure handling
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate function with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  new_username text;
  new_referral_code text;
  new_partner_code text;
  max_attempts integer := 10;
  attempt integer;
BEGIN
  -- Extract username from email
  new_username := split_part(NEW.email, '@', 1);
  
  -- Generate unique referral code with max attempts
  attempt := 0;
  LOOP
    new_referral_code := generate_unique_code(8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code);
    attempt := attempt + 1;
    EXIT WHEN attempt >= max_attempts;
  END LOOP;
  
  IF attempt >= max_attempts THEN
    RAISE EXCEPTION 'Failed to generate unique referral code';
  END IF;
  
  -- Generate unique partner code with max attempts
  attempt := 0;
  LOOP
    new_partner_code := generate_unique_code(6);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE partner_code = new_partner_code);
    attempt := attempt + 1;
    EXIT WHEN attempt >= max_attempts;
  END LOOP;
  
  IF attempt >= max_attempts THEN
    RAISE EXCEPTION 'Failed to generate unique partner code';
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (id, username, email, referral_code, partner_code)
  VALUES (NEW.id, new_username, NEW.email, new_referral_code, new_partner_code);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();