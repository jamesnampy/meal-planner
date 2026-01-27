import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyPlan } from '@/lib/meal-generator';

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In development, allow without auth
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const plan = await generateWeeklyPlan();

    // Here you could add notifications (SMS, email, etc.)
    // For now, just log and return the plan
    console.log('Weekly plan generated:', plan.weekStart);

    return NextResponse.json({
      success: true,
      message: 'Weekly meal plan generated',
      weekStart: plan.weekStart,
      mealsCount: plan.meals.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate plan';
    console.error('Cron job failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
