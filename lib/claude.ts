import Anthropic from '@anthropic-ai/sdk';
import { Ingredient, AIContext, CuisineId, AVAILABLE_CUISINES, PrepTask, PrepTaskCategory, PrepDay, Recipe } from '@/types';
import { getSettings } from './settings';

const anthropic = new Anthropic();

interface RecipeSuggestion {
  name: string;
  cuisine: string;
  prepTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  kidFriendly: boolean;
  targetAudience: 'adults' | 'kids' | 'both';
  sourceWebsite?: string;
}

interface DualMealSuggestion {
  adultMeal: RecipeSuggestion;
  kidsMeal: RecipeSuggestion;
  sharedMeal: boolean;
}

function getCuisineLabels(cuisineIds: CuisineId[]): string {
  return cuisineIds
    .map(id => AVAILABLE_CUISINES.find(c => c.id === id)?.label || id)
    .join(', ');
}

function buildContextPrompt(
  aiContext: AIContext,
  preferredCuisines: CuisineId[],
  recipeWebsites: string[],
  exclusions: string[],
  targetAudience?: 'adults' | 'kids' | 'both'
): string {
  const sections: string[] = [];

  if (preferredCuisines.length > 0) {
    sections.push(`PREFERRED CUISINES (prioritize these):
${getCuisineLabels(preferredCuisines)}`);
  }

  if (aiContext.adultPreferences || aiContext.kidsPreferences || aiContext.generalNotes) {
    const contextLines: string[] = ['FAMILY CONTEXT:'];
    if (aiContext.adultPreferences) {
      contextLines.push(`- Adult preferences: ${aiContext.adultPreferences}`);
    }
    if (aiContext.kidsPreferences) {
      contextLines.push(`- Kids preferences: ${aiContext.kidsPreferences}`);
    }
    if (aiContext.generalNotes) {
      contextLines.push(`- General notes: ${aiContext.generalNotes}`);
    }
    sections.push(contextLines.join('\n'));
  }

  if (recipeWebsites.length > 0) {
    sections.push(`RECIPE SOURCES (prefer recipes from these websites):
${recipeWebsites.join(', ')}`);
  }

  if (exclusions.length > 0) {
    sections.push(`EXCLUDED INGREDIENTS (do NOT use these - dietary restrictions):
${exclusions.join(', ')}`);
  }

  if (targetAudience) {
    const audienceGuidance = targetAudience === 'adults'
      ? 'Focus on flavor complexity and health goals from preferred cuisines.'
      : targetAudience === 'kids'
      ? 'Focus on familiar flavors, easy textures, and mild tastes. Consider hidden veggie strategies.'
      : 'Create a recipe that works for both adults and kids.';
    sections.push(`TARGET AUDIENCE: ${targetAudience}
${audienceGuidance}`);
  }

  return sections.join('\n\n');
}

export async function searchRecipes(
  query: string,
  targetAudience?: 'adults' | 'kids' | 'both'
): Promise<RecipeSuggestion[]> {
  const settings = await getSettings();
  const contextPrompt = buildContextPrompt(
    settings.aiContext,
    settings.preferredCuisines,
    settings.recipeWebsites,
    settings.exclusions,
    targetAudience
  );

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a meal planning assistant. Search for recipes matching: "${query}"

${contextPrompt}

Return 3 recipe suggestions as a JSON array. Each recipe should have:
- name: Recipe name
- cuisine: Type (american, italian, mexican, asian, indian-fusion, mediterranean, french, japanese, thai, middle-eastern, greek, other)
- prepTime: Prep time in minutes (number)
- servings: Number of servings (number)
- kidFriendly: Boolean - true if mild flavors, no spicy ingredients, familiar foods
- targetAudience: "adults", "kids", or "both"
- sourceWebsite: If inspired by a specific website from the sources list, include it (optional)
- ingredients: Array of objects with:
  - name: Ingredient name
  - amount: Amount as string (e.g., "1", "0.5", "2")
  - unit: Unit (e.g., "lb", "cup", "tbsp", "tsp", "oz", "cloves", "medium")
  - category: One of "produce", "protein", "dairy", "pantry", "frozen", "other"
- instructions: Array of step-by-step instruction strings

Consider prep time optimization - suggest recipes that fit within weeknight time constraints from general notes.

Return ONLY valid JSON, no other text.`
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const recipes = JSON.parse(content.text);
    return recipes;
  } catch {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse recipe suggestions');
  }
}

export async function generateMealSuggestion(
  targetAudience: 'adults' | 'kids' | 'both' = 'both',
  cuisinePreference?: string,
  excludeRecipeNames?: string[]
): Promise<RecipeSuggestion> {
  const settings = await getSettings();
  const contextPrompt = buildContextPrompt(
    settings.aiContext,
    settings.preferredCuisines,
    settings.recipeWebsites,
    settings.exclusions,
    targetAudience
  );

  const excludeClause = excludeRecipeNames?.length
    ? `Do NOT suggest these recipes (already in the plan): ${excludeRecipeNames.join(', ')}`
    : '';

  const cuisineClause = cuisinePreference
    ? `Prefer ${cuisinePreference} cuisine.`
    : '';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Suggest a dinner recipe for a family meal.

${contextPrompt}

${cuisineClause}
${excludeClause}

Requirements:
- Easy to prepare (under 45 minutes, or per general notes)
- Serves 4 people
- Common ingredients available at most grocery stores

Return a single recipe as JSON with:
- name: Recipe name
- cuisine: Type (american, italian, mexican, asian, indian-fusion, mediterranean, french, japanese, thai, middle-eastern, greek, other)
- prepTime: Prep time in minutes (number)
- servings: Number of servings (number)
- kidFriendly: Boolean
- targetAudience: "${targetAudience}"
- sourceWebsite: If inspired by a specific website from the sources list (optional)
- ingredients: Array of objects with name, amount, unit, category
- instructions: Array of step-by-step strings

Return ONLY valid JSON, no other text.`
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text);
  } catch {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse meal suggestion');
  }
}

