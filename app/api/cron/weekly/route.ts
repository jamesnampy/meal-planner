import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyPlan } from '@/lib/meal-generator';
import { isNtfyConfigured, sendPlanReadyNotification } from '@/lib/notify';

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

    console.log('Weekly plan generated:', plan.weekStart);

    // Send push notification if ntfy is configured
    if (isNtfyConfigured()) {
      try {
        await sendPlanReadyNotification(plan.weekStart, plan.meals.length);
      } catch (notifyError) {
        console.error('Failed to send ntfy notification:', notifyError);
      }
    }

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
