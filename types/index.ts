export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category: 'produce' | 'protein' | 'dairy' | 'pantry' | 'frozen' | 'other';
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  prepTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  isFavorite: boolean;
  kidFriendly: boolean;
  targetAudience: 'adults' | 'kids' | 'both';
  sourceWebsite?: string;
}

export interface Meal {
  day: string;
  date: string;
  adultRecipeId: string;
  kidsRecipeId: string;
  sharedMeal: boolean;
  approved: boolean;
  // Legacy support for single-recipe plans
  recipeId?: string;
}

export interface WeeklyPlan {
  weekStart: string;
  status: 'draft' | 'approved';
  meals: Meal[];
}

export interface ShoppingItem extends Ingredient {
  checked: boolean;
  recipeNames: string[];
}

export interface AIContext {
  adultPreferences: string;
  kidsPreferences: string;
  generalNotes: string;
}

export const AVAILABLE_CUISINES = [
  { id: 'indian-fusion', label: 'Indian Fusion' },
  { id: 'mediterranean', label: 'Mediterranean' },
  { id: 'mexican', label: 'Mexican' },
  { id: 'italian', label: 'Italian' },
  { id: 'asian', label: 'Asian (Chinese, Thai, Japanese)' },
  { id: 'american', label: 'American' },
  { id: 'middle-eastern', label: 'Middle Eastern' },
  { id: 'french', label: 'French' },
  { id: 'greek', label: 'Greek' },
] as const;

export type CuisineId = typeof AVAILABLE_CUISINES[number]['id'];

export interface Settings {
  exclusions: string[];
  preferredCuisines: CuisineId[];
  aiContext: AIContext;
  recipeWebsites: string[];
}
