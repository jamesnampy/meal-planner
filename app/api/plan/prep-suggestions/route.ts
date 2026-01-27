import { NextResponse } from 'next/server';
import { getCurrentPlan } from '@/lib/plans';
import { getRecipeById } from '@/lib/recipes';
import { generatePrepSuggestions } from '@/lib/claude';

export async function POST() {
  try {
    const plan = await getCurrentPlan();

    if (plan.status !== 'approved') {
      return NextResponse.json(
        { error: 'Plan must be approved before generating prep suggestions' },
        { status: 400 }
      );
    }

    if (plan.meals.length === 0) {
      return NextResponse.json(
        { error: 'No meals in the plan' },
        { status: 400 }
      );
    }

    // Build meals with full recipe data
    const mealsWithRecipes = await Promise.all(
      plan.meals.map(async (meal) => {
        const adultRecipeId = meal.adultRecipeId || meal.recipeId || '';
        const kidsRecipeId = meal.kidsRecipeId || meal.recipeId || '';

        const [adultRecipe, kidsRecipe] = await Promise.all([
          getRecipeById(adultRecipeId),
          getRecipeById(kidsRecipeId),
        ]);

        return {
          day: meal.day,
          date: meal.date,
          adultRecipe,
          kidsRecipe,
          sharedMeal: meal.sharedMeal || false,
        };
      })
    );

    const suggestions = await generatePrepSuggestions(plan.weekStart, mealsWithRecipes);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Failed to generate prep suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate prep suggestions' },
      { status: 500 }
    );
  }
}
