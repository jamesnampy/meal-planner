import { NextRequest, NextResponse } from 'next/server';
import { generateMealSuggestion } from '@/lib/claude';
import { getCurrentPlan, replaceMeal } from '@/lib/plans';
import { getRecipes, addRecipe } from '@/lib/recipes';

export async function POST(request: NextRequest) {
  try {
    const { day } = await request.json();

    if (!day) {
      return NextResponse.json({ error: 'Missing day' }, { status: 400 });
    }

    // Get current plan and recipes to know what to exclude
    const [plan, recipes] = await Promise.all([
      getCurrentPlan(),
      getRecipes(),
    ]);

    // Get names of recipes already in the plan
    const plannedRecipeNames = plan.meals
      .map(m => recipes.find(r => r.id === m.recipeId)?.name)
      .filter(Boolean) as string[];

    // Get AI suggestion
    const suggestion = await generateMealSuggestion(undefined, plannedRecipeNames);

    // Add the new recipe to our collection
    const newRecipe = await addRecipe({
      name: suggestion.name,
      cuisine: suggestion.cuisine,
      prepTime: suggestion.prepTime,
      servings: suggestion.servings,
      ingredients: suggestion.ingredients,
      instructions: suggestion.instructions,
      kidFriendly: suggestion.kidFriendly,
      isFavorite: false,
    });

    // Update the plan with the new recipe
    const updatedPlan = await replaceMeal(day, newRecipe.id);

    return NextResponse.json({
      plan: updatedPlan,
      newRecipe,
    });
  } catch (error) {
    console.error('Meal regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal suggestion. Make sure ANTHROPIC_API_KEY is set.' },
      { status: 500 }
    );
  }
}
