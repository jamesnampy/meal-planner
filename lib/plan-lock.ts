import { WeeklyPlan } from '@/types';

/**
 * Determines if a plan is locked (past the approval deadline).
 * Lockdown = Sunday 6 PM PST = Monday 2 AM UTC (weekStart + 7 days, 02:00 UTC).
 * If the plan is already approved, it is not considered locked.
 */
export function isPlanLocked(plan: WeeklyPlan): boolean {
  if (!plan.weekStart || plan.meals.length === 0) {
    return false;
  }

  // If plan is already fully approved, no need to lock
  if (plan.status === 'approved') {
    return false;
  }

  // weekStart is the Monday date string (YYYY-MM-DD)
  const weekStartDate = new Date(plan.weekStart + 'T00:00:00Z');

  // Lockdown = weekStart + 7 days at 02:00 UTC (= Sunday 6 PM PST / 7 PM PDT)
  // Using a fixed UTC offset for simplicity (PST = UTC-8)
  const lockdownUtc = new Date(weekStartDate);
  lockdownUtc.setUTCDate(lockdownUtc.getUTCDate() + 7);
  lockdownUtc.setUTCHours(2, 0, 0, 0);

  return new Date() > lockdownUtc;
}
