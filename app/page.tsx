'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WeeklyPlan, Recipe } from '@/types';
import WeeklyCalendar from '@/components/WeeklyCalendar';

export default function Dashboard() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [planRes, favoritesRes] = await Promise.all([
        fetch('/api/plan'),
        fetch('/api/recipes'),
      ]);
      const planData = await planRes.json();
      const favoritesData = await favoritesRes.json();
      const { locked, ...planOnly } = planData;
      setPlan(planOnly);
      setFavorites(favoritesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/plan/generate', { method: 'POST' });
      const newPlan = await res.json();
      if (newPlan.error) {
        alert(newPlan.error);
      } else {
        setPlan(newPlan);
      }
    } catch (error) {
      console.error('Failed to generate plan:', error);
      alert('Failed to generate meal plan. Make sure your API key is configured.');
    } finally {
      setGenerating(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const approvedCount = plan?.meals.filter(m => m.approved).length || 0;
  const totalMeals = plan?.meals.length || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">This Week's Meals</h1>
          {plan && plan.meals.length > 0 && (
            <p className="text-gray-600 mt-1">
              Week of {plan.weekStart} • {approvedCount}/{totalMeals} approved
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={generatePlan}
            disabled={generating}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? 'Generating...' : 'Generate Plan'}
          </button>
          {plan && approvedCount < totalMeals && totalMeals > 0 && (
            <Link
              href="/plan"
              className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Review All
            </Link>
          )}
        </div>
      </div>

      {generating && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p className="text-purple-800">
            AI is generating your personalized meal plan. This may take a moment...
          </p>
        </div>
      )}

      {plan && <WeeklyCalendar plan={plan} onApprove={handleApprove} />}

      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <Link
          href="/recipes"
          className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Favorite Recipes</h2>
          <p className="text-gray-600">{favorites.length} favorites saved</p>
        </Link>
        <Link
          href="/plan"
          className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Meal Plan</h2>
          <p className="text-gray-600">Review and approve meals</p>
        </Link>
        <Link
          href="/shopping-list"
          className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Shopping List</h2>
          <p className="text-gray-600">Ingredients for approved meals</p>
        </Link>
      </div>
    </div>
  );
}
