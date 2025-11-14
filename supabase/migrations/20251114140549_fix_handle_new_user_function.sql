/*
  # Fix handle_new_user function

  ## Description
  This migration fixes the handle_new_user function to properly set the search_path
  and security context to avoid permission issues when creating profiles.

  ## Changes
  - Update handle_new_user function with proper SECURITY DEFINER
  - Set explicit search_path to avoid schema issues
*/

-- Drop and recreate the function with proper security settings
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
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
$$ LANGUAGE plpgsql;