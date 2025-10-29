'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Challenge, ChallengeVote } from '@/lib/types';
import ChallengeCard from '@/components/ChallengeCard';
import Navigation from '@/components/Navigation';

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userVotes, setUserVotes] = useState<ChallengeVote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadCommunityData();
    }
  }, [user, authLoading]);

  const loadCommunityData = async () => {
    setLoading(true);

    const { data: challengesData } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_community', true)
      .order('votes_count', { ascending: false });

    const { data: votesData } = await supabase
      .from('challenge_votes')
      .select('*')
      .eq('user_id', user!.id);

    if (challengesData) setChallenges(challengesData);
    if (votesData) setUserVotes(votesData);

    setLoading(false);
  };

  const handleVote = async (challengeId: string, voteType: 'up' | 'down') => {
    const existingVote = userVotes.find((v) => v.challenge_id === challengeId);

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        await supabase
          .from('challenge_votes')
          .delete()
          .eq('id', existingVote.id);
      } else {
        await supabase
          .from('challenge_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
      }
    } else {
      await supabase.from('challenge_votes').insert({
        challenge_id: challengeId,
        user_id: user!.id,
        vote_type: voteType,
      });
    }

    await loadCommunityData();
  };

  const getUserVote = (challengeId: string): 'up' | 'down' | null => {
    const vote = userVotes.find((v) => v.challenge_id === challengeId);
    return vote ? vote.vote_type : null;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
        <div className="text-2xl font-bold text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Défis de la Communauté
        </h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            Votez pour vos défis préférés ! Les défis les plus populaires seront approuvés et ajoutés à l'application.
          </p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600">Chargement...</div>
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-600">Aucun défi communautaire pour le moment</p>
              <button
                onClick={() => router.push('/propose')}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-lg hover:from-pink-600 hover:to-purple-700"
              >
                Proposer un défi
              </button>
            </div>
          ) : (
            challenges.map((challenge) => (
              <div key={challenge.id} className="relative">
                <ChallengeCard
                  challenge={challenge}
                  onVote={(voteType) => handleVote(challenge.id, voteType)}
                  onClick={() => router.push(`/challenge/${challenge.id}`)}
                  userVote={getUserVote(challenge.id)}
                />
                {!challenge.is_approved && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                    En attente
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}
