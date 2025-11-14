'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ChallengePreferences } from '@/lib/types';
import { CATEGORIES, DIFFICULTIES } from '@/lib/types';
import Navigation from '@/components/Navigation';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState<ChallengePreferences | null>(null);
  const [mode, setMode] = useState<'random' | 'categories' | 'off'>('random');
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [allowedDifficulties, setAllowedDifficulties] = useState<string[]>([]);
  const [showChallengeBeforeAccept, setShowChallengeBeforeAccept] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadPreferences();
    }
  }, [user, authLoading]);

  const loadPreferences = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('challenge_preferences')
      .select('*')
      .eq('user_id', user!.id)
      .single();

    if (data) {
      setPreferences(data);
      setMode(data.mode);
      setAllowedCategories(data.allowed_categories || []);
      setAllowedDifficulties(data.allowed_difficulties || []);
      setShowChallengeBeforeAccept(data.show_challenge_before_accept !== false);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const { error } = await supabase
      .from('challenge_preferences')
      .update({
        mode,
        allowed_categories: allowedCategories,
        allowed_difficulties: allowedDifficulties,
        show_challenge_before_accept: showChallengeBeforeAccept,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user!.id);

    if (!error) {
      alert('Préférences enregistrées !');
    } else {
      alert('Erreur lors de l\'enregistrement');
    }

    setSaving(false);
  };

  const toggleCategory = (categoryId: string) => {
    if (allowedCategories.includes(categoryId)) {
      setAllowedCategories(allowedCategories.filter((c) => c !== categoryId));
    } else {
      setAllowedCategories([...allowedCategories, categoryId]);
    }
  };

  const toggleDifficulty = (difficultyId: string) => {
    if (allowedDifficulties.includes(difficultyId)) {
      setAllowedDifficulties(allowedDifficulties.filter((d) => d !== difficultyId));
    } else {
      setAllowedDifficulties([...allowedDifficulties, difficultyId]);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
        <div className="text-2xl font-bold text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 text-pink-600 hover:text-pink-700 font-semibold"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            Préférences de défis
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Mode de réception des défis
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Choisissez comment vous souhaitez recevoir les défis de votre partenaire
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setMode('random')}
              className={`w-full p-4 rounded-xl font-semibold transition-all border-2 text-left ${
                mode === 'random'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎲</span>
                <div>
                  <div className="font-bold">Mode aléatoire complet</div>
                  <div className="text-sm opacity-90">
                    Votre partenaire peut vous envoyer n'importe quel défi
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('categories')}
              className={`w-full p-4 rounded-xl font-semibold transition-all border-2 text-left ${
                mode === 'categories'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <div>
                  <div className="font-bold">Mode personnalisé</div>
                  <div className="text-sm opacity-90">
                    Choisissez vos catégories et niveaux préférés
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('off')}
              className={`w-full p-4 rounded-xl font-semibold transition-all border-2 text-left ${
                mode === 'off'
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-transparent'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🚫</span>
                <div>
                  <div className="font-bold">Désactivé</div>
                  <div className="text-sm opacity-90">
                    Ne pas recevoir de défis de votre partenaire
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Visibilité des défis
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Choisissez si vous voulez voir le défi complet avant de l'accepter
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setShowChallengeBeforeAccept(true)}
              className={`w-full p-4 rounded-xl font-semibold transition-all border-2 text-left ${
                showChallengeBeforeAccept
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">👁️</span>
                <div>
                  <div className="font-bold">Voir le défi avant d'accepter</div>
                  <div className="text-sm opacity-90">
                    Vous verrez le titre, la description et les points avant d'accepter
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowChallengeBeforeAccept(false)}
              className={`w-full p-4 rounded-xl font-semibold transition-all border-2 text-left ${
                !showChallengeBeforeAccept
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎁</span>
                <div>
                  <div className="font-bold">Défi surprise</div>
                  <div className="text-sm opacity-90">
                    Vous ne verrez que la catégorie et difficulté, le défi sera révélé après acceptation
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {mode === 'categories' && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Catégories acceptées
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez les catégories de défis que vous souhaitez recevoir
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`p-3 rounded-lg font-semibold transition-all border-2 ${
                      allowedCategories.includes(category.id)
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{category.icon}</div>
                    <div className="text-xs">{category.name}</div>
                  </button>
                ))}
              </div>

              {allowedCategories.length === 0 && (
                <p className="text-sm text-red-600 mt-3">
                  ⚠️ Vous devez sélectionner au moins une catégorie
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Niveaux de difficulté acceptés
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez les niveaux de difficulté que vous souhaitez recevoir
              </p>

              <div className="grid grid-cols-3 gap-3">
                {DIFFICULTIES.map((difficulty) => (
                  <button
                    key={difficulty.id}
                    onClick={() => toggleDifficulty(difficulty.id)}
                    className={`p-4 rounded-lg font-semibold transition-all border-2 ${
                      allowedDifficulties.includes(difficulty.id)
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    {difficulty.name}
                  </button>
                ))}
              </div>

              {allowedDifficulties.length === 0 && (
                <p className="text-sm text-red-600 mt-3">
                  ⚠️ Vous devez sélectionner au moins un niveau de difficulté
                </p>
              )}
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={
            saving ||
            (mode === 'categories' &&
              (allowedCategories.length === 0 || allowedDifficulties.length === 0))
          }
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Enregistrement...' : '💾 Enregistrer les préférences'}
        </button>
      </div>

      <Navigation />
    </div>
  );
}
