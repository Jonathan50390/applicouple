/*
  # Remove all custom functions temporarily

  ## Description
  Remove all custom functions to isolate the "Database error querying schema" issue.
  We'll recreate them properly once authentication works.

  ## Changes
  - Drop handle_new_user function
  - Drop generate_unique_code function
  - Drop create_default_preferences function
  - Drop associate_partner function if it exists
*/

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS generate_unique_code(integer) CASCADE;
DROP FUNCTION IF EXISTS create_default_preferences() CASCADE;
DROP FUNCTION IF EXISTS associate_partner(text) CASCADE;