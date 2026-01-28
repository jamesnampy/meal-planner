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
  savedToLibrary?: boolean;
}

export interface Meal {
  day: string;
  date: string;
  adultRecipe: Recipe;
  kidsRecipe: Recipe;
  sharedMeal: boolean;
  approved: boolean;
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

export type PrepTaskCategory =
  | 'vegetable-prep'
  | 'protein-prep'
  | 'grain-cooking'
  | 'sauce-dressing'
  | 'spice-blend'
  | 'other';

export type PrepDay = 'Saturday' | 'Sunday';

export interface PrepTask {
  id: string;
  category: PrepTaskCategory;
  prepDay: PrepDay;
  title: string;
  description: string;
  estimatedMinutes: number;
  storageInstructions: string;
  ingredients: string[];
  linkedRecipeNames: string[];
  linkedMealDays: string[];
  completed: boolean;
}

export interface WeeklyPrepPlan {
  weekStart: string;
  totalPrepTimeMinutes: number;
  saturdayTasks: PrepTask[];
  sundayTasks: PrepTask[];
  generatedAt: string;
}
