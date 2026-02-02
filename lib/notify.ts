export function isNtfyConfigured(): boolean {
  return !!process.env.NTFY_TOPIC;
}

function getAppUrl(): string {
  return 'https://meal-planner.jamesvibecode.com';
}

export function getNextMondayDate(): string {
  const today = new Date();
  const dayOfWeek = today.getUTCDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;
  const nextMonday = new Date(today);
  nextMonday.setUTCDate(today.getUTCDate() + daysUntilMonday);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = nextMonday.getUTCFullYear();
  const month = months[nextMonday.getUTCMonth()];
  const day = String(nextMonday.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function sendNotification(title: string, body: string): Promise<void> {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;

  await fetch(`https://ntfy.sh/${topic}`, {
    method: 'POST',
    headers: {
      'Title': title,
      'Click': `${getAppUrl()}/plan`,
      'Content-Type': 'text/plain',
    },
    body,
  });
}

export async function sendPlanReadyNotification(weekStart: string, mealsCount: number): Promise<void> {
  await sendNotification(
    `Meal Planner for week ${weekStart}`,
    `Your weekly meal plan is ready! ${mealsCount} meals to review.`
  );
}

export async function sendApprovalReminder(weekStart: string, unapprovedCount: number): Promise<void> {
  await sendNotification(
    'Meal Planner Reminder',
    `You have ${unapprovedCount} unapproved meals for week of ${weekStart}. Deadline: Sunday 6 PM PT.`
  );
}
