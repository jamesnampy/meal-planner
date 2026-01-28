import { NextRequest, NextResponse } from 'next/server';
import { getPrepPlan, updateTaskCompletion, deletePrepPlan } from '@/lib/prep';
import { getCurrentPlan } from '@/lib/plans';

export async function GET() {
  try {
    const plan = await getCurrentPlan();
    const prepPlan = await getPrepPlan(plan.weekStart);

    if (!prepPlan) {
      return NextResponse.json(null);
    }

    return NextResponse.json(prepPlan);
  } catch (error) {
    console.error('Failed to get prep plan:', error);
    return NextResponse.json(
      { error: 'Failed to get prep plan' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { taskId, completed } = await request.json();

    if (!taskId || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'taskId and completed (boolean) are required' },
        { status: 400 }
      );
    }

    const plan = await getCurrentPlan();
    const updatedPlan = await updateTaskCompletion(plan.weekStart, taskId, completed);

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Failed to update task completion:', error);
    return NextResponse.json(
      { error: 'Failed to update task completion' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const plan = await getCurrentPlan();
    await deletePrepPlan(plan.weekStart);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete prep plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete prep plan' },
      { status: 500 }
    );
  }
}
