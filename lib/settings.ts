import { promises as fs } from 'fs';
import path from 'path';
import { Settings } from '@/types';

const DATA_PATH = path.join(process.cwd(), 'data', 'settings.json');

const DEFAULT_SETTINGS: Settings = {
  exclusions: ['beef', 'pork', 'shellfish'],
};

export async function getSettings(): Promise<Settings> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(settings, null, 2));
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
