'use client';

import { WeeklyPlan } from '@/types';

interface WeeklyCalendarProps {
  plan: WeeklyPlan;
  onApprove: (day: string) => void;
}

export default function WeeklyCalendar({
  plan,
  onApprove,
}: WeeklyCalendarProps) {
  if (plan.meals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No meal plan generated yet.</p>
        <p className="text-sm text-gray-400">
          Click &quot;Generate Plan&quot; to create a new weekly meal plan.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {plan.meals.map((meal) => (
        <div key={meal.day} className={`rounded-lg border-2 transition-colors ${
          meal.approved
            ? 'bg-green-50 border-green-300'
            : 'bg-white border-gray-200'
        }`}>
          {/* Day header */}
          <div className="flex justify-between items-center px-4 pt-4 pb-2">
            <h3 className="font-semibold text-gray-800">{meal.day}</h3>
            <span className="text-sm text-gray-500">{meal.date}</span>
          </div>

          {/* Adult meal */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">🧑</span>
              <span className="text-xs font-medium text-gray-500 uppercase">Adults</span>
            </div>
            {meal.adultRecipe ? (
              <div>
                <p className="text-sm font-medium text-gray-900 leading-snug">{meal.adultRecipe.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-xs text-gray-500">{meal.adultRecipe.prepTime} min</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500 capitalize">{meal.adultRecipe.cuisine}</span>
                  {meal.adultRecipe.sourceWebsite && (
                    <>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-blue-600 truncate max-w-[100px]">{meal.adultRecipe.sourceWebsite}</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No meal planned</p>
            )}
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-gray-200"></div>

          {/* Kids meal */}
          <div className="px-4 pt-2 pb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">👶</span>
              <span className="text-xs font-medium text-gray-500 uppercase">Kids</span>
            </div>
            {meal.kidsRecipe ? (
              <div>
                <p className="text-sm font-medium text-gray-900 leading-snug">{meal.kidsRecipe.name}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-xs text-gray-500">{meal.kidsRecipe.prepTime} min</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500 capitalize">{meal.kidsRecipe.cuisine}</span>
                  {meal.kidsRecipe.sourceWebsite && (
                    <>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-blue-600 truncate max-w-[100px]">{meal.kidsRecipe.sourceWebsite}</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No meal planned</p>
            )}
          </div>

          {/* Approve button */}
          {!meal.approved ? (
            <div className="px-4 pb-4">
              <button
                onClick={() => onApprove(meal.day)}
                className="w-full px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors"
              >
                Approve
              </button>
            </div>
          ) : (
            <div className="px-4 pb-3">
              <span className="text-xs text-green-600 font-medium">Approved</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