export async function generateDualMealSuggestion(
  day: string,
  excludeRecipeNames?: string[]
): Promise<DualMealSuggestion> {
  const settings = await getSettings();
  const contextPrompt = buildContextPrompt(
    settings.aiContext,
    settings.preferredCuisines,
    settings.recipeWebsites,
    settings.exclusions
  );

  const excludeClause = excludeRecipeNames?.length
    ? `Do NOT suggest these recipes (already in the plan): ${excludeRecipeNames.join(', ')}`
    : '';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Generate a dinner pair for ${day}:
1. Adult meal: From preferred cuisines, complex flavors OK
2. Kids meal: Simple, familiar, nutritious

${contextPrompt}

OPTIMIZATION GOALS:
- Minimize total prep time
- Share ingredients where possible
- If a recipe works well for both adults AND kids, you may suggest the same recipe for both (set sharedMeal: true)

${excludeClause}

Return a JSON object with this structure:
{
  "adultMeal": {
    "name": "Recipe Name",
    "cuisine": "cuisine-type",
    "prepTime": 30,
    "servings": 4,
    "kidFriendly": false,
    "targetAudience": "adults",
    "sourceWebsite": "optional-website.com",
    "ingredients": [{"name": "...", "amount": "1", "unit": "lb", "category": "protein"}],
    "instructions": ["Step 1", "Step 2"]
  },
  "kidsMeal": {
    "name": "Recipe Name",
    "cuisine": "cuisine-type",
    "prepTime": 20,
    "servings": 4,
    "kidFriendly": true,
    "targetAudience": "kids",
    "sourceWebsite": "optional-website.com",
    "ingredients": [{"name": "...", "amount": "1", "unit": "lb", "category": "protein"}],
    "instructions": ["Step 1", "Step 2"]
  },
  "sharedMeal": false
}

If sharedMeal is true, both adultMeal and kidsMeal should be the same recipe (duplicate the recipe object).

Return ONLY valid JSON, no other text.`
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    return JSON.parse(content.text);
  } catch {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse dual meal suggestion');
  }
}

export interface MealWithDay {
  day: string;
  recipeName: string;
  ingredients: string[];
}

export async function generatePrepTasks(meals: MealWithDay[]): Promise<PrepTask[]> {
  const settings = await getSettings();

  const mealSummary = meals.map(m =>
    `${m.day}: ${m.recipeName}\n  Ingredients: ${m.ingredients.join(', ')}`
  ).join('\n\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a meal prep planning assistant. Analyze the following weekly meal plan and generate weekend prep tasks to streamline weeknight cooking.

WEEKLY MEALS:
${mealSummary}

USER CONTEXT:
${settings.aiContext.generalNotes || 'No specific notes'}

Generate prep tasks for Saturday and Sunday. IMPORTANT: Combine similar tasks across meals where possible (e.g., if multiple recipes use onions, create ONE task to chop all onions needed for the week).

Categories to use:
- "vegetable-prep": Washing, chopping, storing produce
- "protein-prep": Marinating, portioning, par-cooking meats/tofu
- "grain-cooking": Batch cooking rice, quinoa, pasta, etc.
- "sauce-dressing": Making sauces, dressings, marinades ahead
- "spice-blend": Pre-mixing spice blends
- "other": Any other prep tasks

Return a JSON array of tasks with this structure:
[
  {
    "id": "task-1",
    "category": "vegetable-prep",
    "prepDay": "Saturday",
    "title": "Chop onions and garlic",
    "description": "Dice 4 onions and mince 2 heads of garlic for the week's recipes",
    "estimatedMinutes": 15,
    "storageInstructions": "Store in separate airtight containers. Onions last 7 days, garlic lasts 5 days refrigerated.",
    "ingredients": ["4 onions", "2 heads garlic"],
    "linkedRecipeNames": ["Chicken Tikka Masala", "Pasta Primavera"],
    "linkedMealDays": ["Monday", "Wednesday"]
  }
]

Guidelines:
- Saturday: Items that keep well (marinades, spice blends, hearty vegetables like carrots, celery)
- Sunday: Items best prepped fresh (delicate greens, herbs, items used early in the week)
- Combine overlapping ingredients into single tasks
- Be specific about quantities and storage
- Aim for 5-10 meaningful tasks total
- Each task should have a clear, actionable title

Return ONLY the JSON array, no other text.`
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  let tasks: Array<{
    id: string;
    category: string;
    prepDay: string;
    title: string;
    description: string;
    estimatedMinutes: number;
    storageInstructions: string;
    ingredients: string[];
    linkedRecipeNames: string[];
    linkedMealDays: string[];
  }>;

  try {
    tasks = JSON.parse(content.text);
  } catch {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      tasks = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse prep tasks');
    }
  }

  // Map to PrepTask with completed: false and ensure correct types
  return tasks.map(t => ({
    id: t.id,
    category: t.category as PrepTaskCategory,
    prepDay: t.prepDay as PrepDay,
    title: t.title,
    description: t.description,
    estimatedMinutes: t.estimatedMinutes,
    storageInstructions: t.storageInstructions,
    ingredients: t.ingredients,
    linkedRecipeNames: t.linkedRecipeNames,
    linkedMealDays: t.linkedMealDays,
    completed: false,
  }));
}
