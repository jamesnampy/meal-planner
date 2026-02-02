import { WeeklyPlan, Meal, Recipe } from '@/types';
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

export async function replaceMealRecipe(
  day: string,
  targetAudience: 'adults' | 'kids',
  newRecipe: Recipe
): Promise<WeeklyPlan> {
  const plan = await getCurrentPlan();
  const meal = plan.meals.find(m => m.day === day);
  if (meal) {
    if (targetAudience === 'adults') {
      meal.adultRecipe = newRecipe;
    } else {
      meal.kidsRecipe = newRecipe;
    }
    meal.approved = false;
  }
  await savePlan(plan);
  return plan;
}

export async function toggleMealFavorite(
  day: string,
  targetAudience: 'adults' | 'kids'
): Promise<{ plan: WeeklyPlan; recipe: Recipe }> {
  const plan = await getCurrentPlan();
  const meal = plan.meals.find(m => m.day === day);
  if (!meal) {
    throw new Error('Meal not found');
  }

  const recipe = targetAudience === 'adults' ? meal.adultRecipe : meal.kidsRecipe;
  recipe.isFavorite = !recipe.isFavorite;

  await savePlan(plan);
  return { plan, recipe };
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
