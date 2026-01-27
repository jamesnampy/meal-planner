'use client';

import { Recipe } from '@/types';

interface MealCardProps {
  day: string;
  date: string;
  recipe: Recipe | null;
  approved: boolean;
  onApprove: () => void;
  onRegenerate: () => void;
}

export default function MealCard({
  day,
  date,
  recipe,
  approved,
  onApprove,
  onRegenerate,
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

  return (
    <div
      className={`rounded-lg p-4 border-2 transition-colors ${
        approved
          ? 'bg-green-50 border-green-300'
          : 'bg-white border-gray-200 hover:border-emerald-300'
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-800">{day}</h3>
        <span className="text-sm text-gray-500">{date}</span>
      </div>

      <div className="mb-3">
        <p className="text-lg font-medium text-gray-900">{recipe.name}</p>
        <div className="flex gap-2 mt-1">
          <span className="text-xs text-gray-500">{recipe.prepTime} min</span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-500">{recipe.cuisine}</span>
          {recipe.kidFriendly && (
            <>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-green-600">Kid-Friendly</span>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {!approved && (
          <button
            onClick={onApprove}
            className="flex-1 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors"
          >
            Approve
          </button>
        )}
        <button
          onClick={onRegenerate}
          className="flex-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
        >
          {approved ? 'Change' : 'Different Recipe'}
        </button>
      </div>
    </div>
  );
}
