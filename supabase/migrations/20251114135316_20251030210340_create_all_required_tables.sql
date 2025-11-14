/*
  # Create all required tables for the application

  ## Description
  This migration creates all the necessary tables for the couple challenges app:
  - challenges: stores all available challenges
  - completed_challenges: tracks completed challenges by users
  - sent_challenges: tracks challenges sent between partners
  - challenge_preferences: stores user preferences for receiving challenges
  - rewards: available rewards/badges
  - user_rewards: tracks which rewards users have unlocked
  - challenge_votes: tracks user votes on community challenges
  - challenge_comments: stores comments on challenges

  ## Security
  - All tables have RLS enabled
  - Policies ensure users can only access/modify their own data
  - Some read operations allow viewing partner data
*/

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  difficulty text NOT NULL,
  points_reward integer NOT NULL DEFAULT 10,
  is_approved boolean DEFAULT false,
  is_community boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  votes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create completed_challenges table
CREATE TABLE IF NOT EXISTS completed_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  UNIQUE(user_id, challenge_id)
);

-- Create sent_challenges table
CREATE TABLE IF NOT EXISTS sent_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  difficulty text NOT NULL,
  challenge_id uuid REFERENCES challenges(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused', 'completed')),
  sent_at timestamptz DEFAULT now(),
  responded_at timestamptz
);

-- Create challenge_preferences table
CREATE TABLE IF NOT EXISTS challenge_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  mode text NOT NULL DEFAULT 'random' CHECK (mode IN ('random', 'categories', 'off')),
  allowed_categories text[] DEFAULT ARRAY['romantique', 'coquin', 'aventure', 'culinaire', 'creatif', 'sport', 'culture', 'communication', 'bien-etre'],
  allowed_difficulties text[] DEFAULT ARRAY['facile', 'moyen', 'difficile'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  icon text NOT NULL,
  requirement jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_rewards table
CREATE TABLE IF NOT EXISTS user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, reward_id)
);

-- Create challenge_votes table
CREATE TABLE IF NOT EXISTS challenge_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Create challenge_comments table
CREATE TABLE IF NOT EXISTS challenge_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_comments ENABLE ROW LEVEL SECURITY;

-- Policies for challenges table
CREATE POLICY "Anyone can view approved challenges"
  ON challenges FOR SELECT
  TO authenticated
  USING (is_approved = true OR created_by = auth.uid());

CREATE POLICY "Users can create community challenges"
  ON challenges FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_community = true AND is_approved = false);

-- Policies for completed_challenges table
CREATE POLICY "Users can view own completed challenges"
  ON completed_challenges FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own completed challenges"
  ON completed_challenges FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own completed challenges"
  ON completed_challenges FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for sent_challenges table
CREATE POLICY "Users can view challenges they sent or received"
  ON sent_challenges FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send challenges"
  ON sent_challenges FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update challenges they received"
  ON sent_challenges FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Policies for challenge_preferences table
CREATE POLICY "Users can view own preferences"
  ON challenge_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON challenge_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON challenge_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for rewards table
CREATE POLICY "Anyone can view rewards"
  ON rewards FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_rewards table
CREATE POLICY "Users can view own rewards"
  ON user_rewards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for challenge_votes table
CREATE POLICY "Users can view all votes"
  ON challenge_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own votes"
  ON challenge_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own votes"
  ON challenge_votes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own votes"
  ON challenge_votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for challenge_comments table
CREATE POLICY "Users can view all comments"
  ON challenge_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own comments"
  ON challenge_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON challenge_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON challenge_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_challenges_approved ON challenges(is_approved);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_user ON completed_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_challenges_challenge ON completed_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_sent_challenges_sender ON sent_challenges(sender_id);
CREATE INDEX IF NOT EXISTS idx_sent_challenges_receiver ON sent_challenges(receiver_id);
CREATE INDEX IF NOT EXISTS idx_sent_challenges_status ON sent_challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenge_preferences_user ON challenge_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_votes_challenge ON challenge_votes(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_comments_challenge ON challenge_comments(challenge_id);

-- Function to auto-create preferences on profile creation
CREATE OR REPLACE FUNCTION create_default_preferences()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.challenge_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create preferences when profile is created
DROP TRIGGER IF EXISTS on_profile_created_preferences ON profiles;
CREATE TRIGGER on_profile_created_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_preferences();