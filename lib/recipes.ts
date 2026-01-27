import { Recipe } from '@/types';
import { getData, setData } from './storage';

const RECIPES_KEY = 'recipes';

export async function getRecipes(): Promise<Recipe[]> {
  return getData<Recipe[]>(RECIPES_KEY, []);
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
  await setData(RECIPES_KEY, recipes);
  return newRecipe;
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
  const recipes = await getRecipes();
  const index = recipes.findIndex(r => r.id === id);
  if (index === -1) return null;

  recipes[index] = { ...recipes[index], ...updates };
  await setData(RECIPES_KEY, recipes);
  return recipes[index];
}

export async function deleteRecipe(id: string): Promise<boolean> {
  const recipes = await getRecipes();
  const filtered = recipes.filter(r => r.id !== id);
  if (filtered.length === recipes.length) return false;

  await setData(RECIPES_KEY, filtered);
  return true;
}

export async function toggleFavorite(id: string): Promise<Recipe | null> {
  const recipes = await getRecipes();
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return null;

  return updateRecipe(id, { isFavorite: !recipe.isFavorite });
}
