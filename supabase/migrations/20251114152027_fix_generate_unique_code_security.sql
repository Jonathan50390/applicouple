/*
  # Fix generate_unique_code function with SECURITY DEFINER

  ## Description
  This migration updates the generate_unique_code function to use SECURITY DEFINER
  so it can be called safely from other SECURITY DEFINER functions.

  ## Changes
  - Add SECURITY DEFINER to generate_unique_code function
  - Set proper search_path for security
*/

CREATE OR REPLACE FUNCTION generate_unique_code(code_length integer)
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..code_length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;