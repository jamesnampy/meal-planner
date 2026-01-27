import { NextResponse } from 'next/server';
import { getCurrentPlan } from '@/lib/plans';
import { getRecipes } from '@/lib/recipes';
import { ShoppingItem, Ingredient } from '@/types';

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

  for (const meal of approvedMeals) {
    const recipe = recipes.find(r => r.id === meal.recipeId);
    if (!recipe) continue;

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
