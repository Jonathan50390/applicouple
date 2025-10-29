'use client';

import { Challenge } from '@/lib/types';
import { CATEGORIES, DIFFICULTIES } from '@/lib/types';

interface ChallengeCardProps {
  challenge: Challenge;
  onComplete?: () => void;
  onVote?: (voteType: 'up' | 'down') => void;
  onClick?: () => void;
  userVote?: 'up' | 'down' | null;
  isCompleted?: boolean;
}

export default function ChallengeCard({
  challenge,
  onComplete,
  onVote,
  onClick,
  userVote,
  isCompleted
}: ChallengeCardProps) {
  const category = CATEGORIES.find(c => c.id === challenge.category);
  const difficulty = DIFFICULTIES.find(d => d.id === challenge.difficulty);

  return (
    <div
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer border-2 border-gray-100"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{category?.icon}</span>
          <div>
            <h3 className="font-bold text-xl text-gray-800">{challenge.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-700">
                {category?.name}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                {difficulty?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-2">{challenge.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500 font-bold">{challenge.points_reward}</span>
            <span className="text-sm text-gray-500">pts</span>
          </div>

          {onVote && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote('up');
                }}
                className={`p-1 rounded ${userVote === 'up' ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
              >
                ▲
              </button>
              <span className="text-sm font-semibold">{challenge.votes_count}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote('down');
                }}
                className={`p-1 rounded ${userVote === 'down' ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
              >
                ▼
              </button>
            </div>
          )}
        </div>

        {onComplete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            disabled={isCompleted}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              isCompleted
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600'
            }`}
          >
            {isCompleted ? '✓ Complété' : 'Compléter'}
          </button>
        )}
      </div>
    </div>
  );
}
