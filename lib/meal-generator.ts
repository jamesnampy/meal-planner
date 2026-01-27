import { Recipe, WeeklyPlan, Meal } from '@/types';
import { getRecipes, saveRecipe } from './recipes';
import { getWeekDates, savePlan } from './plans';
import { generateDualMealSuggestion } from './claude';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateRecipeId(): string {
  return `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function generateWeeklyPlan(weekStart?: Date): Promise<WeeklyPlan> {
  const recipes = await getRecipes();

  const startDate = weekStart || getNextMonday();
  const weekDates = getWeekDates(startDate);

  // Separate recipes by audience suitability
  const adultRecipes = recipes.filter(r =>
    r.targetAudience === 'adults' || r.targetAudience === 'both' || !r.targetAudience
  );
  const kidsRecipes = recipes.filter(r =>
    r.kidFriendly || r.targetAudience === 'kids' || r.targetAudience === 'both'
  );
  const sharedRecipes = recipes.filter(r =>
    r.targetAudience === 'both' || (r.kidFriendly && !r.targetAudience)
  );

  // Separate favorites
  const adultFavorites = adultRecipes.filter(r => r.isFavorite);
  const kidsFavorites = kidsRecipes.filter(r => r.isFavorite);

  const selectedAdultRecipes: Recipe[] = [];
  const selectedKidsRecipes: Recipe[] = [];

  // Ensure at least 1 adult favorite if available
  if (adultFavorites.length > 0) {
    const shuffled = shuffleArray(adultFavorites);
    selectedAdultRecipes.push(shuffled[0]);
  }

  // Ensure at least 1 kids favorite if available
  if (kidsFavorites.length > 0) {
    const shuffled = shuffleArray(kidsFavorites);
    selectedKidsRecipes.push(shuffled[0]);
  }

  // Fill adult recipes
  const remainingAdult = adultRecipes.filter(
    r => !selectedAdultRecipes.some(s => s.id === r.id)
  );
  const shuffledAdult = shuffleArray(remainingAdult);
  while (selectedAdultRecipes.length < 5 && shuffledAdult.length > 0) {
    selectedAdultRecipes.push(shuffledAdult.shift()!);
  }

  // Fill kids recipes
  const remainingKids = kidsRecipes.filter(
    r => !selectedKidsRecipes.some(s => s.id === r.id)
  );
  const shuffledKids = shuffleArray(remainingKids);
  while (selectedKidsRecipes.length < 5 && shuffledKids.length > 0) {
    selectedKidsRecipes.push(shuffledKids.shift()!);
  }

  // Shuffle final selections
  const finalAdult = shuffleArray(selectedAdultRecipes).slice(0, 5);
  const finalKids = shuffleArray(selectedKidsRecipes).slice(0, 5);

  // Create meals for each weekday
  const meals: Meal[] = [];

  for (let index = 0; index < weekDates.length; index++) {
    const weekDay = weekDates[index];
    const adultRecipe = finalAdult[index];
    const kidsRecipe = finalKids[index];

    // Check if we should use a shared meal
    // Use shared if: same recipe, or if adult recipe is kid-friendly and we prefer to share
    let adultRecipeId = adultRecipe?.id;
    let kidsRecipeId = kidsRecipe?.id;
    let sharedMeal = false;

    if (adultRecipe && adultRecipe.id === kidsRecipe?.id) {
      // Same recipe selected for both
      sharedMeal = true;
    } else if (adultRecipe?.kidFriendly && sharedRecipes.includes(adultRecipe)) {
      // Adult recipe works for kids too - prefer sharing
      kidsRecipeId = adultRecipeId;
      sharedMeal = true;
    }

    // Handle case where we don't have enough recipes in library
    if (!adultRecipeId || !kidsRecipeId) {
      // Use Claude to generate meals for this day
      const usedRecipeNames = meals
        .map(m => {
          const ar = recipes.find(r => r.id === m.adultRecipeId);
          const kr = recipes.find(r => r.id === m.kidsRecipeId);
          return [ar?.name, kr?.name];
        })
        .flat()
        .filter(Boolean) as string[];

      try {
        const dualMeal = await generateDualMealSuggestion(weekDay.day, usedRecipeNames);

        // Save generated recipes to library
        if (!adultRecipeId) {
          const newAdultRecipe: Recipe = {
            id: generateRecipeId(),
            ...dualMeal.adultMeal,
            isFavorite: false,
            targetAudience: 'adults',
          };
          await saveRecipe(newAdultRecipe);
          adultRecipeId = newAdultRecipe.id;
        }

        if (dualMeal.sharedMeal) {
          kidsRecipeId = adultRecipeId;
          sharedMeal = true;
        } else if (!kidsRecipeId) {
          const newKidsRecipe: Recipe = {
            id: generateRecipeId(),
            ...dualMeal.kidsMeal,
            isFavorite: false,
            targetAudience: 'kids',
          };
          await saveRecipe(newKidsRecipe);
          kidsRecipeId = newKidsRecipe.id;
        }
      } catch (error) {
        console.error(`Failed to generate AI meals for ${weekDay.day}:`, error);
        // Fallback: reuse any available recipe
        if (!adultRecipeId && recipes.length > 0) {
          adultRecipeId = shuffleArray(recipes)[0].id;
        }
        if (!kidsRecipeId && recipes.length > 0) {
          kidsRecipeId = shuffleArray(recipes.filter(r => r.kidFriendly || r.targetAudience !== 'adults'))[0]?.id || recipes[0].id;
        }
      }
    }

    meals.push({
      day: weekDay.day,
      date: weekDay.date,
      adultRecipeId: adultRecipeId!,
      kidsRecipeId: kidsRecipeId!,
      sharedMeal,
      approved: false,
    });
  }

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

export async function regenerateMeal(
  day: string,
  targetAudience: 'adults' | 'kids' | 'both' = 'both'
): Promise<{ adultRecipeId?: string; kidsRecipeId?: string; sharedMeal?: boolean }> {
  const recipes = await getRecipes();
  const { getCurrentPlan } = await import('./plans');
  const plan = await getCurrentPlan();

  // Get currently assigned recipe IDs
  const currentAdultIds = plan.meals.map(m => m.adultRecipeId);
  const currentKidsIds = plan.meals.map(m => m.kidsRecipeId);

  if (targetAudience === 'adults') {
    // Find adult recipes not in current plan
    const available = recipes.filter(
      r => !currentAdultIds.includes(r.id) &&
           (r.targetAudience === 'adults' || r.targetAudience === 'both' || !r.targetAudience)
    );

    if (available.length === 0) {
      const currentMeal = plan.meals.find(m => m.day === day);
      const otherRecipes = recipes.filter(r => r.id !== currentMeal?.adultRecipeId);
      const shuffled = shuffleArray(otherRecipes);
      return { adultRecipeId: shuffled[0]?.id };
    }

    const shuffled = shuffleArray(available);
    return { adultRecipeId: shuffled[0].id };
  }

  if (targetAudience === 'kids') {
    // Find kids recipes not in current plan
    const available = recipes.filter(
      r => !currentKidsIds.includes(r.id) &&
           (r.kidFriendly || r.targetAudience === 'kids' || r.targetAudience === 'both')
    );

    if (available.length === 0) {
      const currentMeal = plan.meals.find(m => m.day === day);
      const otherRecipes = recipes.filter(r => r.id !== currentMeal?.kidsRecipeId && r.kidFriendly);
      const shuffled = shuffleArray(otherRecipes);
      return { kidsRecipeId: shuffled[0]?.id || recipes[0]?.id };
    }

    const shuffled = shuffleArray(available);
    return { kidsRecipeId: shuffled[0].id };
  }

  // Both - find a shared recipe
  const sharedAvailable = recipes.filter(
    r => !currentAdultIds.includes(r.id) &&
         !currentKidsIds.includes(r.id) &&
         (r.targetAudience === 'both' || (r.kidFriendly && !r.targetAudience))
  );

  if (sharedAvailable.length > 0) {
    const shuffled = shuffleArray(sharedAvailable);
    return {
      adultRecipeId: shuffled[0].id,
      kidsRecipeId: shuffled[0].id,
      sharedMeal: true
    };
  }

  // Fallback to separate recipes
  const adultAvailable = recipes.filter(r => !currentAdultIds.includes(r.id));
  const kidsAvailable = recipes.filter(r => !currentKidsIds.includes(r.id) && r.kidFriendly);

  return {
    adultRecipeId: shuffleArray(adultAvailable)[0]?.id || recipes[0]?.id,
    kidsRecipeId: shuffleArray(kidsAvailable)[0]?.id || recipes[0]?.id,
    sharedMeal: false
  };
}
