import { Settings } from '@/types';
import { getData, setData } from './storage';

const SETTINGS_KEY = 'settings';

const DEFAULT_SETTINGS: Settings = {
  exclusions: ['beef', 'pork', 'shellfish'],
};

export async function getSettings(): Promise<Settings> {
  return getData<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
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
