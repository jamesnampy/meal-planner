import { WeeklyPlan, Meal } from '@/types';
import { getData, setData } from './storage';

const PLAN_KEY = 'current-plan';

const DEFAULT_PLAN: WeeklyPlan = {
  weekStart: new Date().toISOString().split('T')[0],
  status: 'draft',
  meals: []
};

export async function getCurrentPlan(): Promise<WeeklyPlan> {
  return getData<WeeklyPlan>(PLAN_KEY, DEFAULT_PLAN);
}

export async function savePlan(plan: WeeklyPlan): Promise<void> {
  await setData(PLAN_KEY, plan);
}

export async function updateMealApproval(day: string, approved: boolean): Promise<WeeklyPlan> {
  const plan = await getCurrentPlan();
  const meal = plan.meals.find(m => m.day === day);
  if (meal) {
    meal.approved = approved;
  }
  await savePlan(plan);
  return plan;
}

export async function replaceMeal(
  day: string,
  recipeId: string,
  targetAudience: 'adults' | 'kids' | 'both' = 'both'
): Promise<WeeklyPlan> {
  const plan = await getCurrentPlan();
  const meal = plan.meals.find(m => m.day === day);
  if (meal) {
    if (targetAudience === 'adults') {
      meal.adultRecipeId = recipeId;
      // If it was a shared meal, now it's not
      if (meal.sharedMeal && meal.kidsRecipeId !== recipeId) {
        meal.sharedMeal = false;
      }
    } else if (targetAudience === 'kids') {
      meal.kidsRecipeId = recipeId;
      // If it was a shared meal, now it's not
      if (meal.sharedMeal && meal.adultRecipeId !== recipeId) {
        meal.sharedMeal = false;
      }
    } else {
      // Replace both
      meal.adultRecipeId = recipeId;
      meal.kidsRecipeId = recipeId;
      meal.sharedMeal = true;
    }
    // Legacy support
    meal.recipeId = recipeId;
    meal.approved = false;
  }
  await savePlan(plan);
  return plan;
}

export async function updateMealSharedStatus(
  day: string,
  sharedMeal: boolean,
  kidsRecipeId?: string
): Promise<WeeklyPlan> {
  const plan = await getCurrentPlan();
  const meal = plan.meals.find(m => m.day === day);
  if (meal) {
    meal.sharedMeal = sharedMeal;
    if (sharedMeal && meal.adultRecipeId) {
      meal.kidsRecipeId = meal.adultRecipeId;
    } else if (kidsRecipeId) {
      meal.kidsRecipeId = kidsRecipeId;
    }
  }
  await savePlan(plan);
  return plan;
}

export async function approveAllMeals(): Promise<WeeklyPlan> {
  const plan = await getCurrentPlan();
  plan.meals.forEach(meal => {
    meal.approved = true;
  });
  plan.status = 'approved';
  await savePlan(plan);
  return plan;
}

export function getWeekDates(startDate: Date): { day: string; date: string }[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return days.map((day, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);
    return {
      day,
      date: date.toISOString().split('T')[0]
    };
  });
}
