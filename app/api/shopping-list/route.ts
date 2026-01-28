import { NextResponse } from 'next/server';
import { getCurrentPlan } from '@/lib/plans';
import { ShoppingItem, Recipe } from '@/types';

export async function GET() {
  const plan = await getCurrentPlan();

  // Only include approved meals
  const approvedMeals = plan.meals.filter(m => m.approved);

  if (approvedMeals.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Aggregate ingredients
  const ingredientMap = new Map<string, ShoppingItem>();

  const addIngredientsFromRecipe = (recipe: Recipe) => {
    if (!recipe?.ingredients) return;

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
    // Add ingredients from adult recipe (embedded directly in meal)
    if (meal.adultRecipe) {
      addIngredientsFromRecipe(meal.adultRecipe);
    }

    // Add ingredients from kids recipe if different
    if (meal.kidsRecipe && !meal.sharedMeal) {
      addIngredientsFromRecipe(meal.kidsRecipe);
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
