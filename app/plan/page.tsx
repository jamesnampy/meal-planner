'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WeeklyPlan, Recipe } from '@/types';

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [planRes, recipesRes] = await Promise.all([
        fetch('/api/plan'),
        fetch('/api/recipes'),
      ]);
      const planData = await planRes.json();
      const recipesData = await recipesRes.json();
      setPlan(planData);
      setRecipes(recipesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecipeForMeal = (recipeId: string): Recipe | null => {
    return recipes.find(r => r.id === recipeId) || null;
  };

  const handleApprove = async (day: string) => {
    try {
      const res = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, approved: true }),
      });
      const updatedPlan = await res.json();
      setPlan(updatedPlan);
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
      const updatedPlan = await res.json();
      setPlan(updatedPlan);
    } catch (error) {
      console.error('Failed to approve all:', error);
    }
  };

  const handleRegenerateWithAI = async (day: string) => {
    setRegeneratingDay(day);
    try {
      const res = await fetch('/api/plan/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        // Refresh data to get the new recipe and updated plan
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to regenerate meal:', error);
      alert('Failed to regenerate meal with AI');
    } finally {
      setRegeneratingDay(null);
    }
  };

  const handleRegenerateFromExisting = async (day: string) => {
    try {
      const res = await fetch('/api/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day }),
      });
      const updatedPlan = await res.json();
      setPlan(updatedPlan);
    } catch (error) {
      console.error('Failed to regenerate meal:', error);
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
            Week of {plan.weekStart} • {unapprovedCount} meals need approval
          </p>
        </div>
        {unapprovedCount > 0 && (
          <button
            onClick={handleApproveAll}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Approve All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {plan.meals.map((meal) => {
          const recipe = getRecipeForMeal(meal.recipeId);
          const isRegenerating = regeneratingDay === meal.day;

          return (
            <div
              key={meal.day}
              className={`p-6 rounded-lg border-2 transition-colors ${
                meal.approved
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-gray-900">{meal.day}</h2>
                    <span className="text-sm text-gray-500">{meal.date}</span>
                    {meal.approved && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Approved
                      </span>
                    )}
                  </div>

                  {recipe ? (
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">{recipe.name}</h3>
                      <div className="flex gap-3 mt-1 text-sm text-gray-600">
                        <span>{recipe.cuisine}</span>
                        <span>•</span>
                        <span>{recipe.prepTime} min</span>
                        <span>•</span>
                        <span>{recipe.servings} servings</span>
                        {recipe.kidFriendly && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">Kid-Friendly</span>
                          </>
                        )}
                        {recipe.isFavorite && (
                          <>
                            <span>•</span>
                            <span className="text-yellow-600">Favorite</span>
                          </>
                        )}
                      </div>
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Ingredients:</h4>
                        <p className="text-sm text-gray-600">
                          {recipe.ingredients.map(i => `${i.amount} ${i.unit} ${i.name}`).join(', ')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Recipe not found</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {!meal.approved && (
                    <button
                      onClick={() => handleApprove(meal.day)}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleRegenerateWithAI(meal.day)}
                    disabled={isRegenerating}
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isRegenerating ? 'AI Searching...' : 'AI Suggest'}
                  </button>
                  <button
                    onClick={() => handleRegenerateFromExisting(meal.day)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                  >
                    Pick Different
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {plan.status === 'approved' && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-center">
            All meals approved! View your{' '}
            <button
              onClick={() => router.push('/shopping-list')}
              className="underline font-medium"
            >
              shopping list
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
