'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SentChallenge, Challenge, ChallengePreferences } from '@/lib/types';
import { CATEGORIES, DIFFICULTIES } from '@/lib/types';
import Navigation from '@/components/Navigation';

export default function ReceivedChallengesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sentChallenges, setSentChallenges] = useState<SentChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadReceivedChallenges();
    }
  }, [user, authLoading]);

  const loadReceivedChallenges = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('sent_challenges')
      .select('*, challenge:challenges(*), sender:profiles!sent_challenges_sender_id_fkey(*)')
      .eq('receiver_id', user!.id)
      .order('sent_at', { ascending: false });

    if (data) {
      setSentChallenges(data as any);
    }

    setLoading(false);
  };

  const handleAccept = async (sentChallenge: SentChallenge) => {
    const { data: preferences } = await supabase
      .from('challenge_preferences')
      .select('*')
      .eq('user_id', user!.id)
      .single();

    if (preferences?.mode === 'off') {
      alert('Vous avez désactivé la réception de défis dans vos préférences');
      return;
    }

    if (preferences?.mode === 'categories') {
      if (!preferences.allowed_categories.includes(sentChallenge.category)) {
        alert('Cette catégorie n\'est pas autorisée dans vos préférences');
        return;
      }
      if (!preferences.allowed_difficulties.includes(sentChallenge.difficulty)) {
        alert('Ce niveau de difficulté n\'est pas autorisé dans vos préférences');
        return;
      }
    }

    const { data: challenges } = await supabase
      .from('challenges')
      .select('*')
      .eq('category', sentChallenge.category)
      .eq('difficulty', sentChallenge.difficulty)
      .eq('is_approved', true);

    if (!challenges || challenges.length === 0) {
      alert('Aucun défi disponible pour cette catégorie et difficulté');
      return;
    }

    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];

    const { error } = await supabase
      .from('sent_challenges')
      .update({
        status: 'accepted',
        challenge_id: randomChallenge.id,
        responded_at: new Date().toISOString(),
      })
      .eq('id', sentChallenge.id);

    if (!error) {
      await loadReceivedChallenges();
    }
  };

  const handleRefuse = async (sentChallengeId: string) => {
    const { error } = await supabase
      .from('sent_challenges')
      .update({
        status: 'refused',
        responded_at: new Date().toISOString(),
      })
      .eq('id', sentChallengeId);

    if (!error) {
      await loadReceivedChallenges();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
        <div className="text-2xl font-bold text-gray-600">Chargement...</div>
      </div>
    );
  }

  const pendingChallenges = sentChallenges.filter((c) => c.status === 'pending');
  const acceptedChallenges = sentChallenges.filter((c) => c.status === 'accepted');
  const otherChallenges = sentChallenges.filter((c) => c.status === 'refused' || c.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Défis Reçus
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Chargement...</div>
          </div>
        ) : (
          <>
            {pendingChallenges.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  En attente de réponse
                </h2>
                <div className="space-y-4">
                  {pendingChallenges.map((sentChallenge) => {
                    const category = CATEGORIES.find((c) => c.id === sentChallenge.category);
                    const difficulty = DIFFICULTIES.find((d) => d.id === sentChallenge.difficulty);

                    return (
                      <div
                        key={sentChallenge.id}
                        className="bg-white rounded-xl shadow-lg p-6"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <span className="text-5xl">{category?.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold">
                                {category?.name}
                              </span>
                              <span className="text-sm px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                                {difficulty?.name}
                              </span>
                            </div>
                            <p className="text-gray-700 mb-2">
                              <strong>{sentChallenge.sender?.username}</strong> vous a envoyé un défi !
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(sentChallenge.sent_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAccept(sentChallenge)}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
                          >
                            ✓ Accepter
                          </button>
                          <button
                            onClick={() => handleRefuse(sentChallenge.id)}
                            className="flex-1 bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-400 transition-all"
                          >
                            ✗ Refuser
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {acceptedChallenges.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Défis acceptés
                </h2>
                <div className="space-y-4">
                  {acceptedChallenges.map((sentChallenge) => {
                    const category = CATEGORIES.find((c) => c.id === sentChallenge.category);
                    const difficulty = DIFFICULTIES.find((d) => d.id === sentChallenge.difficulty);

                    return (
                      <div
                        key={sentChallenge.id}
                        className="bg-white rounded-xl shadow-lg p-6"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <span className="text-5xl">{category?.icon}</span>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              {sentChallenge.challenge?.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold">
                                {category?.name}
                              </span>
                              <span className="text-sm px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                                {difficulty?.name}
                              </span>
                              <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
                                {sentChallenge.challenge?.points_reward} points
                              </span>
                            </div>
                            <p className="text-gray-700 mb-3">
                              {sentChallenge.challenge?.description}
                            </p>
                            <p className="text-sm text-gray-500">
                              Envoyé par <strong>{sentChallenge.sender?.username}</strong>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => router.push(`/challenge/${sentChallenge.challenge_id}`)}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
                        >
                          Voir le défi
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {otherChallenges.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Historique
                </h2>
                <div className="space-y-4">
                  {otherChallenges.map((sentChallenge) => {
                    const category = CATEGORIES.find((c) => c.id === sentChallenge.category);
                    const difficulty = DIFFICULTIES.find((d) => d.id === sentChallenge.difficulty);

                    return (
                      <div
                        key={sentChallenge.id}
                        className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{category?.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm px-3 py-1 rounded-full bg-gray-200 text-gray-700 font-semibold">
                                {category?.name}
                              </span>
                              <span className="text-sm px-3 py-1 rounded-full bg-gray-200 text-gray-700 font-semibold">
                                {difficulty?.name}
                              </span>
                              <span
                                className={`text-sm px-3 py-1 rounded-full font-semibold ${
                                  sentChallenge.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {sentChallenge.status === 'completed' ? 'Complété' : 'Refusé'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              De <strong>{sentChallenge.sender?.username}</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sentChallenges.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600 font-semibold mb-2">
                  Aucun défi reçu pour le moment
                </p>
                <p className="text-sm text-gray-500">
                  Votre partenaire peut vous envoyer des défis personnalisés
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <Navigation />
    </div>
  );
}
