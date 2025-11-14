/*
  # Restore schema with proper configuration

  ## Description
  Re-enable RLS and restore the foreign key constraint now that we've
  cleaned up the corrupted user data.

  ## Changes
  - Re-enable RLS on profiles
  - Add back the FK from profiles.id to auth.users(id)
*/

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Restore the foreign key
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;