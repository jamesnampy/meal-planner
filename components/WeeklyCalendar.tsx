'use client';

import { WeeklyPlan, Recipe, Meal } from '@/types';
import MealCard from './MealCard';

interface WeeklyCalendarProps {
  plan: WeeklyPlan;
  recipes: Recipe[];
  onApprove: (day: string) => void;
  onRegenerate: (day: string) => void;
}

export default function WeeklyCalendar({
  plan,
  recipes,
  onApprove,
  onRegenerate,
}: WeeklyCalendarProps) {
  const getRecipeForMeal = (recipeId: string): Recipe | null => {
    return recipes.find(r => r.id === recipeId) || null;
  };

  // Get the primary recipe ID for display (adult recipe, falling back to legacy recipeId)
  const getPrimaryRecipeId = (meal: Meal): string => {
    return meal.adultRecipeId || meal.recipeId || '';
  };

  if (plan.meals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No meal plan generated yet.</p>
        <p className="text-sm text-gray-400">
          Click "Generate Plan" to create a new weekly meal plan.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {plan.meals.map((meal) => {
        const primaryRecipeId = getPrimaryRecipeId(meal);
        return (
          <MealCard
            key={meal.day}
            day={meal.day}
            date={meal.date}
            recipe={primaryRecipeId ? getRecipeForMeal(primaryRecipeId) : null}
            approved={meal.approved}
            sharedMeal={meal.sharedMeal}
            onApprove={() => onApprove(meal.day)}
            onRegenerate={() => onRegenerate(meal.day)}
          />
        );
      })}
    </div>
  );
}
