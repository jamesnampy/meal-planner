import { NextResponse } from 'next/server';
import { generateWeeklyPlan } from '@/lib/meal-generator';

export async function POST() {
  try {
    const plan = await generateWeeklyPlan();
    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate plan';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
