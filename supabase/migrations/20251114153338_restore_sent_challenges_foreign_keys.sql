/*
  # Restore foreign keys on sent_challenges

  ## Description
  When we dropped and recreated the profiles table, the foreign keys
  from sent_challenges to profiles were removed. This is causing the
  "Database error querying schema" issue during authentication.

  ## Changes
  - Add foreign key from sender_id to profiles(id)
  - Add foreign key from receiver_id to profiles(id)

  ## Security
  - No RLS changes needed
*/

-- Add foreign key constraints back to sent_challenges
ALTER TABLE sent_challenges
  ADD CONSTRAINT sent_challenges_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE sent_challenges
  ADD CONSTRAINT sent_challenges_receiver_id_fkey
  FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE;