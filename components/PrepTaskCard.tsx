'use client';

import { PrepTask, PrepTaskCategory } from '@/types';

interface PrepTaskCardProps {
  task: PrepTask;
  onToggleComplete: (taskId: string, completed: boolean) => void;
}

const categoryLabels: Record<PrepTaskCategory, string> = {
  'vegetable-prep': 'Vegetable Prep',
  'protein-prep': 'Protein Prep',
  'grain-cooking': 'Grain Cooking',
  'sauce-dressing': 'Sauce & Dressing',
  'spice-blend': 'Spice Blend',
  'other': 'Other',
};

const categoryIcons: Record<PrepTaskCategory, string> = {
  'vegetable-prep': '🥬',
  'protein-prep': '🥩',
  'grain-cooking': '🍚',
  'sauce-dressing': '🥫',
  'spice-blend': '🧂',
  'other': '📋',
};

export default function PrepTaskCard({ task, onToggleComplete }: PrepTaskCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        task.completed
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200 hover:border-emerald-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="pt-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleComplete(task.id, !task.completed)}
            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        {/* Icon */}
        <span className="text-2xl">{categoryIcons[task.category]}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category and time */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {categoryLabels[task.category]}
            </span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs text-emerald-600 font-medium">
              {task.estimatedMinutes} min
            </span>
          </div>

          {/* Title */}
          <h4
            className={`font-semibold ${
              task.completed ? 'text-gray-500 line-through' : 'text-gray-800'
            }`}
          >
            {task.title}
          </h4>

          {/* Description */}
          <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
            {task.description}
          </p>

          {/* Ingredients */}
          {task.ingredients.length > 0 && (
            <div className="mt-3">
              <span className="text-xs font-medium text-gray-500">Ingredients:</span>
              <p className="text-sm text-gray-600">{task.ingredients.join(', ')}</p>
            </div>
          )}

          {/* Storage instructions */}
          <div className="mt-3 p-2 bg-amber-50 rounded text-sm">
            <span className="font-medium text-amber-800">Storage: </span>
            <span className="text-amber-700">{task.storageInstructions}</span>
          </div>

          {/* Linked meals */}
          <div className="flex flex-wrap gap-1 mt-3">
            {task.linkedMealDays.map((day, idx) => (
              <span
                key={`${day}-${idx}`}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
