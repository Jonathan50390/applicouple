/*
  # Create sent_challenges table

  ## Description
  This migration creates a new table to handle challenges sent between partners.
  When a user sends a challenge, only the category and difficulty are known.
  The receiver can accept or refuse the challenge. Upon acceptance, a random 
  challenge matching the criteria is assigned.

  ## Tables Created
  
  ### `sent_challenges`
  Tracks challenges sent between users with their status (pending, accepted, refused)
  
  - `id` (uuid, primary key) - Unique identifier for the sent challenge
  - `sender_id` (uuid, foreign key) - User who sent the challenge
  - `receiver_id` (uuid, foreign key) - User who receives the challenge
  - `category` (text) - Category chosen by sender
  - `difficulty` (text) - Difficulty level chosen by sender
  - `challenge_id` (uuid, foreign key, nullable) - Assigned challenge after acceptance
  - `status` (text) - Status: 'pending', 'accepted', 'refused', 'completed'
  - `sent_at` (timestamptz) - When the challenge was sent
  - `responded_at` (timestamptz, nullable) - When the receiver responded

  ## Security
  - Enable RLS on `sent_challenges` table
  - Users can view challenges they sent or received
  - Users can insert challenges to their partner
  - Users can update challenges they received (to accept/refuse)
  - Users can update their own sent challenges (to mark as completed)
*/

-- Create sent_challenges table
CREATE TABLE IF NOT EXISTS sent_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  difficulty text NOT NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'refused', 'completed'))
);

-- Enable RLS
ALTER TABLE sent_challenges ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view challenges they sent or received
CREATE POLICY "Users can view own sent/received challenges"
  ON sent_challenges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy: Users can send challenges to their partner
CREATE POLICY "Users can send challenges to partner"
  ON sent_challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND partner_id = receiver_id
    )
  );

-- Policy: Receivers can update status (accept/refuse)
CREATE POLICY "Receivers can accept or refuse challenges"
  ON sent_challenges
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Policy: Senders can mark as completed
CREATE POLICY "Senders can update their sent challenges"
  ON sent_challenges
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sent_challenges_sender ON sent_challenges(sender_id);
CREATE INDEX IF NOT EXISTS idx_sent_challenges_receiver ON sent_challenges(receiver_id);
CREATE INDEX IF NOT EXISTS idx_sent_challenges_status ON sent_challenges(status);