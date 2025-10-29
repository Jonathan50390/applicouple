'use client';

import { Reward } from '@/lib/types';

interface RewardBadgeProps {
  reward: Reward;
  unlocked?: boolean;
  unlockedAt?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RewardBadge({ reward, unlocked = false, unlockedAt, size = 'md' }: RewardBadgeProps) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-20 h-20 text-3xl',
    lg: 'w-24 h-24 text-4xl',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
          unlocked
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg'
            : 'bg-gray-200 grayscale opacity-50'
        } transition-all`}
      >
        <span>{reward.icon}</span>
      </div>
      <div className="text-center">
        <p className={`font-semibold text-sm ${unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
          {reward.name}
        </p>
        <p className="text-xs text-gray-500">{reward.description}</p>
        {unlocked && unlockedAt && (
          <p className="text-xs text-green-600 mt-1">
            Débloqué le {new Date(unlockedAt).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>
    </div>
  );
}
