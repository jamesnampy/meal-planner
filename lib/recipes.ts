import { Recipe } from '@/types';
import { getData, setData } from './storage';

const FAVORITES_KEY = 'favorites';

export async function getFavorites(): Promise<Recipe[]> {
  return getData<Recipe[]>(FAVORITES_KEY, []);
}

export async function getFavoriteById(id: string): Promise<Recipe | null> {
  const favorites = await getFavorites();
  return favorites.find(r => r.id === id) || null;
}

function generateRecipeId(): string {
  return `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function addToFavorites(recipe: Omit<Recipe, 'id'> & { id?: string }): Promise<Recipe> {
  const favorites = await getFavorites();

  // If recipe has ID, check if already exists
  if (recipe.id) {
    const existing = favorites.find(r => r.id === recipe.id);
    if (existing) {
      return existing;
    }
  }

  // Add with favorite flag and generate ID if needed
  const favoriteRecipe: Recipe = {
    ...recipe,
    id: recipe.id || generateRecipeId(),
    isFavorite: true,
    savedToLibrary: true,
  };

  favorites.push(favoriteRecipe);
  await setData(FAVORITES_KEY, favorites);
  return favoriteRecipe;
}

export async function removeFromFavorites(id: string): Promise<boolean> {
  const favorites = await getFavorites();
  const filtered = favorites.filter(r => r.id !== id);

  if (filtered.length === favorites.length) {
    return false;
  }

  await setData(FAVORITES_KEY, filtered);
  return true;
}

export async function updateFavorite(id: string, updates: Partial<Recipe>): Promise<Recipe | null> {
  const favorites = await getFavorites();
  const index = favorites.findIndex(r => r.id === id);

  if (index === -1) {
    return null;
  }

  favorites[index] = { ...favorites[index], ...updates };
  await setData(FAVORITES_KEY, favorites);
  return favorites[index];
}
