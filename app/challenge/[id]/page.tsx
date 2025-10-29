'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Challenge, ChallengeComment, CompletedChallenge } from '@/lib/types';
import { CATEGORIES, DIFFICULTIES } from '@/lib/types';
import Navigation from '@/components/Navigation';

export default function ChallengePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [comments, setComments] = useState<ChallengeComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadChallengeData();
    }
  }, [user, authLoading, challengeId]);

  const loadChallengeData = async () => {
    setLoading(true);

    const { data: challengeData } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    const { data: commentsData } = await supabase
      .from('challenge_comments')
      .select('*, profile:profiles(*)')
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: false });

    const { data: completedData } = await supabase
      .from('completed_challenges')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', user!.id)
      .maybeSingle();

    if (challengeData) setChallenge(challengeData);
    if (commentsData) setComments(commentsData);
    if (completedData) setIsCompleted(true);

    setLoading(false);
  };

  const handleComplete = async () => {
    if (!challenge || !user || !profile || isCompleted) return;

    const { error } = await supabase.from('completed_challenges').insert({
      user_id: user.id,
      challenge_id: challenge.id,
    });

    if (!error) {
      const newPoints = profile.points + challenge.points_reward;
      const newLevel = Math.floor(newPoints / 100) + 1;

      await supabase
        .from('profiles')
        .update({
          points: newPoints,
          level: newLevel,
        })
        .eq('id', user.id);

      await refreshProfile();
      setIsCompleted(true);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const { error } = await supabase.from('challenge_comments').insert({
      challenge_id: challengeId,
      user_id: user.id,
      content: newComment,
    });

    if (!error) {
      setNewComment('');
      await loadChallengeData();
    }
  };

  if (loading || !challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
        <div className="text-2xl font-bold text-gray-600">Chargement...</div>
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.id === challenge.category);
  const difficulty = DIFFICULTIES.find((d) => d.id === challenge.difficulty);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-pink-600 hover:text-pink-700 font-semibold"
        >
          ← Retour
        </button>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-6xl">{category?.icon}</span>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {challenge.title}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-semibold">
                  {category?.name}
                </span>
                <span className="text-sm px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                  {difficulty?.name}
                </span>
                <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
                  {challenge.points_reward} points
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-700 text-lg mb-6 leading-relaxed">
            {challenge.description}
          </p>

          <button
            onClick={handleComplete}
            disabled={isCompleted}
            className={`w-full py-3 px-6 rounded-lg font-bold text-lg transition-all ${
              isCompleted
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700'
            }`}
          >
            {isCompleted ? '✓ Défi complété !' : 'Marquer comme complété'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Commentaires ({comments.length})
          </h2>

          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-gray-900 mb-2"
              placeholder="Partagez votre expérience..."
              rows={3}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publier
            </button>
          </form>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Aucun commentaire pour le moment. Soyez le premier à partager votre expérience !
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {comment.profile?.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {comment.profile?.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
