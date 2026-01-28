'use client';

import { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  showDeleteAsRemove?: boolean;
}

export default function RecipeCard({
  recipe,
  onToggleFavorite,
  onDelete,
  showActions = true,
  showDeleteAsRemove = false,
}: RecipeCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{recipe.name}</h3>
        {showActions && onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            className="text-2xl focus:outline-none"
            aria-label={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {recipe.isFavorite ? '⭐' : '☆'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
          {recipe.cuisine}
        </span>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
          {recipe.prepTime} min
        </span>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
          {recipe.servings} servings
        </span>
        {recipe.kidFriendly && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            Kid-Friendly
          </span>
        )}
      </div>

      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-700 mb-1">Ingredients:</h4>
        <p className="text-sm text-gray-600">
          {recipe.ingredients.slice(0, 4).map(i => i.name).join(', ')}
          {recipe.ingredients.length > 4 && ` +${recipe.ingredients.length - 4} more`}
        </p>
      </div>

      {showActions && onDelete && (
        <div className="flex justify-end pt-2 border-t">
          <button
            onClick={() => onDelete(recipe.id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            {showDeleteAsRemove ? 'Remove from Favorites' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
}
