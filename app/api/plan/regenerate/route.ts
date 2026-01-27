import { NextRequest, NextResponse } from 'next/server';
import { generateMealSuggestion } from '@/lib/claude';
import { getCurrentPlan, replaceMeal } from '@/lib/plans';
import { getRecipes, addRecipe } from '@/lib/recipes';

export async function POST(request: NextRequest) {
  try {
    const { day, targetAudience = 'adults' } = await request.json();

    if (!day) {
      return NextResponse.json({ error: 'Missing day' }, { status: 400 });
    }

    // Get current plan and recipes to know what to exclude
    const [plan, recipes] = await Promise.all([
      getCurrentPlan(),
      getRecipes(),
    ]);

    // Get names of recipes already in the plan (both adult and kids)
    const plannedRecipeNames = plan.meals
      .flatMap(m => {
        const adultRecipe = recipes.find(r => r.id === m.adultRecipeId);
        const kidsRecipe = recipes.find(r => r.id === m.kidsRecipeId);
        // Also check legacy recipeId
        const legacyRecipe = m.recipeId ? recipes.find(r => r.id === m.recipeId) : null;
        return [adultRecipe?.name, kidsRecipe?.name, legacyRecipe?.name];
      })
      .filter(Boolean) as string[];

    // Get AI suggestion with target audience
    const suggestion = await generateMealSuggestion(
      targetAudience as 'adults' | 'kids' | 'both',
      undefined,
      plannedRecipeNames
    );

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
      targetAudience: suggestion.targetAudience || targetAudience,
      sourceWebsite: suggestion.sourceWebsite,
    });

    // Update the plan with the new recipe
    const updatedPlan = await replaceMeal(
      day,
      newRecipe.id,
      targetAudience as 'adults' | 'kids' | 'both'
    );

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
