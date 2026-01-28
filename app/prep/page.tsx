'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WeeklyPrepPlan, PrepTask, WeeklyPlan } from '@/types';
import PrepTaskCard from '@/components/PrepTaskCard';

function DaySection({
  day,
  tasks,
  icon,
  onToggleComplete,
}: {
  day: string;
  tasks: PrepTask[];
  icon: string;
  onToggleComplete: (taskId: string, completed: boolean) => void;
}) {
  const totalTime = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const completedCount = tasks.filter(t => t.completed).length;

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{day}</h3>
            <p className="text-sm text-gray-500">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} | ~{totalTime} minutes
            </p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`text-sm font-medium ${
              completedCount === tasks.length ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            {completedCount} of {tasks.length} completed
          </span>
          {completedCount === tasks.length && tasks.length > 0 && (
            <span className="ml-2 text-green-500">✓</span>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <PrepTaskCard key={task.id} task={task} onToggleComplete={onToggleComplete} />
        ))}
      </div>
    </div>
  );
}

export default function PrepPage() {
  const router = useRouter();
  const [prepPlan, setPrepPlan] = useState<WeeklyPrepPlan | null>(null);
  const [mealPlan, setMealPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prepRes, planRes] = await Promise.all([
        fetch('/api/prep'),
        fetch('/api/plan'),
      ]);
      const prepData = await prepRes.json();
      const planData = await planRes.json();
      setPrepPlan(prepData);
      setMealPlan(planData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/prep/generate', { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setPrepPlan(data);
      }
    } catch (error) {
      console.error('Failed to generate prep plan:', error);
      alert('Failed to generate prep plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      const res = await fetch('/api/prep', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed }),
      });
      const updatedPlan = await res.json();
      if (updatedPlan.error) {
        console.error('Failed to update task:', updatedPlan.error);
      } else {
        setPrepPlan(updatedPlan);
      }
    } catch (error) {
      console.error('Failed to update task completion:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Check if meal plan exists and is approved
  const canGenerate = mealPlan && mealPlan.status === 'approved' && mealPlan.meals.length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Prep</h1>
          {mealPlan && (
            <p className="text-gray-600 mt-1">
              Week of {mealPlan.weekStart}
              {prepPlan && ` | Total prep time: ~${prepPlan.totalPrepTimeMinutes} minutes`}
            </p>
          )}
        </div>
        {prepPlan && (
          <button
            onClick={handleGenerate}
            disabled={generating || !canGenerate}
            className="px-4 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 disabled:opacity-50"
          >
            {generating ? 'Regenerating...' : 'Regenerate Plan'}
          </button>
        )}
      </div>

      {/* No meal plan or not approved */}
      {!canGenerate && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Approved Meal Plan</h2>
          <p className="text-gray-600 mb-6">
            You need an approved meal plan before generating prep tasks.
          </p>
          <button
            onClick={() => router.push('/plan')}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Go to Meal Plan
          </button>
        </div>
      )}

      {/* Has approved plan but no prep plan */}
      {canGenerate && !prepPlan && (
        <div className="text-center py-12 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
          <div className="text-6xl mb-4">🍳</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Generate Prep Plan</h2>
          <p className="text-gray-600 mb-6">
            Create AI-powered weekend prep tasks based on your approved meal plan.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Generating...
              </span>
            ) : (
              'Generate Prep Plan'
            )}
          </button>
        </div>
      )}

      {/* Generating spinner */}
      {generating && !prepPlan && (
        <div className="flex flex-col items-center justify-center py-12 mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Analyzing your meals and creating prep tasks...</p>
        </div>
      )}

      {/* Has prep plan */}
      {prepPlan && (
        <div>
          {/* Summary card */}
          <div className="mb-8 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏱️</span>
              <div>
                <p className="text-emerald-800 font-semibold">Total Weekend Prep Time</p>
                <p className="text-2xl font-bold text-emerald-700">
                  ~{prepPlan.totalPrepTimeMinutes} minutes
                </p>
              </div>
            </div>
          </div>

          {/* Saturday tasks */}
          <DaySection
            day="Saturday"
            tasks={prepPlan.saturdayTasks}
            icon="📅"
            onToggleComplete={handleToggleComplete}
          />

          {/* Sunday tasks */}
          <DaySection
            day="Sunday"
            tasks={prepPlan.sundayTasks}
            icon="🗓️"
            onToggleComplete={handleToggleComplete}
          />

          {/* No tasks */}
          {prepPlan.saturdayTasks.length === 0 && prepPlan.sundayTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No prep tasks generated. Try regenerating the plan.
            </div>
          )}

          {/* Pro tip */}
          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-800 text-sm">
              <span className="font-semibold">Pro tip:</span> Saturday prep focuses on items that keep well (marinades, spice blends).
              Sunday prep handles items best used fresh (delicate greens, items used early in the week).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
