import { Recipe, WeeklyPlan, Meal } from '@/types';
import { getRecipes } from './recipes';
import { getWeekDates, savePlan } from './plans';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function generateWeeklyPlan(weekStart?: Date): Promise<WeeklyPlan> {
  const recipes = await getRecipes();

  if (recipes.length < 5) {
    throw new Error('Need at least 5 recipes to generate a weekly plan');
  }

  const startDate = weekStart || getNextMonday();
  const weekDates = getWeekDates(startDate);

  // Separate favorites and kid-friendly recipes
  const favorites = recipes.filter(r => r.isFavorite);
  const kidFriendly = recipes.filter(r => r.kidFriendly);
  const others = recipes.filter(r => !r.isFavorite);

  const selectedRecipes: Recipe[] = [];

  // Ensure at least 1 favorite if available
  if (favorites.length > 0) {
    const shuffledFavorites = shuffleArray(favorites);
    selectedRecipes.push(shuffledFavorites[0]);
  }

  // Ensure at least 2 kid-friendly options if available
  const kidFriendlyNotSelected = kidFriendly.filter(
    r => !selectedRecipes.some(s => s.id === r.id)
  );
  const shuffledKidFriendly = shuffleArray(kidFriendlyNotSelected);
  const kidFriendlyToAdd = Math.min(2, shuffledKidFriendly.length);
  for (let i = 0; i < kidFriendlyToAdd; i++) {
    selectedRecipes.push(shuffledKidFriendly[i]);
  }

  // Fill remaining slots with other recipes
  const remaining = recipes.filter(
    r => !selectedRecipes.some(s => s.id === r.id)
  );
  const shuffledRemaining = shuffleArray(remaining);

  while (selectedRecipes.length < 5 && shuffledRemaining.length > 0) {
    selectedRecipes.push(shuffledRemaining.shift()!);
  }

  // Shuffle final selection to randomize day assignment
  const finalSelection = shuffleArray(selectedRecipes).slice(0, 5);

  // Create meals for each weekday
  const meals: Meal[] = weekDates.map((weekDay, index) => ({
    day: weekDay.day,
    date: weekDay.date,
    recipeId: finalSelection[index].id,
    approved: false
  }));

  const plan: WeeklyPlan = {
    weekStart: startDate.toISOString().split('T')[0],
    status: 'draft',
    meals
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

export async function regenerateMeal(day: string): Promise<string> {
  const recipes = await getRecipes();
  const { getCurrentPlan } = await import('./plans');
  const plan = await getCurrentPlan();

  // Get currently assigned recipe IDs
  const currentIds = plan.meals.map(m => m.recipeId);

  // Find recipes not in current plan
  const available = recipes.filter(r => !currentIds.includes(r.id));

  if (available.length === 0) {
    // If all recipes used, pick any random one different from current day
    const currentMeal = plan.meals.find(m => m.day === day);
    const otherRecipes = recipes.filter(r => r.id !== currentMeal?.recipeId);
    const shuffled = shuffleArray(otherRecipes);
    return shuffled[0].id;
  }

  const shuffled = shuffleArray(available);
  return shuffled[0].id;
}
