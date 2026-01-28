import { NextResponse } from 'next/server';
import { getCurrentPlan } from '@/lib/plans';
import { getRecipeById } from '@/lib/recipes';
import { generatePrepTasks, MealWithDay } from '@/lib/claude';
import { savePrepPlan } from '@/lib/prep';
import { WeeklyPrepPlan } from '@/types';

export async function POST() {
  try {
    const plan = await getCurrentPlan();

    if (plan.status !== 'approved') {
      return NextResponse.json(
        { error: 'Plan must be approved before generating prep tasks' },
        { status: 400 }
      );
    }

    if (plan.meals.length === 0) {
      return NextResponse.json(
        { error: 'No meals in the plan' },
        { status: 400 }
      );
    }

    // Build simplified meal data for Claude
    const mealsWithDay: MealWithDay[] = [];

    for (const meal of plan.meals) {
      const adultRecipeId = meal.adultRecipeId || meal.recipeId || '';
      const kidsRecipeId = meal.kidsRecipeId || meal.recipeId || '';

      const [adultRecipe, kidsRecipe] = await Promise.all([
        getRecipeById(adultRecipeId),
        getRecipeById(kidsRecipeId),
      ]);

      if (adultRecipe) {
        mealsWithDay.push({
          day: meal.day,
          recipeName: adultRecipe.name,
          ingredients: adultRecipe.ingredients.map(i => `${i.amount} ${i.unit} ${i.name}`),
        });
      }

      // Only add kids meal if it's different from adult meal
      if (kidsRecipe && !meal.sharedMeal && kidsRecipe.id !== adultRecipe?.id) {
        mealsWithDay.push({
          day: `${meal.day} (Kids)`,
          recipeName: kidsRecipe.name,
          ingredients: kidsRecipe.ingredients.map(i => `${i.amount} ${i.unit} ${i.name}`),
        });
      }
    }

    const tasks = await generatePrepTasks(mealsWithDay);

    // Organize tasks by day
    const saturdayTasks = tasks.filter(t => t.prepDay === 'Saturday');
    const sundayTasks = tasks.filter(t => t.prepDay === 'Sunday');

    // Calculate total prep time
    const totalPrepTimeMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

    const prepPlan: WeeklyPrepPlan = {
      weekStart: plan.weekStart,
      totalPrepTimeMinutes,
      saturdayTasks,
      sundayTasks,
      generatedAt: new Date().toISOString(),
    };

    // Save to storage
    await savePrepPlan(prepPlan);

    return NextResponse.json(prepPlan);
  } catch (error) {
    console.error('Failed to generate prep tasks:', error);
    return NextResponse.json(
      { error: 'Failed to generate prep tasks' },
      { status: 500 }
    );
  }
}
