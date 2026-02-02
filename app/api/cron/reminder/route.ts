import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPlan } from '@/lib/plans';
import { isPlanLocked } from '@/lib/plan-lock';
import { isNtfyConfigured, sendApprovalReminder } from '@/lib/notify';

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const plan = await getCurrentPlan();

    // Skip if no plan or no meals
    if (!plan || plan.meals.length === 0) {
      return NextResponse.json({ success: true, message: 'No plan to remind about' });
    }

    // Skip if already fully approved
    if (plan.status === 'approved') {
      return NextResponse.json({ success: true, message: 'Plan already approved' });
    }

    // Skip if plan is locked (no point reminding after deadline)
    if (isPlanLocked(plan)) {
      return NextResponse.json({ success: true, message: 'Plan is locked, skipping reminder' });
    }

    // Count unapproved meals
    const unapprovedCount = plan.meals.filter(m => !m.approved).length;
    if (unapprovedCount === 0) {
      return NextResponse.json({ success: true, message: 'All meals already approved' });
    }

    // Send notification if configured
    if (isNtfyConfigured()) {
      try {
        await sendApprovalReminder(plan.weekStart, unapprovedCount);
      } catch (notifyError) {
        console.error('Failed to send reminder notification:', notifyError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Reminder sent for ${unapprovedCount} unapproved meals`,
      unapprovedCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send reminder';
    console.error('Reminder cron failed:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
