import { NextRequest, NextResponse } from 'next/server';
import { regenerateMeal } from '@/lib/meal-generator';
import { replaceMealRecipe } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    const { day, targetAudience = 'adults' } = await request.json();

    if (!day) {
      return NextResponse.json({ error: 'Missing day' }, { status: 400 });
    }

    // Generate new recipe via AI
    const newRecipe = await regenerateMeal(day, targetAudience as 'adults' | 'kids');

    // Update the plan with the new embedded recipe
    const updatedPlan = await replaceMealRecipe(
      day,
      targetAudience as 'adults' | 'kids',
      newRecipe
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
