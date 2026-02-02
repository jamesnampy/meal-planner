import { Settings, AIContext, CuisineId } from '@/types';
import { getData, setData } from './storage';

const SETTINGS_KEY = 'settings';

const DEFAULT_AI_CONTEXT: AIContext = {
  adultPreferences: '',
  kidsPreferences: '',
  generalNotes: '',
};

const DEFAULT_SETTINGS: Settings = {
  exclusions: ['beef', 'pork', 'shellfish'],
  preferredCuisines: ['indian-fusion', 'mediterranean'],
  aiContext: DEFAULT_AI_CONTEXT,
  recipeWebsites: [],
  notRecommended: [],
};

export async function getSettings(): Promise<Settings> {
  const settings = await getData<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  // Ensure all new fields exist (migration support for existing data)
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    aiContext: {
      ...DEFAULT_AI_CONTEXT,
      ...(settings.aiContext || {}),
    },
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await setData(SETTINGS_KEY, settings);
}

export async function getExclusions(): Promise<string[]> {
  const settings = await getSettings();
  return settings.exclusions;
}

export async function addExclusion(item: string): Promise<Settings> {
  const settings = await getSettings();
  const normalized = item.toLowerCase().trim();
  if (!settings.exclusions.includes(normalized)) {
    settings.exclusions.push(normalized);
    await saveSettings(settings);
  }
  return settings;
}

export async function removeExclusion(item: string): Promise<Settings> {
  const settings = await getSettings();
  const normalized = item.toLowerCase().trim();
  settings.exclusions = settings.exclusions.filter(e => e !== normalized);
  await saveSettings(settings);
  return settings;
}

export async function getAiContext(): Promise<AIContext> {
  const settings = await getSettings();
  return settings.aiContext;
}

export async function updateAiContext(aiContext: Partial<AIContext>): Promise<Settings> {
  const settings = await getSettings();
  settings.aiContext = {
    ...settings.aiContext,
    ...aiContext,
  };
  await saveSettings(settings);
  return settings;
}

export async function getPreferredCuisines(): Promise<CuisineId[]> {
  const settings = await getSettings();
  return settings.preferredCuisines;
}

export async function setPreferredCuisines(cuisines: CuisineId[]): Promise<Settings> {
  const settings = await getSettings();
  settings.preferredCuisines = cuisines;
  await saveSettings(settings);
  return settings;
}

export async function getRecipeWebsites(): Promise<string[]> {
  const settings = await getSettings();
  return settings.recipeWebsites;
}

export async function addRecipeWebsite(website: string): Promise<Settings> {
  const settings = await getSettings();
  const normalized = website.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!settings.recipeWebsites.includes(normalized)) {
    settings.recipeWebsites.push(normalized);
    await saveSettings(settings);
  }
  return settings;
}

export async function removeRecipeWebsite(website: string): Promise<Settings> {
  const settings = await getSettings();
  const normalized = website.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  settings.recipeWebsites = settings.recipeWebsites.filter(w => w !== normalized);
  await saveSettings(settings);
  return settings;
}
