import { NextRequest, NextResponse } from 'next/server';
import { getNotRecommended, addNotRecommended, removeNotRecommended } from '@/lib/not-recommended';
import { regenerateMeal } from '@/lib/meal-generator';
import { replaceMealRecipe } from '@/lib/plans';

export async function GET() {
  const list = await getNotRecommended();
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  try {
    const { recipeName, audience, day } = await request.json();

    if (!recipeName || !audience) {
      return NextResponse.json({ error: 'Missing recipeName or audience' }, { status: 400 });
    }

    const list = await addNotRecommended(recipeName, audience);

    // If day provided, regenerate that meal and return updated plan
    if (day) {
      const newRecipe = await regenerateMeal(day, audience);
      const plan = await replaceMealRecipe(day, audience, newRecipe);
      return NextResponse.json({ list, plan });
    }

    return NextResponse.json({ list });
  } catch (error) {
    console.error('Not recommended error:', error);
    return NextResponse.json(
      { error: 'Failed to update not-recommended list' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { recipeName, audience } = await request.json();

    if (!recipeName || !audience) {
      return NextResponse.json({ error: 'Missing recipeName or audience' }, { status: 400 });
    }

    const list = await removeNotRecommended(recipeName, audience);
    return NextResponse.json({ list });
  } catch (error) {
    console.error('Not recommended delete error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from not-recommended list' },
      { status: 500 }
    );
  }
}
