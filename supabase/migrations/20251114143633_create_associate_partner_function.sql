/*
  # Create associate_partner function

  ## Description
  This migration creates the associate_partner function that allows users to
  connect with their partner using a partner code.

  ## Changes
  - Create associate_partner function that:
    - Takes a partner code as input
    - Finds the partner with that code
    - Associates both users as partners
    - Returns success or error status

  ## Security
  - Function is SECURITY DEFINER to bypass RLS
  - Only authenticated users can call it
  - Validates partner code exists
  - Prevents self-partnering
  - Prevents partnering if already have a partner
*/

CREATE OR REPLACE FUNCTION associate_partner(partner_code_input text)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id uuid;
  partner_user_id uuid;
  current_user_partner_id uuid;
  partner_partner_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Non authentifié');
  END IF;
  
  -- Find partner by code
  SELECT id, partner_id INTO partner_user_id, partner_partner_id
  FROM profiles
  WHERE partner_code = partner_code_input;
  
  IF partner_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Code partenaire invalide');
  END IF;
  
  -- Check if trying to partner with self
  IF partner_user_id = current_user_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Vous ne pouvez pas vous associer avec vous-même');
  END IF;
  
  -- Check if current user already has a partner
  SELECT partner_id INTO current_user_partner_id
  FROM profiles
  WHERE id = current_user_id;
  
  IF current_user_partner_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Vous avez déjà un partenaire');
  END IF;
  
  -- Check if partner already has a partner
  IF partner_partner_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ce partenaire est déjà associé avec quelqu''un d''autre');
  END IF;
  
  -- Associate both users
  UPDATE profiles SET partner_id = partner_user_id WHERE id = current_user_id;
  UPDATE profiles SET partner_id = current_user_id WHERE id = partner_user_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Association réussie');
END;
$$;