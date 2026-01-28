import { WeeklyPrepPlan, PrepTask } from '@/types';
import { getData, setData } from './storage';

const PREP_PLANS_KEY = 'prep-plans';

interface PrepPlansData {
  [weekStart: string]: WeeklyPrepPlan;
}

async function getPrepPlans(): Promise<PrepPlansData> {
  return getData<PrepPlansData>(PREP_PLANS_KEY, {});
}

async function savePrepPlans(plans: PrepPlansData): Promise<void> {
  await setData(PREP_PLANS_KEY, plans);
}

export async function getPrepPlan(weekStart: string): Promise<WeeklyPrepPlan | null> {
  const plans = await getPrepPlans();
  return plans[weekStart] || null;
}

export async function savePrepPlan(plan: WeeklyPrepPlan): Promise<void> {
  const plans = await getPrepPlans();
  plans[plan.weekStart] = plan;
  await savePrepPlans(plans);
}

export async function updateTaskCompletion(
  weekStart: string,
  taskId: string,
  completed: boolean
): Promise<WeeklyPrepPlan> {
  const plans = await getPrepPlans();
  const plan = plans[weekStart];

  if (!plan) {
    throw new Error(`No prep plan found for week ${weekStart}`);
  }

  // Find and update the task in either Saturday or Sunday tasks
  let taskFound = false;

  for (const task of plan.saturdayTasks) {
    if (task.id === taskId) {
      task.completed = completed;
      taskFound = true;
      break;
    }
  }

  if (!taskFound) {
    for (const task of plan.sundayTasks) {
      if (task.id === taskId) {
        task.completed = completed;
        taskFound = true;
        break;
      }
    }
  }

  if (!taskFound) {
    throw new Error(`Task ${taskId} not found in prep plan`);
  }

  await savePrepPlans(plans);
  return plan;
}

export async function deletePrepPlan(weekStart: string): Promise<void> {
  const plans = await getPrepPlans();
  delete plans[weekStart];
  await savePrepPlans(plans);
}
