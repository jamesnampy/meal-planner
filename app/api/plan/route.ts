import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentPlan,
  updateMealApproval,
  approveAllMeals,
  updateMealSharedStatus,
  toggleMealFavorite,
  savePlan,
} from '@/lib/plans';
import { addToFavorites } from '@/lib/recipes';

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

  const { day, approved, sharedMeal, toggleFavorite, targetAudience } = body;
  if (!day) {
    return NextResponse.json({ error: 'Missing day' }, { status: 400 });
  }

  // Handle favorite toggle
  if (toggleFavorite && targetAudience) {
    const { plan, recipe } = await toggleMealFavorite(day, targetAudience);

    // If marking as favorite, also save to favorites library
    if (recipe.isFavorite) {
      await addToFavorites(recipe);
    }

    return NextResponse.json(plan);
  }

  // Handle shared meal toggle
  if (typeof sharedMeal === 'boolean') {
    const plan = await updateMealSharedStatus(day, sharedMeal);
    return NextResponse.json(plan);
  }

  // Handle approval
  if (typeof approved === 'boolean') {
    const plan = await updateMealApproval(day, approved);
    return NextResponse.json(plan);
  }

  return NextResponse.json({ error: 'No valid action specified' }, { status: 400 });
}
