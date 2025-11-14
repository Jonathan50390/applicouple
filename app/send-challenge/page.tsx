'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, DIFFICULTIES } from '@/lib/types';
import Navigation from '@/components/Navigation';

export default function SendChallengePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState('romantique');
  const [difficulty, setDifficulty] = useState('facile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  const handleSendChallenge = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.partner_id) {
      setError('Vous devez être connecté à un partenaire pour envoyer un défi');
      return;
    }

    setLoading(true);
    setError('');

    const { data: challenges } = await supabase
      .from('challenges')
      .select('*')
      .eq('category', category)
      .eq('difficulty', difficulty)
      .eq('is_approved', true);

    if (!challenges || challenges.length === 0) {
      setError('Aucun défi disponible pour cette catégorie et difficulté');
      setLoading(false);
      return;
    }

    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];

    const { error: insertError } = await supabase.from('sent_challenges').insert({
      sender_id: user!.id,
      receiver_id: profile.partner_id,
      category,
      difficulty,
      challenge_id: randomChallenge.id,
      status: 'pending',
    });

    if (insertError) {
      setError('Erreur lors de l\'envoi du défi');
      console.error(insertError);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }

    setLoading(false);
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
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Envoyer un Défi
        </h1>

        {!profile.partner_id ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="font-semibold mb-2">Aucun partenaire connecté</p>
            <p className="text-sm">
              Vous devez être connecté à un partenaire pour envoyer des défis.
            </p>
          </div>
        ) : (
          <>
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                Défi envoyé avec succès ! Votre partenaire doit maintenant l'accepter.
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  Choisissez une catégorie et un niveau de difficulté.
                  Votre partenaire recevra un défi aléatoire correspondant à ces critères.
                </p>
              </div>

              <form onSubmit={handleSendChallenge} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Catégorie
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-4 rounded-xl font-semibold transition-all border-2 ${
                          category === cat.id
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{cat.icon}</div>
                        <div className="text-sm">{cat.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Difficulté
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {DIFFICULTIES.map((diff) => (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => setDifficulty(diff.id)}
                        className={`p-4 rounded-xl font-semibold transition-all border-2 ${
                          difficulty === diff.id
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
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 text-lg"
                >
                  {loading ? 'Envoi...' : '🎯 Envoyer le défi'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <Navigation />
    </div>
  );
}
