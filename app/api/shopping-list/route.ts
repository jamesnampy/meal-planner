import { NextResponse } from 'next/server';
import { getCurrentPlan } from '@/lib/plans';
import { getRecipes } from '@/lib/recipes';
import { ShoppingItem, Recipe } from '@/types';

export async function GET() {
  const [plan, recipes] = await Promise.all([
    getCurrentPlan(),
    getRecipes(),
  ]);

  // Only include approved meals
  const approvedMeals = plan.meals.filter(m => m.approved);

  if (approvedMeals.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Aggregate ingredients
  const ingredientMap = new Map<string, ShoppingItem>();

  const addIngredientsFromRecipe = (recipe: Recipe) => {
    for (const ingredient of recipe.ingredients) {
      const key = `${ingredient.name.toLowerCase()}-${ingredient.unit.toLowerCase()}`;
      const existing = ingredientMap.get(key);

      if (existing) {
        // Combine amounts
        const existingAmount = parseFloat(existing.amount) || 0;
        const newAmount = parseFloat(ingredient.amount) || 0;
        existing.amount = String(existingAmount + newAmount);
        if (!existing.recipeNames.includes(recipe.name)) {
          existing.recipeNames.push(recipe.name);
        }
      } else {
        ingredientMap.set(key, {
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          category: ingredient.category,
          checked: false,
          recipeNames: [recipe.name],
        });
      }
    }
  };

  for (const meal of approvedMeals) {
    // Get adult recipe
    const adultRecipeId = meal.adultRecipeId || meal.recipeId;
    const adultRecipe = adultRecipeId ? recipes.find(r => r.id === adultRecipeId) : null;

    // Get kids recipe (if different from adult)
    const kidsRecipeId = meal.kidsRecipeId;
    const kidsRecipe = kidsRecipeId && kidsRecipeId !== adultRecipeId
      ? recipes.find(r => r.id === kidsRecipeId)
      : null;

    // Add ingredients from adult recipe
    if (adultRecipe) {
      addIngredientsFromRecipe(adultRecipe);
    }

    // Add ingredients from kids recipe (if different)
    if (kidsRecipe) {
      addIngredientsFromRecipe(kidsRecipe);
    }
  }

  const items = Array.from(ingredientMap.values()).sort((a, b) => {
    // Sort by category, then by name
    if (a.category !== b.category) {
      const order = ['produce', 'protein', 'dairy', 'pantry', 'frozen', 'other'];
      return order.indexOf(a.category) - order.indexOf(b.category);
    }
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ items });
}
