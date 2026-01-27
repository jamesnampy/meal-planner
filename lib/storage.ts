import { kv } from '@vercel/kv';
import { promises as fs } from 'fs';
import path from 'path';

const isVercel = process.env.VERCEL === '1';

// Generic storage functions that work with both KV and JSON files

export async function getData<T>(key: string, defaultValue: T): Promise<T> {
  if (isVercel) {
    try {
      const data = await kv.get<T>(key);
      return data ?? defaultValue;
    } catch (error) {
      console.error(`KV get error for ${key}:`, error);
      return defaultValue;
    }
  } else {
    // Local development - use JSON files
    const filePath = path.join(process.cwd(), 'data', `${key}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }
}

export async function setData<T>(key: string, data: T): Promise<void> {
  if (isVercel) {
    try {
      await kv.set(key, data);
    } catch (error) {
      console.error(`KV set error for ${key}:`, error);
      throw error;
    }
  } else {
    // Local development - use JSON files
    const filePath = path.join(process.cwd(), 'data', `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }
}

// Initialize KV with default data from JSON files (run once on first deploy)
export async function initializeKV(): Promise<{ initialized: boolean; keys: string[] }> {
  if (!isVercel) {
    return { initialized: false, keys: [] };
  }

  const keys: string[] = [];

  // Check if already initialized
  const isInitialized = await kv.get('_initialized');
  if (isInitialized) {
    return { initialized: false, keys: [] };
  }

  // Load default data
  const defaultRecipes = [
    // Include a subset of default recipes for initialization
    {
      id: "1",
      name: "Butter Chicken",
      cuisine: "indian-fusion",
      prepTime: 35,
      servings: 4,
      ingredients: [
        { name: "chicken thighs", amount: "1.5", unit: "lb", category: "protein" },
        { name: "butter", amount: "4", unit: "tbsp", category: "dairy" },
        { name: "onion", amount: "1", unit: "large", category: "produce" },
        { name: "tomato sauce", amount: "1", unit: "cup", category: "pantry" },
        { name: "heavy cream", amount: "1", unit: "cup", category: "dairy" },
        { name: "garam masala", amount: "2", unit: "tsp", category: "pantry" }
      ],
      instructions: ["Season chicken", "Cook in butter", "Add sauce", "Simmer with cream"],
      isFavorite: true,
      kidFriendly: false
    }
  ];

  const defaultSettings = {
    exclusions: ["beef", "pork", "shellfish"]
  };

  const defaultPlan = {
    weekStart: new Date().toISOString().split('T')[0],
    status: "draft",
    meals: []
  };

  await kv.set('recipes', defaultRecipes);
  await kv.set('settings', defaultSettings);
  await kv.set('current-plan', defaultPlan);
  await kv.set('_initialized', true);

  keys.push('recipes', 'settings', 'current-plan');

  return { initialized: true, keys };
}
