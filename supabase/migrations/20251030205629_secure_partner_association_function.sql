/*
  # Secure partner association with database function

  ## Description
  This migration creates a secure database function for bidirectional partner association.
  Instead of allowing client-side updates to both profiles, we use a SECURITY DEFINER function
  that safely handles the bidirectional association.

  ## New Functions
  
  ### `associate_partner(partner_code_input text)`
  - Takes a partner code as input
  - Validates the partner code exists
  - Prevents self-association
  - Checks if partner is already associated with someone else
  - Updates both profiles atomically
  - Returns success status and partner profile data

  ## Security
  - Function runs with SECURITY DEFINER to bypass RLS for the update
  - All validations are performed within the function
  - Atomic transaction ensures both updates succeed or both fail
  - Only the partner_id field is modified
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can set themselves as partner" ON profiles;

-- Create secure function for partner association
CREATE OR REPLACE FUNCTION associate_partner(partner_code_input text)
RETURNS json AS $$
DECLARE
  current_user_id uuid;
  partner_profile_record profiles;
  result json;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Find partner by code
  SELECT * INTO partner_profile_record
  FROM profiles
  WHERE partner_code = upper(partner_code_input);
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Code partenaire invalide'
    );
  END IF;
  
  -- Check not associating with self
  IF partner_profile_record.id = current_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Vous ne pouvez pas vous associer avec vous-même'
    );
  END IF;
  
  -- Check if partner is already associated with someone else
  IF partner_profile_record.partner_id IS NOT NULL AND partner_profile_record.partner_id != current_user_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ce partenaire est déjà associé avec quelqu''un d''autre'
    );
  END IF;
  
  -- Update both profiles atomically
  UPDATE profiles
  SET partner_id = partner_profile_record.id, updated_at = now()
  WHERE id = current_user_id;
  
  UPDATE profiles
  SET partner_id = current_user_id, updated_at = now()
  WHERE id = partner_profile_record.id;
  
  -- Return success with partner data
  RETURN json_build_object(
    'success', true,
    'partner', row_to_json(partner_profile_record)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION associate_partner(text) TO authenticated;