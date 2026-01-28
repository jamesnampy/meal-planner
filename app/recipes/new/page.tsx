'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ingredient } from '@/types';

const cuisineOptions = [
  'american', 'italian', 'mexican', 'asian', 'indian-fusion',
  'mediterranean', 'french', 'japanese', 'thai', 'other'
];

const categoryOptions: Ingredient['category'][] = [
  'produce', 'protein', 'dairy', 'pantry', 'frozen', 'other'
];

interface AISuggestion {
  name: string;
  cuisine: string;
  prepTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  kidFriendly: boolean;
  sourceUrl?: string;
}

function NewRecipeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAIMode = searchParams.get('ai') === 'true';

  const [saving, setSaving] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AISuggestion | null>(null);

  const [recipe, setRecipe] = useState({
    name: '',
    cuisine: 'american',
    prepTime: 30,
    servings: 4,
    kidFriendly: false,
    isFavorite: false,
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', amount: '', unit: '', category: 'other' },
  ]);

  const [instructions, setInstructions] = useState(['']);

  useEffect(() => {
    if (selectedSuggestion) {
      setRecipe({
        name: selectedSuggestion.name,
        cuisine: selectedSuggestion.cuisine,
        prepTime: selectedSuggestion.prepTime,
        servings: selectedSuggestion.servings,
        kidFriendly: selectedSuggestion.kidFriendly,
        isFavorite: false,
      });
      setIngredients(selectedSuggestion.ingredients);
      setInstructions(selectedSuggestion.instructions);
    }
  }, [selectedSuggestion]);

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;

    setAiSearching(true);
    setAiSuggestions([]);

    try {
      const res = await fetch('/api/recipes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setAiSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('AI search failed:', error);
      alert('Failed to search for recipes');
    } finally {
      setAiSearching(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '', category: 'other' }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const validIngredients = ingredients.filter(i => i.name.trim());
    const validInstructions = instructions.filter(i => i.trim());

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...recipe,
          ingredients: validIngredients,
          instructions: validInstructions,
          targetAudience: recipe.kidFriendly ? 'both' : 'adults',
        }),
      });

      if (res.ok) {
        router.push('/recipes');
      } else {
        alert('Failed to save recipe');
      }
    } catch (error) {
      console.error('Failed to save recipe:', error);
      alert('Failed to save recipe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {isAIMode ? 'AI Recipe Search' : 'Add New Recipe'}
      </h1>

      {isAIMode && !selectedSuggestion && (
        <div className="mb-8 p-6 bg-purple-50 rounded-lg border border-purple-200">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">
            Search for Recipes with AI
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="e.g., easy Italian pasta, Thai curry, kid-friendly chicken..."
              className="flex-1 px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
            />
            <button
              onClick={handleAISearch}
              disabled={aiSearching || !aiQuery.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {aiSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {aiSuggestions.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium text-purple-900">Suggestions:</h3>
              {aiSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-lg border border-purple-200 hover:border-purple-400 cursor-pointer transition-colors"
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  <h4 className="font-semibold text-gray-900">{suggestion.name}</h4>
                  <div className="flex gap-3 mt-1 text-sm text-gray-600">
                    <span>{suggestion.cuisine}</span>
                    <span>•</span>
                    <span>{suggestion.prepTime} min</span>
                    <span>•</span>
                    <span>{suggestion.servings} servings</span>
                    {suggestion.kidFriendly && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">Kid-Friendly</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSuggestion && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-800">
            Recipe imported from AI. Review and edit below, then save to your favorites.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipe Name
          </label>
          <input
            type="text"
            required
            value={recipe.name}
            onChange={(e) => setRecipe({ ...recipe, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuisine
            </label>
            <select
              value={recipe.cuisine}
              onChange={(e) => setRecipe({ ...recipe, cuisine: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {cuisineOptions.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prep Time (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={recipe.prepTime}
              onChange={(e) => setRecipe({ ...recipe, prepTime: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servings
            </label>
            <input
              type="number"
              min="1"
              value={recipe.servings}
              onChange={(e) => setRecipe({ ...recipe, servings: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={recipe.kidFriendly}
                onChange={(e) => setRecipe({ ...recipe, kidFriendly: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600"
              />
              <span className="text-sm text-gray-700">Kid-Friendly</span>
            </label>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Ingredients
            </label>
            <button
              type="button"
              onClick={addIngredient}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              + Add Ingredient
            </button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ing, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Amount"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                  className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Ingredient name"
                  value={ing.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <select
                  value={ing.category}
                  onChange={(e) => updateIngredient(index, 'category', e.target.value)}
                  className="w-24 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="px-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Instructions
            </label>
            <button
              type="button"
              onClick={addInstruction}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              + Add Step
            </button>
          </div>
          <div className="space-y-2">
            {instructions.map((inst, index) => (
              <div key={index} className="flex gap-2">
                <span className="w-8 py-2 text-gray-500 text-sm">{index + 1}.</span>
                <input
                  type="text"
                  placeholder="Instruction step"
                  value={inst}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                />
                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="px-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save to Favorites'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewRecipePage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <NewRecipeForm />
    </Suspense>
  );
}
