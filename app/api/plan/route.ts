import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPlan, updateMealApproval, replaceMeal, approveAllMeals } from '@/lib/plans';
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

  const { day, approved } = body;
  if (!day) {
    return NextResponse.json({ error: 'Missing day' }, { status: 400 });
  }

  const plan = await updateMealApproval(day, approved);
  return NextResponse.json(plan);
}

export async function PUT(request: NextRequest) {
  const { day } = await request.json();

  if (!day) {
    return NextResponse.json({ error: 'Missing day' }, { status: 400 });
  }

  const newRecipeId = await regenerateMeal(day);
  const plan = await replaceMeal(day, newRecipeId);
  return NextResponse.json(plan);
}
