'use client';

import { WeeklyPlan, Recipe, Meal } from '@/types';
import MealCard from './MealCard';

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
          Click "Generate Plan" to create a new weekly meal plan.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {plan.meals.map((meal) => (
        <MealCard
          key={meal.day}
          day={meal.day}
          date={meal.date}
          recipe={meal.adultRecipe}
          approved={meal.approved}
          sharedMeal={meal.sharedMeal}
          onApprove={() => onApprove(meal.day)}
        />
      ))}
    </div>
  );
}
