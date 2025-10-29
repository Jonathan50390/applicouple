export interface Profile {
  id: string;
  username: string;
  email: string;
  partner_id: string | null;
  points: number;
  level: number;
  avatar_url: string | null;
  referral_code: string;
  referred_by: string | null;
  partner_code: string;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  points_reward: number;
  is_approved: boolean;
  is_community: boolean;
  created_by: string | null;
  votes_count: number;
  created_at: string;
}

export interface CompletedChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  completed_at: string;
  rating: number | null;
  comment: string | null;
}

export interface ChallengeVote {
  id: string;
  challenge_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
}

export interface ChallengeComment {
  id: string;
  challenge_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  requirement: any;
  created_at: string;
}

export interface UserReward {
  id: string;
  user_id: string;
  reward_id: string;
  unlocked_at: string;
  reward?: Reward;
}

export interface SentChallenge {
  id: string;
  sender_id: string;
  receiver_id: string;
  category: string;
  difficulty: string;
  challenge_id: string | null;
  status: 'pending' | 'accepted' | 'refused' | 'completed';
  sent_at: string;
  responded_at: string | null;
  challenge?: Challenge;
  sender?: Profile;
  receiver?: Profile;
}

export interface ChallengePreferences {
  id: string;
  user_id: string;
  mode: 'random' | 'categories' | 'off';
  allowed_categories: string[];
  allowed_difficulties: string[];
  created_at: string;
  updated_at: string;
}

export const CATEGORIES = [
  { id: 'romantique', name: 'Romantique', icon: '💕', color: 'pink' },
  { id: 'coquin', name: 'Coquin', icon: '🔥', color: 'red' },
  { id: 'aventure', name: 'Aventure', icon: '🗺️', color: 'green' },
  { id: 'culinaire', name: 'Culinaire', icon: '🍳', color: 'orange' },
  { id: 'creatif', name: 'Créatif', icon: '🎨', color: 'purple' },
  { id: 'sport', name: 'Sport', icon: '💪', color: 'blue' },
  { id: 'culture', name: 'Culture', icon: '📚', color: 'yellow' },
  { id: 'communication', name: 'Communication', icon: '💬', color: 'teal' },
  { id: 'bien-etre', name: 'Bien-être', icon: '🧘', color: 'emerald' },
];

export const DIFFICULTIES = [
  { id: 'facile', name: 'Facile', color: 'green' },
  { id: 'moyen', name: 'Moyen', color: 'yellow' },
  { id: 'difficile', name: 'Difficile', color: 'red' },
];
