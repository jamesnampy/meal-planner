import { NotRecommendedRecipe } from '@/types';
import { getSettings, saveSettings } from './settings';

export async function getNotRecommended(): Promise<NotRecommendedRecipe[]> {
  const settings = await getSettings();
  return settings.notRecommended || [];
}

export async function addNotRecommended(
  recipeName: string,
  audience: 'adults' | 'kids'
): Promise<NotRecommendedRecipe[]> {
  const settings = await getSettings();
  const list = settings.notRecommended || [];

  // Dedup by name + audience
  const exists = list.some(
    r => r.recipeName.toLowerCase() === recipeName.toLowerCase() && r.audience === audience
  );
  if (!exists) {
    list.push({
      recipeName,
      audience,
      addedAt: new Date().toISOString(),
    });
    settings.notRecommended = list;
    await saveSettings(settings);
  }

  return list;
}

export async function removeNotRecommended(
  recipeName: string,
  audience: 'adults' | 'kids'
): Promise<NotRecommendedRecipe[]> {
  const settings = await getSettings();
  settings.notRecommended = (settings.notRecommended || []).filter(
    r => !(r.recipeName.toLowerCase() === recipeName.toLowerCase() && r.audience === audience)
  );
  await saveSettings(settings);
  return settings.notRecommended;
}

export function getNotRecommendedNames(
  notRecommended: NotRecommendedRecipe[],
  audience: 'adults' | 'kids'
): string[] {
  return notRecommended
    .filter(r => r.audience === audience)
    .map(r => r.recipeName);
}
