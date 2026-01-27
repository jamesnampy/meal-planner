'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WeeklyPlan, Recipe, Meal, PrepSuggestions as PrepSuggestionsType } from '@/types';
import PrepSuggestions from '@/components/PrepSuggestions';

interface MealCardProps {
  recipe: Recipe | null;
  audience: 'adults' | 'kids';
  isRegenerating: boolean;
  onRegenerate: () => void;
  onPickDifferent: () => void;
  sourceWebsite?: string;
}

function MealCard({ recipe, audience, isRegenerating, onRegenerate, onPickDifferent, sourceWebsite }: MealCardProps) {
  const icon = audience === 'adults' ? '🧑' : '👶';
  const label = audience === 'adults' ? 'ADULT MEAL' : 'KIDS MEAL';

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <span>{icon}</span>
        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
      </div>

      {recipe ? (
        <div>
          <h3 className="text-lg font-medium text-gray-800">{recipe.name}</h3>
          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
            <span className="capitalize">{recipe.cuisine}</span>
            <span>•</span>
            <span>{recipe.prepTime} min</span>
            {sourceWebsite && (
              <>
                <span>•</span>
                <span className="text-blue-600">{sourceWebsite}</span>
              </>
            )}
          </div>
          <div className="mt-3">
            <p className="text-sm text-gray-600 line-clamp-2">
              {recipe.ingredients.slice(0, 5).map(i => i.name).join(', ')}
              {recipe.ingredients.length > 5 && ` +${recipe.ingredients.length - 5} more`}
            </p>
          </div>
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
          {isRegenerating ? 'Searching...' : 'AI Suggest'}
        </button>
        <button
          onClick={onPickDifferent}
          className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100"
        >
          Pick Different
        </button>
      </div>
    </div>
  );
}

export default function PlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null);
  const [regeneratingAudience, setRegeneratingAudience] = useState<'adults' | 'kids' | null>(null);
  const [prepSuggestions, setPrepSuggestions] = useState<PrepSuggestionsType | null>(null);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [showPrepSection, setShowPrepSection] = useState(false);

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

  // Helper to get recipe IDs from meal (handles legacy single recipeId)
  const getMealRecipeIds = (meal: Meal): { adultRecipeId: string; kidsRecipeId: string; sharedMeal: boolean } => {
    if (meal.adultRecipeId && meal.kidsRecipeId) {
      return {
        adultRecipeId: meal.adultRecipeId,
        kidsRecipeId: meal.kidsRecipeId,
        sharedMeal: meal.sharedMeal || false,
      };
    }
    // Legacy support: single recipeId for both
    const legacyId = meal.recipeId || '';
    return {
      adultRecipeId: legacyId,
      kidsRecipeId: legacyId,
      sharedMeal: true,
    };
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
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to regenerate meal:', error);
      alert('Failed to regenerate meal with AI');
    } finally {
      setRegeneratingDay(null);
      setRegeneratingAudience(null);
    }
  };

  const handleRegenerateFromExisting = async (day: string, targetAudience: 'adults' | 'kids') => {
    try {
      const res = await fetch('/api/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, targetAudience }),
      });
      const updatedPlan = await res.json();
      setPlan(updatedPlan);
    } catch (error) {
      console.error('Failed to regenerate meal:', error);
    }
  };

  const handleToggleSharedMeal = async (day: string) => {
    if (!plan) return;

    const meal = plan.meals.find(m => m.day === day);
    if (!meal) return;

    const { adultRecipeId, sharedMeal } = getMealRecipeIds(meal);

    try {
      const res = await fetch('/api/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day,
          sharedMeal: !sharedMeal,
          kidsRecipeId: !sharedMeal ? adultRecipeId : undefined,
        }),
      });
      const updatedPlan = await res.json();
      setPlan(updatedPlan);
    } catch (error) {
      console.error('Failed to toggle shared meal:', error);
    }
  };

  const handleGeneratePrepSuggestions = async () => {
    setLoadingPrep(true);
    setShowPrepSection(true);
    try {
      const res = await fetch('/api/plan/prep-suggestions', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setPrepSuggestions(data);
      }
    } catch (error) {
      console.error('Failed to generate prep suggestions:', error);
      alert('Failed to generate prep suggestions');
    } finally {
      setLoadingPrep(false);
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
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Approve All
          </button>
        )}
      </div>

      <div className="space-y-6">
        {plan.meals.map((meal) => {
          const { adultRecipeId, kidsRecipeId, sharedMeal } = getMealRecipeIds(meal);
          const adultRecipe = getRecipeForMeal(adultRecipeId);
          const kidsRecipe = getRecipeForMeal(kidsRecipeId);
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
                  {sharedMeal && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Shared Meal
                    </span>
                  )}
                </div>
                {!meal.approved && (
                  <button
                    onClick={() => handleApprove(meal.day)}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                  >
                    Approve Day
                  </button>
                )}
              </div>

              {/* Meal Cards */}
              {sharedMeal ? (
                /* Single shared meal display */
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span>🧑👶</span>
                    <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">SHARED MEAL (Adults & Kids)</span>
                  </div>
                  {adultRecipe ? (
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">{adultRecipe.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
                        <span className="capitalize">{adultRecipe.cuisine}</span>
                        <span>•</span>
                        <span>{adultRecipe.prepTime} min</span>
                        <span>•</span>
                        <span>{adultRecipe.servings} servings</span>
                        {adultRecipe.sourceWebsite && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">{adultRecipe.sourceWebsite}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          {adultRecipe.ingredients.map(i => `${i.amount} ${i.unit} ${i.name}`).join(', ')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Recipe not found</p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleRegenerateWithAI(meal.day, 'adults')}
                      disabled={isRegeneratingAdult}
                      className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isRegeneratingAdult ? 'Searching...' : 'AI Suggest'}
                    </button>
                    <button
                      onClick={() => handleRegenerateFromExisting(meal.day, 'adults')}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100"
                    >
                      Pick Different
                    </button>
                  </div>
                </div>
              ) : (
                /* Separate adult and kids meals */
                <div className="grid md:grid-cols-2 gap-4">
                  <MealCard
                    recipe={adultRecipe}
                    audience="adults"
                    isRegenerating={isRegeneratingAdult}
                    onRegenerate={() => handleRegenerateWithAI(meal.day, 'adults')}
                    onPickDifferent={() => handleRegenerateFromExisting(meal.day, 'adults')}
                    sourceWebsite={adultRecipe?.sourceWebsite}
                  />
                  <MealCard
                    recipe={kidsRecipe}
                    audience="kids"
                    isRegenerating={isRegeneratingKids}
                    onRegenerate={() => handleRegenerateWithAI(meal.day, 'kids')}
                    onPickDifferent={() => handleRegenerateFromExisting(meal.day, 'kids')}
                    sourceWebsite={kidsRecipe?.sourceWebsite}
                  />
                </div>
              )}

              {/* Toggle shared meal */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sharedMeal}
                    onChange={() => handleToggleSharedMeal(meal.day)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-600">Use same meal for both adults and kids</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {plan.status === 'approved' && (
        <div className="mt-8 space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
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

          {/* Prep Suggestions Section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => {
                if (!showPrepSection) {
                  setShowPrepSection(true);
                  if (!prepSuggestions && !loadingPrep) {
                    handleGeneratePrepSuggestions();
                  }
                } else {
                  setShowPrepSection(!showPrepSection);
                }
              }}
              className="w-full p-4 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between hover:from-purple-100 hover:to-indigo-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍳</span>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">Weekend Meal Prep</h3>
                  <p className="text-sm text-gray-600">Get AI-powered prep suggestions for the week ahead</p>
                </div>
              </div>
              <span className="text-gray-400 text-xl">
                {showPrepSection ? '▲' : '▼'}
              </span>
            </button>

            {showPrepSection && (
              <div className="p-6 bg-white">
                {loadingPrep ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-gray-600">Analyzing your meal plan and generating prep suggestions...</p>
                  </div>
                ) : prepSuggestions ? (
                  <div>
                    <PrepSuggestions suggestions={prepSuggestions} />
                    <button
                      onClick={handleGeneratePrepSuggestions}
                      className="mt-4 px-4 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
                    >
                      Regenerate Suggestions
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <button
                      onClick={handleGeneratePrepSuggestions}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Generate Prep Suggestions
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
