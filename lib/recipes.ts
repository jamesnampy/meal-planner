import { promises as fs } from 'fs';
import path from 'path';
import { Recipe } from '@/types';

const DATA_PATH = path.join(process.cwd(), 'data', 'recipes.json');

export async function getRecipes(): Promise<Recipe[]> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const recipes = await getRecipes();
  return recipes.find(r => r.id === id) || null;
}

export async function addRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
  const recipes = await getRecipes();
  const newId = String(Math.max(0, ...recipes.map(r => parseInt(r.id))) + 1);
  const newRecipe: Recipe = { ...recipe, id: newId };
  recipes.push(newRecipe);
  await fs.writeFile(DATA_PATH, JSON.stringify(recipes, null, 2));
  return newRecipe;
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
  const recipes = await getRecipes();
  const index = recipes.findIndex(r => r.id === id);
  if (index === -1) return null;

  recipes[index] = { ...recipes[index], ...updates };
  await fs.writeFile(DATA_PATH, JSON.stringify(recipes, null, 2));
  return recipes[index];
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const recipes = await getRecipes();
  const filtered = recipes.filter(r => r.id !== id);
  if (filtered.length === recipes.length) return false;

  await fs.writeFile(DATA_PATH, JSON.stringify(filtered, null, 2));
  return true;
}

export async function toggleFavorite(id: string): Promise<Recipe | null> {
  const recipes = await getRecipes();
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return null;

  return updateRecipe(id, { isFavorite: !recipe.isFavorite });
}
