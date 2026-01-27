import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentPlan,
  updateMealApproval,
  replaceMeal,
  approveAllMeals,
  updateMealSharedStatus,
  savePlan,
} from '@/lib/plans';
import { regenerateMeal } from '@/lib/meal-generator';

export async function GET() {
  const plan = await getCurrentPlan();
  return NextResponse.json(plan);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (body.approveAll) {
    const plan = await approveAllMeals();
    return NextResponse.json(plan);
  }

  const { day, approved, sharedMeal, kidsRecipeId } = body;
  if (!day) {
    return NextResponse.json({ error: 'Missing day' }, { status: 400 });
  }

  // Handle shared meal toggle
  if (typeof sharedMeal === 'boolean') {
    const plan = await updateMealSharedStatus(day, sharedMeal, kidsRecipeId);
    return NextResponse.json(plan);
  }

  // Handle approval
  if (typeof approved === 'boolean') {
    const plan = await updateMealApproval(day, approved);
    return NextResponse.json(plan);
  }

  return NextResponse.json({ error: 'No valid action specified' }, { status: 400 });
}

export async function PUT(request: NextRequest) {
  const { day, targetAudience = 'adults' } = await request.json();

  if (!day) {
    return NextResponse.json({ error: 'Missing day' }, { status: 400 });
  }

  const result = await regenerateMeal(day, targetAudience as 'adults' | 'kids' | 'both');

  // Update the plan with the new recipe(s)
  const plan = await getCurrentPlan();
  const meal = plan.meals.find(m => m.day === day);

  if (meal) {
    if (result.adultRecipeId && (targetAudience === 'adults' || targetAudience === 'both')) {
      meal.adultRecipeId = result.adultRecipeId;
    }
    if (result.kidsRecipeId && (targetAudience === 'kids' || targetAudience === 'both')) {
      meal.kidsRecipeId = result.kidsRecipeId;
    }
    if (typeof result.sharedMeal === 'boolean') {
      meal.sharedMeal = result.sharedMeal;
    }
    meal.approved = false;
    await savePlan(plan);
  }

  return NextResponse.json(plan);
}
