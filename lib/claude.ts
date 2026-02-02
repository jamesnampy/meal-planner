import Anthropic from '@anthropic-ai/sdk';
import { Ingredient, AIContext, CuisineId, AVAILABLE_CUISINES, PrepTask, PrepTaskCategory, PrepDay, Recipe, NotRecommendedRecipe } from '@/types';
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
}

function getCuisineLabels(cuisineIds: CuisineId[]): string {
  return cuisineIds
    .map(id => AVAILABLE_CUISINES.find(c => c.id === id)?.label || id)
    .join(', ');
}

function buildContextPrompt(
  aiContext: AIContext,
  adultCuisines: CuisineId[],
  kidsCuisines: CuisineId[],
  adultRecipeWebsites: string[],
  kidsRecipeWebsites: string[],
  exclusions: string[],
  targetAudience?: 'adults' | 'kids' | 'both',
  notRecommended?: NotRecommendedRecipe[],
  vegetarianDaysPerWeek?: number,
): string {
  const sections: string[] = [];

  // Audience-specific cuisine preferences with priority ordering
  if (targetAudience === 'adults' && adultCuisines.length > 0) {
    sections.push(`PREFERRED CUISINES (prioritize these for adult meals, in order of preference):
${adultCuisines.map((id, i) => `${i + 1}. ${getCuisineLabels([id])}`).join('\n')}`);
  } else if (targetAudience === 'kids' && kidsCuisines.length > 0) {
    sections.push(`PREFERRED CUISINES (prioritize these for kids meals, in order of preference):
${kidsCuisines.map((id, i) => `${i + 1}. ${getCuisineLabels([id])}`).join('\n')}`);
  } else {
    if (adultCuisines.length > 0) {
      sections.push(`ADULT CUISINE PREFERENCES (in order of priority):
${adultCuisines.map((id, i) => `${i + 1}. ${getCuisineLabels([id])}`).join('\n')}`);
    }
    if (kidsCuisines.length > 0) {
      sections.push(`KIDS CUISINE PREFERENCES (in order of priority):
${kidsCuisines.map((id, i) => `${i + 1}. ${getCuisineLabels([id])}`).join('\n')}`);
    }
  }

  // Audience-specific recipe websites
  if (targetAudience === 'adults' && adultRecipeWebsites.length > 0) {
    sections.push(`RECIPE SOURCES (MANDATORY - you MUST use recipes from ALL of these websites, distributing evenly):
${adultRecipeWebsites.map((w, i) => `${i + 1}. ${w}`).join('\n')}
Each recipe MUST have a sourceWebsite field set to one of the above websites. Rotate through all sources.`);
  } else if (targetAudience === 'kids' && kidsRecipeWebsites.length > 0) {
    sections.push(`RECIPE SOURCES (MANDATORY - you MUST use recipes from ALL of these websites, distributing evenly):
${kidsRecipeWebsites.map((w, i) => `${i + 1}. ${w}`).join('\n')}
Each recipe MUST have a sourceWebsite field set to one of the above websites. Rotate through all sources.`);
  } else {
    if (adultRecipeWebsites.length > 0) {
      sections.push(`ADULT RECIPE SOURCES (MANDATORY - distribute adult recipes across ALL of these):
${adultRecipeWebsites.map((w, i) => `${i + 1}. ${w}`).join('\n')}`);
    }
    if (kidsRecipeWebsites.length > 0) {
      sections.push(`KIDS RECIPE SOURCES (MANDATORY - distribute kids recipes across ALL of these):
${kidsRecipeWebsites.map((w, i) => `${i + 1}. ${w}`).join('\n')}`);
    }
    if (adultRecipeWebsites.length > 0 || kidsRecipeWebsites.length > 0) {
      sections.push(`Each recipe MUST have a sourceWebsite field set to one of its audience's websites. Rotate through all sources — do not favor any single website.`);
    }
  }

  // Complete dinner with healthy sides
  sections.push(`COMPLETE DINNER REQUIREMENT:
Each meal must be a COMPLETE dinner including a main dish and healthy sides.
- Adult meals: include nutritionally balanced sides (vegetables, grains, salad) for a complete healthy dinner.
- Kids meals: MUST include at least one healthy side (e.g., steamed vegetables, fruit slices, side salad). Include sides in the recipe name, ingredients, and instructions.`);

  // Vegetarian days (only for weekly generation)
  if (vegetarianDaysPerWeek && vegetarianDaysPerWeek > 0 && !targetAudience) {
    sections.push(`VEGETARIAN DAYS:
Include exactly ${vegetarianDaysPerWeek} vegetarian day(s) spread across the week. On vegetarian days, BOTH adult and kids meals must be fully vegetarian (no meat, poultry, or fish). Use protein-rich vegetarian ingredients like lentils, chickpeas, paneer, tofu, beans, or eggs.`);
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

  if (exclusions.length > 0) {
    sections.push(`EXCLUDED INGREDIENTS (do NOT use these - dietary restrictions):
${exclusions.join(', ')}`);
  }

  if (notRecommended && notRecommended.length > 0) {
    const adultBlocked = notRecommended.filter(r => r.audience === 'adults').map(r => r.recipeName);
    const kidsBlocked = notRecommended.filter(r => r.audience === 'kids').map(r => r.recipeName);
    const lines: string[] = ['NOT RECOMMENDED RECIPES (do NOT suggest these or very similar ones):'];
    if (adultBlocked.length > 0) {
      lines.push(`- Adults: ${adultBlocked.join(', ')}`);
    }
    if (kidsBlocked.length > 0) {
      lines.push(`- Kids: ${kidsBlocked.join(', ')}`);
    }
    sections.push(lines.join('\n'));
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
    settings.adultCuisines,
    settings.kidsCuisines,
    settings.adultRecipeWebsites,
    settings.kidsRecipeWebsites,
    settings.exclusions,
    targetAudience,
    settings.notRecommended,
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
- sourceWebsite: The recipe source website (REQUIRED if recipe websites are configured in the context above, use one of the listed sites)
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
    settings.adultCuisines,
    settings.kidsCuisines,
    settings.adultRecipeWebsites,
    settings.kidsRecipeWebsites,
    settings.exclusions,
    targetAudience,
    settings.notRecommended,
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
- sourceWebsite: The recipe source website (REQUIRED if recipe websites are configured, use one of the listed sites)
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
    settings.adultCuisines,
    settings.kidsCuisines,
    settings.adultRecipeWebsites,
    settings.kidsRecipeWebsites,
    settings.exclusions,
    undefined,
    settings.notRecommended,
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
- Always generate SEPARATE and DISTINCT recipes for adults and kids. Never suggest the same recipe for both.

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
    "sourceWebsite": "one-of-the-configured-websites.com",
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
    "sourceWebsite": "one-of-the-configured-websites.com",
    "ingredients": [{"name": "...", "amount": "1", "unit": "lb", "category": "protein"}],
    "instructions": ["Step 1", "Step 2"]
  }
}

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

export interface GeneratedMeal {
  day: string;
  date: string;
  adultRecipe: RecipeSuggestion;
  kidsRecipe: RecipeSuggestion;
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

export async function generateWeeklyMeals(
  weekDates: { day: string; date: string }[]
): Promise<GeneratedMeal[]> {
  const settings = await getSettings();
  const contextPrompt = buildContextPrompt(
    settings.aiContext,
    settings.adultCuisines,
    settings.kidsCuisines,
    settings.adultRecipeWebsites,
    settings.kidsRecipeWebsites,
    settings.exclusions,
    undefined,
    settings.notRecommended,
    settings.vegetarianDaysPerWeek,
  );

  const daysDescription = weekDates
    .map(d => `${d.day} (${d.date})`)
    .join(', ');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `Generate a complete weekly dinner plan for a family with 5 weekday meals.

${contextPrompt}

DAYS TO PLAN: ${daysDescription}

For EACH day, generate:
1. An ADULT meal: From preferred cuisines, can have complex flavors
2. A KIDS meal: Simple, familiar, nutritious, kid-friendly

IMPORTANT GUIDELINES:
- Ensure variety across the week (different proteins, cuisines, cooking methods)
- Don't repeat the same main protein on consecutive days
- Use the ADULT cuisine preferences for adult meals and KIDS cuisine preferences for kids meals. Higher-priority cuisines should appear more often.
- Always generate SEPARATE and DISTINCT recipes for adults and kids.
- Keep prep times under 45 minutes for weeknight cooking
- Use common ingredients available at most grocery stores
- IMPORTANT: If recipe source websites are listed above, you MUST spread recipes across ALL of them per audience. Every listed website must be used for at least one recipe. Set the sourceWebsite field for every recipe.
- If vegetarian days are specified above, those days must use ONLY vegetarian proteins (lentils, chickpeas, paneer, tofu, beans, eggs). Spread vegetarian days evenly across the week.
- Every meal must include healthy sides — see the COMPLETE DINNER REQUIREMENT above.

Return a JSON array with this structure:
[
  {
    "day": "Monday",
    "date": "2024-01-15",
    "adultRecipe": {
      "name": "Recipe Name",
      "cuisine": "cuisine-type",
      "prepTime": 30,
      "servings": 4,
      "kidFriendly": false,
      "targetAudience": "adults",
      "sourceWebsite": "one-of-the-configured-websites.com",
      "ingredients": [{"name": "ingredient", "amount": "1", "unit": "lb", "category": "protein"}],
      "instructions": ["Step 1", "Step 2"]
    },
    "kidsRecipe": {
      "name": "Recipe Name",
      "cuisine": "cuisine-type",
      "prepTime": 20,
      "servings": 4,
      "kidFriendly": true,
      "targetAudience": "kids",
      "sourceWebsite": "one-of-the-configured-websites.com",
      "ingredients": [{"name": "ingredient", "amount": "1", "unit": "lb", "category": "protein"}],
      "instructions": ["Step 1", "Step 2"]
    }
  }
]

Ingredient categories must be one of: "produce", "protein", "dairy", "pantry", "frozen", "other"

Return ONLY the JSON array, no other text.`
      }
    ]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  let meals: GeneratedMeal[];
  try {
    meals = JSON.parse(content.text);
  } catch {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      meals = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse weekly meals');
    }
  }

  // Ensure dates are correct from our input
  return meals.map((meal, index) => ({
    ...meal,
    day: weekDates[index].day,
    date: weekDates[index].date,
  }));
}

