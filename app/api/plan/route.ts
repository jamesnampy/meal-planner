import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentPlan,
  updateMealApproval,
  approveAllMeals,
  toggleMealFavorite,
} from '@/lib/plans';
import { addToFavorites } from '@/lib/recipes';
import { isPlanLocked } from '@/lib/plan-lock';

export async function GET() {
  const plan = await getCurrentPlan();
  const locked = isPlanLocked(plan);
  return NextResponse.json({ ...plan, locked });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const plan = await getCurrentPlan();

  if (body.approveAll) {
    if (isPlanLocked(plan)) {
      return NextResponse.json({ error: 'Plan is locked. Approval deadline has passed.' }, { status: 403 });
    }
    const updatedPlan = await approveAllMeals();
    return NextResponse.json({ ...updatedPlan, locked: false });
  }

  const { day, approved, toggleFavorite, targetAudience } = body;
  if (!day) {
    return NextResponse.json({ error: 'Missing day' }, { status: 400 });
  }

  // Handle favorite toggle
  if (toggleFavorite && targetAudience) {
    const { plan: updatedPlan, recipe } = await toggleMealFavorite(day, targetAudience);

    // If marking as favorite, also save to favorites library
    if (recipe.isFavorite) {
      await addToFavorites(recipe);
    }

    return NextResponse.json({ ...updatedPlan, locked: isPlanLocked(updatedPlan) });
  }

  // Handle approval
  if (typeof approved === 'boolean') {
    if (isPlanLocked(plan)) {
      return NextResponse.json({ error: 'Plan is locked. Approval deadline has passed.' }, { status: 403 });
    }
    const updatedPlan = await updateMealApproval(day, approved);
    return NextResponse.json({ ...updatedPlan, locked: false });
  }

  return NextResponse.json({ error: 'No valid action specified' }, { status: 400 });
}
