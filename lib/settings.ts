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
  adultCuisines: ['indian-fusion', 'mediterranean'],
  kidsCuisines: ['american'],
  vegetarianDaysPerWeek: 1,
  aiContext: DEFAULT_AI_CONTEXT,
  recipeWebsites: [],
  adultRecipeWebsites: [],
  kidsRecipeWebsites: [],
  notRecommended: [],
};

export async function getSettings(): Promise<Settings> {
  const settings = await getData<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);

  // Merge with defaults for new field support
  const merged: Settings = {
    ...DEFAULT_SETTINGS,
    ...settings,
    aiContext: {
      ...DEFAULT_AI_CONTEXT,
      ...(settings.aiContext || {}),
    },
  };

  // MIGRATION: If adultCuisines doesn't exist, copy from preferredCuisines
  let needsPersist = false;
  if (!settings.adultCuisines && settings.preferredCuisines?.length > 0) {
    merged.adultCuisines = [...settings.preferredCuisines];
    merged.kidsCuisines = [...settings.preferredCuisines];
    needsPersist = true;
  }

  // MIGRATION: If adultRecipeWebsites doesn't exist, copy from recipeWebsites
  if (!settings.adultRecipeWebsites && settings.recipeWebsites?.length > 0) {
    merged.adultRecipeWebsites = [...settings.recipeWebsites];
    merged.kidsRecipeWebsites = [...settings.recipeWebsites];
    needsPersist = true;
  }

  if (needsPersist) {
    await setData(SETTINGS_KEY, merged);
  }

  return merged;
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

export async function setAdultCuisines(cuisines: CuisineId[]): Promise<Settings> {
  const settings = await getSettings();
  settings.adultCuisines = cuisines;
  settings.preferredCuisines = Array.from(new Set([...cuisines, ...settings.kidsCuisines]));
  await saveSettings(settings);
  return settings;
}

export async function setKidsCuisines(cuisines: CuisineId[]): Promise<Settings> {
  const settings = await getSettings();
  settings.kidsCuisines = cuisines;
  settings.preferredCuisines = Array.from(new Set([...settings.adultCuisines, ...cuisines]));
  await saveSettings(settings);
  return settings;
}

export async function setVegetarianDaysPerWeek(count: number): Promise<Settings> {
  const settings = await getSettings();
  settings.vegetarianDaysPerWeek = Math.max(0, Math.min(5, count));
  await saveSettings(settings);
  return settings;
}

export async function setAdultRecipeWebsites(websites: string[]): Promise<Settings> {
  const settings = await getSettings();
  settings.adultRecipeWebsites = websites;
  settings.recipeWebsites = Array.from(new Set([...websites, ...settings.kidsRecipeWebsites]));
  await saveSettings(settings);
  return settings;
}

export async function setKidsRecipeWebsites(websites: string[]): Promise<Settings> {
  const settings = await getSettings();
  settings.kidsRecipeWebsites = websites;
  settings.recipeWebsites = Array.from(new Set([...settings.adultRecipeWebsites, ...websites]));
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
