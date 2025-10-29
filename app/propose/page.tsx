'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, DIFFICULTIES } from '@/lib/types';
import Navigation from '@/components/Navigation';

export default function ProposePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('romantique');
  const [difficulty, setDifficulty] = useState('facile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const pointsMap: Record<string, number> = {
      facile: 10,
      moyen: 20,
      difficile: 30,
    };

    const { error } = await supabase.from('challenges').insert({
      title,
      description,
      category,
      difficulty,
      points_reward: pointsMap[difficulty],
      is_community: true,
      is_approved: false,
      created_by: user!.id,
      votes_count: 0,
    });

    if (!error) {
      setSuccess(true);
      setTitle('');
      setDescription('');
      setCategory('romantique');
      setDifficulty('facile');

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }

    setLoading(false);
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
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Proposer un Défi
        </h1>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            Votre défi a été soumis avec succès ! Il sera examiné avant d'être publié.
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Titre du défi
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Ex: Dîner aux chandelles fait maison"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-900 h-32"
                placeholder="Décrivez votre défi en détail..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulté
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-900"
              >
                {DIFFICULTIES.map((diff) => (
                  <option key={diff.id} value={diff.id}>
                    {diff.name} ({diff.id === 'facile' ? '10' : diff.id === 'moyen' ? '20' : '30'} points)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Soumettre le défi'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Note :</strong> Les défis soumis seront examinés par notre équipe avant d'être publiés.
              Assurez-vous que votre défi est respectueux et adapté à tous les couples.
            </p>
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
