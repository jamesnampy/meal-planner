'use client';

import { PrepSuggestions as PrepSuggestionsType, PrepTask, PrepCategory } from '@/types';

interface PrepSuggestionsProps {
  suggestions: PrepSuggestionsType;
}

const categoryLabels: Record<PrepCategory, string> = {
  proteins: 'Proteins',
  vegetables: 'Vegetables',
  grains: 'Grains',
  sauces: 'Sauces & Dressings',
  spices: 'Spice Blends',
};

const categoryIcons: Record<PrepCategory, string> = {
  proteins: '🥩',
  vegetables: '🥬',
  grains: '🍚',
  sauces: '🥫',
  spices: '🧂',
};

function PrepTaskCard({ task }: { task: PrepTask }) {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{categoryIcons[task.category]}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {categoryLabels[task.category]}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-emerald-600 font-medium">
              {task.timeMinutes} min
            </span>
          </div>
          <p className="text-gray-800 font-medium">{task.task}</p>
          <p className="text-sm text-gray-500 mt-2">
            <span className="font-medium">Storage:</span> {task.storageInstructions}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {task.linkedMeals.map((meal) => (
              <span
                key={meal}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {meal}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DaySection({ day, tasks, icon }: { day: string; tasks: PrepTask[]; icon: string }) {
  const totalTime = tasks.reduce((sum, t) => sum + t.timeMinutes, 0);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{day}</h3>
          <p className="text-sm text-gray-500">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} • ~{totalTime} minutes
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <PrepTaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export default function PrepSuggestions({ suggestions }: PrepSuggestionsProps) {
  const { saturdayTasks, sundayTasks, totalPrepTime } = suggestions;

  if (saturdayTasks.length === 0 && sundayTasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No prep suggestions available.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⏱️</span>
          <div>
            <p className="text-emerald-800 font-semibold">Total Weekend Prep Time</p>
            <p className="text-2xl font-bold text-emerald-700">
              ~{totalPrepTime} minutes
            </p>
          </div>
        </div>
      </div>

      <DaySection day="Saturday" tasks={saturdayTasks} icon="📅" />
      <DaySection day="Sunday" tasks={sundayTasks} icon="🗓️" />

      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-amber-800 text-sm">
          <span className="font-semibold">Pro tip:</span> Saturday prep focuses on items that keep well (marinades, spice blends).
          Sunday prep handles items best used fresh (delicate greens, final assembly).
        </p>
      </div>
    </div>
  );
}
