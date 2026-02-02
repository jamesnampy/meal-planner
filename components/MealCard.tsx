'use client';

import { Recipe } from '@/types';

interface MealCardProps {
  day: string;
  date: string;
  recipe: Recipe | null;
  approved: boolean;
  targetAudience?: 'adults' | 'kids' | 'both';
  onApprove: () => void;
}

export default function MealCard({
  day,
  date,
  recipe,
  approved,
  targetAudience = 'both',
  onApprove,
}: MealCardProps) {
  if (!recipe) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-800">{day}</h3>
          <span className="text-sm text-gray-500">{date}</span>
        </div>
        <p className="text-gray-500 italic">No meal planned</p>
      </div>
    );
  }

  const audienceIcon = targetAudience === 'adults' ? '🧑' : targetAudience === 'kids' ? '👶' : '🧑👶';
  const audienceLabel = targetAudience === 'adults' ? 'Adults' : targetAudience === 'kids' ? 'Kids' : 'Everyone';

  return (
    <div
      className={`rounded-lg p-4 border-2 transition-colors ${
        approved
          ? 'bg-green-50 border-green-300'
          : 'bg-white border-gray-200 hover:border-emerald-300'
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">{day}</h3>
        </div>
        <span className="text-sm text-gray-500">{date}</span>
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span>{audienceIcon}</span>
          <span className="text-xs font-medium text-gray-500 uppercase">{audienceLabel}</span>
        </div>
        <p className="text-lg font-medium text-gray-900">{recipe.name}</p>
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="text-xs text-gray-500">{recipe.prepTime} min</span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-500 capitalize">{recipe.cuisine}</span>
          {recipe.sourceWebsite && (
            <>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-blue-600">{recipe.sourceWebsite}</span>
            </>
          )}
          {recipe.kidFriendly && (
            <>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-green-600">Kid-Friendly</span>
            </>
          )}
          {recipe.isFavorite && (
            <>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-yellow-600">Favorite</span>
            </>
          )}
        </div>
      </div>

      {!approved && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="flex-1 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}
