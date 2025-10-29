'use client';

interface PointsDisplayProps {
  points: number;
  level: number;
  className?: string;
}

export default function PointsDisplay({ points, level, className = '' }: PointsDisplayProps) {
  const nextLevelPoints = level * 100;
  const progress = (points % 100) / 100 * 100;

  return (
    <div className={`bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm opacity-90">Niveau</p>
          <p className="text-3xl font-bold">{level}</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-90">Points</p>
          <p className="text-2xl font-bold">{points}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span>Progression</span>
          <span>{points % 100} / 100</span>
        </div>
        <div className="w-full bg-white/30 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