export async function generateSingleMeal(
  day: string,
  targetAudience: 'adults' | 'kids',
  excludeRecipeNames: string[]
): Promise<RecipeSuggestion> {
  const settings = await getSettings();
  const contextPrompt = buildContextPrompt(
    settings.aiContext,
    settings.adultCuisines,
    settings.kidsCuisines,
    settings.adultRecipeWebsites,
    settings.kidsRecipeWebsites,
    settings.exclusions,
    targetAudience,
    settings.notRecommended,
  );

  const excludeClause = excludeRecipeNames.length
    ? `Do NOT suggest these recipes (already in the plan): ${excludeRecipeNames.join(', ')}`
    : '';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Generate a replacement ${targetAudience === 'adults' ? 'adult' : 'kids'} dinner recipe for ${day}.

${contextPrompt}

${excludeClause}

Requirements:
- Easy to prepare (under 45 minutes)
- Serves 4 people
- Common ingredients available at most grocery stores
${targetAudience === 'kids' ? '- Must be kid-friendly: familiar flavors, mild taste, appealing to children' : ''}

Return a single recipe as JSON:
{
  "name": "Recipe Name",
  "cuisine": "cuisine-type",
  "prepTime": 30,
  "servings": 4,
  "kidFriendly": ${targetAudience === 'kids' ? 'true' : 'false'},
  "targetAudience": "${targetAudience}",
  "sourceWebsite": "one-of-the-configured-websites.com",
  "ingredients": [{"name": "ingredient", "amount": "1", "unit": "lb", "category": "protein"}],
  "instructions": ["Step 1", "Step 2"]
}

Ingredient categories must be one of: "produce", "protein", "dairy", "pantry", "frozen", "other"

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
