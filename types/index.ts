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
}

export interface Meal {
  day: string;
  date: string;
  recipeId: string;
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

export interface Settings {
  exclusions: string[];
}
