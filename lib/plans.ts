import { promises as fs } from 'fs';
import path from 'path';
import { WeeklyPlan, Meal } from '@/types';

const DATA_PATH = path.join(process.cwd(), 'data', 'current-plan.json');

export async function getCurrentPlan(): Promise<WeeklyPlan> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      weekStart: new Date().toISOString().split('T')[0],
      status: 'draft',
      meals: []
    };
  }
}

export async function savePlan(plan: WeeklyPlan): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(plan, null, 2));
}

export async function updateMealApproval(day: string, approved: boolean): Promise<WeeklyPlan> {
  const plan = await getCurrentPlan();
  const meal = plan.meals.find(m => m.day === day);
  if (meal) {
    meal.approved = approved;
  }
  await savePlan(plan);
  return plan;
}

export async function replaceMeal(day: string, recipeId: string): Promise<WeeklyPlan> {
  const plan = await getCurrentPlan();
  const meal = plan.meals.find(m => m.day === day);
  if (meal) {
    meal.recipeId = recipeId;
    meal.approved = false;
  }
  await savePlan(plan);
  return plan;
}

export async function approveAllMeals(): Promise<WeeklyPlan> {
  const plan = await getCurrentPlan();
  plan.meals.forEach(meal => {
    meal.approved = true;
  });
  plan.status = 'approved';
  await savePlan(plan);
  return plan;
}

export function getWeekDates(startDate: Date): { day: string; date: string }[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  return days.map((day, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);
    return {
      day,
      date: date.toISOString().split('T')[0]
    };
  });
}
