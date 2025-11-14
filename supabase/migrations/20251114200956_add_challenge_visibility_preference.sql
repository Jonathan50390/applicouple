/*
  # Add challenge visibility preference

  1. Changes
    - Add `show_challenge_before_accept` column to `challenge_preferences` table
      - Boolean field to control whether users see the full challenge details before accepting
      - Default is `true` (show challenge details)
    
  2. Notes
    - When `true`: User sees full challenge details (title, description, points) before accepting
    - When `false`: User only sees category and difficulty before accepting (old behavior)
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenge_preferences' 
    AND column_name = 'show_challenge_before_accept'
  ) THEN
    ALTER TABLE challenge_preferences 
    ADD COLUMN show_challenge_before_accept boolean DEFAULT true;
  END IF;
END $$;