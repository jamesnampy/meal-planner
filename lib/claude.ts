import Anthropic from '@anthropic-ai/sdk';
import { Ingredient } from '@/types';

const anthropic = new Anthropic();

interface RecipeSuggestion {
  name: string;
  cuisine: string;
  prepTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  kidFriendly: boolean;
}

export async function searchRecipes(query: string): Promise<RecipeSuggestion[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Search for recipes matching: "${query}"

Return 3 recipe suggestions as a JSON array. Each recipe should have:
- name: Recipe name
- cuisine: Type (american, italian, mexican, asian, indian-fusion, mediterranean, french, japanese, thai, other)
- prepTime: Prep time in minutes (number)
- servings: Number of servings (number)
- kidFriendly: Boolean - true if mild flavors, no spicy ingredients, familiar foods
- ingredients: Array of objects with:
  - name: Ingredient name
  - amount: Amount as string (e.g., "1", "0.5", "2")
  - unit: Unit (e.g., "lb", "cup", "tbsp", "tsp", "oz", "cloves", "medium")
  - category: One of "produce", "protein", "dairy", "pantry", "frozen", "other"
- instructions: Array of step-by-step instruction strings

Return ONLY valid JSON, no other text. Example format:
[
  {
    "name": "Recipe Name",
    "cuisine": "italian",
    "prepTime": 30,
    "servings": 4,
    "kidFriendly": true,
    "ingredients": [
      {"name": "pasta", "amount": "1", "unit": "lb", "category": "pantry"}
    ],
    "instructions": ["Step 1", "Step 2"]
  }
]`
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
    // Try to extract JSON from the response
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Failed to parse recipe suggestions');
  }
}

export async function generateMealSuggestion(
  cuisinePreference?: string,
  excludeRecipeNames?: string[]
): Promise<RecipeSuggestion> {
  const excludeClause = excludeRecipeNames?.length
    ? `Do NOT suggest these recipes (already in the plan): ${excludeRecipeNames.join(', ')}`
    : '';

  const cuisineClause = cuisinePreference
    ? `Prefer ${cuisinePreference} cuisine.`
    : 'Any cuisine is fine.';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Suggest a dinner recipe for a family meal.

${cuisineClause}
${excludeClause}

Requirements:
- Easy to prepare (under 45 minutes)
- Serves 4 people
- Common ingredients available at most grocery stores

Return a single recipe as JSON with:
- name: Recipe name
- cuisine: Type (american, italian, mexican, asian, indian-fusion, mediterranean, french, japanese, thai, other)
- prepTime: Prep time in minutes (number)
- servings: Number of servings (number)
- kidFriendly: Boolean
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
