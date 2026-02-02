import { Recipe, WeeklyPlan, Meal } from '@/types';
import { getWeekDates, savePlan, getCurrentPlan } from './plans';
import { generateWeeklyMeals, generateSingleMeal } from './claude';

function generateRecipeId(): string {
  return `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function generateWeeklyPlan(weekStart?: Date): Promise<WeeklyPlan> {
  const startDate = weekStart || getNextMonday();
  const weekDates = getWeekDates(startDate);

  // Generate all meals via Claude AI in one call for consistency
  const generatedMeals = await generateWeeklyMeals(weekDates);

  // Convert generated meals to plan format with IDs
  const meals: Meal[] = generatedMeals.map(gm => {
    const adultRecipe: Recipe = {
      id: generateRecipeId(),
      ...gm.adultRecipe,
      isFavorite: false,
      savedToLibrary: false,
    };

    const kidsRecipe: Recipe = {
      id: generateRecipeId(),
      ...gm.kidsRecipe,
      isFavorite: false,
      savedToLibrary: false,
    };

    return {
      day: gm.day,
      date: gm.date,
      adultRecipe,
      kidsRecipe,
      sharedMeal: false,
      approved: false,
    };
  });

  const plan: WeeklyPlan = {
    weekStart: startDate.toISOString().split('T')[0],
    status: 'draft',
    meals,
  };

  await savePlan(plan);
  return plan;
}

export function getNextMonday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday;
}

export async function regenerateMeal(
  day: string,
  targetAudience: 'adults' | 'kids'
): Promise<Recipe> {
  const plan = await getCurrentPlan();

  // Get all recipe names currently in the plan to avoid duplicates
  const excludeRecipeNames = plan.meals
    .flatMap(m => [m.adultRecipe?.name, m.kidsRecipe?.name])
    .filter(Boolean) as string[];

  // Generate a new recipe via AI
  const suggestion = await generateSingleMeal(day, targetAudience, excludeRecipeNames);

  const newRecipe: Recipe = {
    id: generateRecipeId(),
    ...suggestion,
    isFavorite: false,
    savedToLibrary: false,
  };

  return newRecipe;
}
