import { WeeklyPlan } from '@/types';

/**
 * Determines if a plan is locked (past the approval deadline).
 * Lockdown = Sunday 6 PM PST before the plan's Monday start.
 * Sunday 6 PM PST = Monday 2 AM UTC = weekStart date at 02:00 UTC.
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
  // Lockdown = Sunday 6 PM PST = weekStart Monday at 02:00 UTC
  const lockdownUtc = new Date(plan.weekStart + 'T02:00:00Z');

  return new Date() > lockdownUtc;
}
