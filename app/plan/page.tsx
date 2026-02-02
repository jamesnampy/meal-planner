'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WeeklyPlan, Recipe, Meal } from '@/types';

interface MealCardProps {
  recipe: Recipe | null;
  audience: 'adults' | 'kids';
  day: string;
  isRegenerating: boolean;
  onRegenerate: () => void;
  onToggleFavorite: () => void;
  onNotRecommended: () => void;
}

function MealCard({ recipe, audience, day, isRegenerating, onRegenerate, onToggleFavorite, onNotRecommended }: MealCardProps) {
  const [expanded, setExpanded] = useState(false);
  const icon = audience === 'adults' ? '🧑' : '👶';
  const label = audience === 'adults' ? 'ADULT MEAL' : 'KIDS MEAL';

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
        </div>
        {recipe && (
          <div className="flex items-center gap-1">
            <button
              onClick={onNotRecommended}
              className="p-1.5 rounded-full transition-colors text-gray-400 hover:text-orange-500 hover:bg-orange-50"
              title="Not recommended - replace and block this recipe"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />
              </svg>
            </button>
            <button
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-full transition-colors ${
                recipe.isFavorite
                  ? 'text-red-500 bg-red-50 hover:bg-red-100'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={recipe.isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {recipe ? (
        <div>
          <h3 className="text-lg font-medium text-gray-800">{recipe.name}</h3>
          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
            <span className="capitalize">{recipe.cuisine}</span>
            <span>•</span>
            <span>{recipe.prepTime} min</span>
            {recipe.sourceWebsite && (
              <>
                <span>•</span>
                <span className="text-blue-600">{recipe.sourceWebsite}</span>
              </>
            )}
          </div>

          {/* Collapsed: ingredient names summary */}
          {!expanded && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 line-clamp-2">
                {recipe.ingredients.slice(0, 5).map(i => i.name).join(', ')}
                {recipe.ingredients.length > 5 && ` +${recipe.ingredients.length - 5} more`}
              </p>
            </div>
          )}

          {/* Expanded: full recipe */}
          {expanded && (
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Ingredients</h4>
                <ul className="list-disc list-inside space-y-1">
                  {recipe.ingredients.map((ing, idx) => (
                    <li key={idx} className="text-sm text-gray-600">
                      {ing.amount} {ing.unit} {ing.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Instructions</h4>
                <ol className="list-decimal list-inside space-y-2">
                  {recipe.instructions.map((step, idx) => (
                    <li key={idx} className="text-sm text-gray-600">{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {expanded ? 'Hide Recipe' : 'View Recipe'}
          </button>
        </div>
      ) : (
        <p className="text-gray-500 italic">Recipe not found</p>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {isRegenerating ? 'Generating...' : 'AI Suggest'}
        </button>
      </div>
    </div>
  );
}

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null);
  const [regeneratingAudience, setRegeneratingAudience] = useState<'adults' | 'kids' | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/plan');
      const data = await res.json();
      const { locked: isLocked, ...planData } = data;
      setPlan(planData);
      setLocked(isLocked || false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (day: string) => {
    try {
      const res = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, approved: true }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      const { locked: isLocked, ...planData } = data;
      setPlan(planData);
      setLocked(isLocked || false);
    } catch (error) {
      console.error('Failed to approve meal:', error);
    }
  };

  const handleApproveAll = async () => {
    try {
      const res = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approveAll: true }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      const { locked: isLocked, ...planData } = data;
      setPlan(planData);
      setLocked(isLocked || false);
    } catch (error) {
      console.error('Failed to approve all:', error);
    }
  };

  const handleRegenerateWithAI = async (day: string, targetAudience: 'adults' | 'kids') => {
    setRegeneratingDay(day);
    setRegeneratingAudience(targetAudience);
    try {
      const res = await fetch('/api/plan/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, targetAudience }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setPlan(data.plan);
      }
    } catch (error) {
      console.error('Failed to regenerate meal:', error);
      alert('Failed to regenerate meal with AI');
    } finally {
      setRegeneratingDay(null);
      setRegeneratingAudience(null);
    }
  };

  const handleToggleFavorite = async (day: string, targetAudience: 'adults' | 'kids') => {
    try {
      const res = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, toggleFavorite: true, targetAudience }),
      });
      const data = await res.json();
      const { locked: isLocked, ...planData } = data;
      setPlan(planData);
      setLocked(isLocked || false);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleNotRecommended = async (day: string, audience: 'adults' | 'kids', recipeName: string) => {
    if (!confirm(`Mark "${recipeName}" as not recommended? It will be replaced and blocked from future suggestions.`)) {
      return;
    }
    try {
      const res = await fetch('/api/not-recommended', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeName, audience, day }),
      });
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
      }
    } catch (error) {
      console.error('Failed to mark not recommended:', error);
      alert('Failed to mark recipe as not recommended');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!plan || plan.meals.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Meal Plan</h1>
        <p className="text-gray-500 mb-6">No meal plan generated yet.</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const unapprovedCount = plan.meals.filter(m => !m.approved).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meal Plan Review</h1>
          <p className="text-gray-600 mt-1">
            Week of {plan.weekStart} • {unapprovedCount} days need approval
          </p>
        </div>
        {unapprovedCount > 0 && (
          <button
            onClick={handleApproveAll}
            disabled={locked}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Approve All
          </button>
        )}
      </div>

      {locked && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-center">
            Approval deadline has passed (Sunday 6 PM PT). A new plan will be generated Wednesday.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {plan.meals.map((meal) => {
          const isRegeneratingAdult = regeneratingDay === meal.day && regeneratingAudience === 'adults';
          const isRegeneratingKids = regeneratingDay === meal.day && regeneratingAudience === 'kids';

          return (
            <div
              key={meal.day}
              className={`p-6 rounded-lg border-2 transition-colors ${
                meal.approved
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">{meal.day}</h2>
                  <span className="text-sm text-gray-500">{meal.date}</span>
                  {meal.approved && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Approved
                    </span>
                  )}
                </div>
                {!meal.approved && (
                  <button
                    onClick={() => handleApprove(meal.day)}
                    disabled={locked}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Approve Day
                  </button>
                )}
              </div>

              {/* Meal Cards - always separate */}
              <div className="grid md:grid-cols-2 gap-4">
                <MealCard
                  recipe={meal.adultRecipe}
                  audience="adults"
                  day={meal.day}
                  isRegenerating={isRegeneratingAdult}
                  onRegenerate={() => handleRegenerateWithAI(meal.day, 'adults')}
                  onToggleFavorite={() => handleToggleFavorite(meal.day, 'adults')}
                  onNotRecommended={() => meal.adultRecipe && handleNotRecommended(meal.day, 'adults', meal.adultRecipe.name)}
                />
                <MealCard
                  recipe={meal.kidsRecipe}
                  audience="kids"
                  day={meal.day}
                  isRegenerating={isRegeneratingKids}
                  onRegenerate={() => handleRegenerateWithAI(meal.day, 'kids')}
                  onToggleFavorite={() => handleToggleFavorite(meal.day, 'kids')}
                  onNotRecommended={() => meal.kidsRecipe && handleNotRecommended(meal.day, 'kids', meal.kidsRecipe.name)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {plan.status === 'approved' && (
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-center">
              All meals approved! View your{' '}
              <button
                onClick={() => router.push('/shopping-list')}
                className="underline font-medium"
              >
                shopping list
              </button>
              {' '}or{' '}
              <button
                onClick={() => router.push('/prep')}
                className="underline font-medium"
              >
                weekend prep plan
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
