/*
  # Disable trigger for existing users during login

  ## Description
  The handle_new_user trigger might be causing issues during login.
  We'll modify it to only run if the profile doesn't already exist.

  ## Changes
  - Update handle_new_user function to check if profile exists first
  - Only create profile if it doesn't exist
  - This prevents errors during login for existing users
*/

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
  profile_exists boolean;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = NEW.id) INTO profile_exists;
  
  -- Only create profile if it doesn't exist
  IF NOT profile_exists THEN
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
  END IF;
  
  RETURN NEW;
END;
$$;