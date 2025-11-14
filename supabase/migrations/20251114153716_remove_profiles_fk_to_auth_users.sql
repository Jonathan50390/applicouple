/*
  # Remove foreign key from profiles to auth.users

  ## Description
  The foreign key from profiles.id to auth.users(id) might be causing
  the "Database error querying schema" issue. Let's remove it temporarily.

  ## Changes
  - Drop the foreign key constraint from profiles.id to auth.users(id)
  - Keep the id column as UUID PRIMARY KEY
*/

-- Find and drop the constraint
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;