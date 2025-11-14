/*
  # Create challenge preferences on partner association

  1. Changes
    - Create a function that automatically creates challenge_preferences when a user associates with a partner
    - Create a trigger that calls this function after profiles are updated with partner_id
  
  2. Notes
    - Default preferences: mode='random', all categories and difficulties allowed, show_challenge_before_accept=true
    - Only creates preferences if they don't already exist for the user
*/

-- Function to create default challenge preferences for a user
CREATE OR REPLACE FUNCTION create_default_preferences_for_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create if preferences don't exist
  IF NOT EXISTS (
    SELECT 1 FROM challenge_preferences 
    WHERE challenge_preferences.user_id = create_default_preferences_for_user.user_id
  ) THEN
    INSERT INTO challenge_preferences (
      user_id,
      mode,
      allowed_categories,
      allowed_difficulties,
      show_challenge_before_accept
    ) VALUES (
      create_default_preferences_for_user.user_id,
      'random',
      ARRAY['romantique', 'coquin', 'aventure', 'culinaire', 'creatif', 'sport', 'culture', 'communication', 'bien-etre'],
      ARRAY['facile', 'moyen', 'difficile'],
      true
    );
  END IF;
END;
$$;

-- Function triggered when partner_id is updated
CREATE OR REPLACE FUNCTION on_partner_association()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If partner_id was just set (changed from null to a value)
  IF NEW.partner_id IS NOT NULL AND (OLD.partner_id IS NULL OR OLD.partner_id != NEW.partner_id) THEN
    -- Create preferences for the user being updated
    PERFORM create_default_preferences_for_user(NEW.id);
    
    -- Create preferences for the partner as well
    PERFORM create_default_preferences_for_user(NEW.partner_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_partner_association ON profiles;

-- Create trigger on profiles table
CREATE TRIGGER trigger_partner_association
  AFTER UPDATE OF partner_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION on_partner_association();