'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Challenge, CompletedChallenge, SentChallenge } from '@/lib/types';
import { CATEGORIES, DIFFICULTIES } from '@/lib/types';
import ChallengeCard from '@/components/ChallengeCard';
import Navigation from '@/components/Navigation';
import PointsDisplay from '@/components/PointsDisplay';

export default function Home() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [sentChallenges, setSentChallenges] = useState<SentChallenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<CompletedChallenge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);

    const { data: sentChallengesData } = await supabase
      .from('sent_challenges')
      .select('*, challenge:challenges(*), sender:profiles!sent_challenges_sender_id_fkey(*)')
      .eq('receiver_id', user!.id)
      .eq('status', 'accepted')
      .order('responded_at', { ascending: false });

    const { data: completedData } = await supabase
      .from('completed_challenges')
      .select('*')
      .eq('user_id', user!.id);

    if (sentChallengesData) setSentChallenges(sentChallengesData as any);
    if (completedData) setCompletedChallenges(completedData);

    setLoading(false);
  };

  const handleCompleteChallenge = async (sentChallenge: SentChallenge) => {
    if (!user || !profile || !sentChallenge.challenge) return;

    const isCompleted = completedChallenges.some(
      (cc) => cc.challenge_id === sentChallenge.challenge_id
    );

    if (isCompleted) return;

    const { error } = await supabase.from('completed_challenges').insert({
      user_id: user.id,
      challenge_id: sentChallenge.challenge_id!,
    });

    if (!error) {
      await supabase
        .from('sent_challenges')
        .update({ status: 'completed' })
        .eq('id', sentChallenge.id);

      const newPoints = profile.points + sentChallenge.challenge.points_reward;
      const newLevel = Math.floor(newPoints / 100) + 1;

      await supabase
        .from('profiles')
        .update({
          points: newPoints,
          level: newLevel,
        })
        .eq('id', user.id);

      await refreshProfile();
      await loadData();
    }
  };

  const handleSendChallenge = async () => {
    if (!profile?.partner_id) {
      alert('Vous devez être connecté à un partenaire pour envoyer un défi');
      return;
    }

    if (selectedCategory === 'all') {
      alert('Veuillez choisir une catégorie');
      return;
    }

    if (selectedDifficulty === 'all') {
      alert('Veuillez choisir un niveau de difficulté');
      return;
    }

    const { error } = await supabase.from('sent_challenges').insert({
      sender_id: user!.id,
      receiver_id: profile.partner_id,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      status: 'pending',
    });

    if (!error) {
      setSelectedCategory('all');
      setSelectedDifficulty('all');
      alert('📤 Défi envoyé à votre partenaire !');
    }
  };

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
        <div className="text-2xl font-bold text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Bienvenue {profile.username} 👋
          </h1>
          <PointsDisplay points={profile.points} level={profile.level} />
        </div>

        {!profile.partner_id ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-6 mb-6">
            <div className="text-4xl mb-3 text-center">⚠️</div>
            <p className="font-semibold mb-2 text-center">Aucun partenaire connecté</p>
            <p className="text-sm text-center mb-4">
              Associez-vous avec votre partenaire pour échanger des défis.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-all"
            >
              Associer un partenaire
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              📤 Envoyer un défi à votre partenaire
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Choisissez une catégorie et un niveau de difficulté. Votre partenaire recevra le défi et devra l'accepter.
            </p>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Catégorie
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-3 rounded-lg font-semibold transition-all border-2 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{category.icon}</div>
                  <div className="text-xs">{category.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Difficulté
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => setSelectedDifficulty(diff.id)}
                  className={`p-3 rounded-lg font-semibold transition-all border-2 ${
                    selectedDifficulty === diff.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
                  }`}
                >
                  {diff.name}
                </button>
              ))}
            </div>
          </div>

            <button
              onClick={handleSendChallenge}
              disabled={selectedCategory === 'all' || selectedDifficulty === 'all'}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📤 Envoyer le défi
            </button>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Mes défis à réaliser</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600">Chargement...</div>
            </div>
          ) : sentChallenges.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-600 font-semibold mb-2">
                Aucun défi à réaliser pour le moment
              </p>
              <p className="text-sm text-gray-500">
                Votre partenaire peut vous envoyer des défis que vous devrez accepter
              </p>
            </div>
          ) : (
            sentChallenges.map((sentChallenge) => {
              const isCompleted = completedChallenges.some(
                (cc) => cc.challenge_id === sentChallenge.challenge_id
              );

              return sentChallenge.challenge ? (
                <div key={sentChallenge.id}>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                    <p className="text-sm text-blue-800">
                      <strong>👤 Défi de {sentChallenge.sender?.username}</strong>
                    </p>
                  </div>
                  <ChallengeCard
                    challenge={sentChallenge.challenge}
                    onComplete={() => handleCompleteChallenge(sentChallenge)}
                    onClick={() => router.push(`/challenge/${sentChallenge.challenge_id}`)}
                    isCompleted={isCompleted}
                  />
                </div>
              ) : null;
            })
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
}
