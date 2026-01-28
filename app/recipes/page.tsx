'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Recipe } from '@/types';
import RecipeCard from '@/components/RecipeCard';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'adults' | 'kids'>('all');

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/recipes');
      const data = await res.json();
      setFavorites(data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromFavorites = async (id: string) => {
    if (!confirm('Remove this recipe from favorites?')) return;

    try {
      await fetch(`/api/recipes?id=${id}`, { method: 'DELETE' });
      setFavorites(favorites.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
    }
  };

  const filteredFavorites = favorites.filter(recipe => {
    if (filter === 'adults') return recipe.targetAudience === 'adults' || recipe.targetAudience === 'both';
    if (filter === 'kids') return recipe.kidFriendly || recipe.targetAudience === 'kids' || recipe.targetAudience === 'both';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Favorite Recipes</h1>
          <p className="text-gray-600 mt-1">
            Your saved recipes from previous meal plans
          </p>
        </div>
        <Link
          href="/recipes/new?ai=true"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          AI Search
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'adults', 'kids'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'adults' ? 'Adult Meals' : 'Kid-Friendly'}
          </button>
        ))}
      </div>

      {filteredFavorites.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No favorites yet</h3>
          <p className="mt-2 text-gray-500">
            Generate a meal plan and mark recipes as favorites to save them here.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-emerald-600 hover:underline"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onToggleFavorite={() => {}} // Already a favorite
              onDelete={() => handleRemoveFromFavorites(recipe.id)}
              showDeleteAsRemove
            />
          ))}
        </div>
      )}
    </div>
  );
}
