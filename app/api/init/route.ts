import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Default recipes to initialize KV storage
const DEFAULT_RECIPES = [
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
      { name: "garlic", amount: "4", unit: "cloves", category: "produce" },
      { name: "tomato sauce", amount: "1", unit: "cup", category: "pantry" },
      { name: "heavy cream", amount: "1", unit: "cup", category: "dairy" },
      { name: "garam masala", amount: "2", unit: "tsp", category: "pantry" },
      { name: "rice", amount: "2", unit: "cups", category: "pantry" }
    ],
    instructions: [
      "Cut chicken into bite-sized pieces and season with salt and garam masala",
      "Melt butter in a large pan and cook chicken until browned",
      "Add diced onion and garlic, cook until softened",
      "Stir in tomato sauce and simmer for 15 minutes",
      "Add heavy cream and cook for another 5 minutes",
      "Serve over rice"
    ],
    isFavorite: true,
    kidFriendly: false
  },
  {
    id: "2",
    name: "Spaghetti and Meatballs",
    cuisine: "italian",
    prepTime: 40,
    servings: 4,
    ingredients: [
      { name: "ground turkey", amount: "1", unit: "lb", category: "protein" },
      { name: "spaghetti", amount: "1", unit: "lb", category: "pantry" },
      { name: "marinara sauce", amount: "24", unit: "oz", category: "pantry" },
      { name: "breadcrumbs", amount: "0.5", unit: "cup", category: "pantry" },
      { name: "parmesan cheese", amount: "0.5", unit: "cup", category: "dairy" },
      { name: "egg", amount: "1", unit: "large", category: "dairy" },
      { name: "garlic", amount: "3", unit: "cloves", category: "produce" }
    ],
    instructions: [
      "Mix ground turkey, breadcrumbs, egg, minced garlic, and half the parmesan",
      "Form into meatballs and bake at 400F for 20 minutes",
      "Cook spaghetti according to package directions",
      "Heat marinara sauce and add cooked meatballs",
      "Serve over spaghetti with remaining parmesan"
    ],
    isFavorite: true,
    kidFriendly: true
  },
  {
    id: "3",
    name: "Chicken Stir Fry",
    cuisine: "asian",
    prepTime: 25,
    servings: 4,
    ingredients: [
      { name: "chicken breast", amount: "1", unit: "lb", category: "protein" },
      { name: "broccoli", amount: "2", unit: "cups", category: "produce" },
      { name: "bell pepper", amount: "2", unit: "medium", category: "produce" },
      { name: "soy sauce", amount: "3", unit: "tbsp", category: "pantry" },
      { name: "sesame oil", amount: "1", unit: "tbsp", category: "pantry" },
      { name: "ginger", amount: "1", unit: "inch", category: "produce" },
      { name: "rice", amount: "2", unit: "cups", category: "pantry" }
    ],
    instructions: [
      "Slice chicken into thin strips",
      "Heat sesame oil in a wok over high heat",
      "Stir fry chicken until cooked through, set aside",
      "Add vegetables and ginger, stir fry for 3-4 minutes",
      "Return chicken, add soy sauce, toss to combine",
      "Serve over rice"
    ],
    isFavorite: false,
    kidFriendly: true
  },
  {
    id: "4",
    name: "Tacos",
    cuisine: "mexican",
    prepTime: 20,
    servings: 4,
    ingredients: [
      { name: "ground turkey", amount: "1", unit: "lb", category: "protein" },
      { name: "taco shells", amount: "12", unit: "shells", category: "pantry" },
      { name: "lettuce", amount: "2", unit: "cups", category: "produce" },
      { name: "tomato", amount: "2", unit: "medium", category: "produce" },
      { name: "cheddar cheese", amount: "1", unit: "cup", category: "dairy" },
      { name: "taco seasoning", amount: "1", unit: "packet", category: "pantry" },
      { name: "sour cream", amount: "0.5", unit: "cup", category: "dairy" }
    ],
    instructions: [
      "Brown ground turkey and drain excess fat",
      "Add taco seasoning and water per package directions",
      "Warm taco shells in oven",
      "Shred lettuce and dice tomatoes",
      "Assemble tacos with meat, cheese, lettuce, tomato, and sour cream"
    ],
    isFavorite: false,
    kidFriendly: true
  },
  {
    id: "5",
    name: "Salmon with Roasted Vegetables",
    cuisine: "american",
    prepTime: 30,
    servings: 4,
    ingredients: [
      { name: "salmon fillets", amount: "4", unit: "6oz", category: "protein" },
      { name: "asparagus", amount: "1", unit: "bunch", category: "produce" },
      { name: "cherry tomatoes", amount: "1", unit: "pint", category: "produce" },
      { name: "olive oil", amount: "3", unit: "tbsp", category: "pantry" },
      { name: "lemon", amount: "1", unit: "whole", category: "produce" },
      { name: "garlic", amount: "3", unit: "cloves", category: "produce" }
    ],
    instructions: [
      "Preheat oven to 400F",
      "Toss asparagus and tomatoes with olive oil and garlic",
      "Place salmon on baking sheet, season with salt and pepper",
      "Arrange vegetables around salmon",
      "Roast for 15-20 minutes until salmon is cooked through",
      "Squeeze lemon over everything before serving"
    ],
    isFavorite: true,
    kidFriendly: false
  },
  {
    id: "6",
    name: "Mac and Cheese",
    cuisine: "american",
    prepTime: 25,
    servings: 4,
    ingredients: [
      { name: "elbow macaroni", amount: "1", unit: "lb", category: "pantry" },
      { name: "cheddar cheese", amount: "2", unit: "cups", category: "dairy" },
      { name: "milk", amount: "2", unit: "cups", category: "dairy" },
      { name: "butter", amount: "4", unit: "tbsp", category: "dairy" },
      { name: "flour", amount: "3", unit: "tbsp", category: "pantry" }
    ],
    instructions: [
      "Cook macaroni according to package directions",
      "Make roux with butter and flour",
      "Slowly whisk in milk and cook until thickened",
      "Add cheese and stir until melted",
      "Combine with cooked pasta and serve"
    ],
    isFavorite: false,
    kidFriendly: true
  }
];

export async function GET(request: NextRequest) {
  // Verify secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Check if already initialized
    const existing = await kv.get('recipes');
    if (existing) {
      return NextResponse.json({
        message: 'Already initialized',
        recipesCount: (existing as unknown[]).length
      });
    }

    // Initialize with defaults
    await kv.set('recipes', DEFAULT_RECIPES);
    await kv.set('settings', { exclusions: ['beef', 'pork', 'shellfish'] });
    await kv.set('current-plan', { weekStart: new Date().toISOString().split('T')[0], status: 'draft', meals: [] });

    return NextResponse.json({
      message: 'Initialized successfully',
      recipesCount: DEFAULT_RECIPES.length
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({ error: 'Failed to initialize' }, { status: 500 });
  }
}
