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
    <div className={`bg-white border border-gray-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Niveau</span>
          <span className="text-lg font-bold text-gray-800">{level}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>{points % 100} / 100 pts</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Total</span>
          <span className="text-lg font-bold text-gray-800">{points}</span>
        </div>
      </div>
    </div>
  );
}
