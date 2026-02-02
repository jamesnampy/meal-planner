'use client';

import { useState, useEffect } from 'react';
import { Settings, AVAILABLE_CUISINES, CuisineId, NotRecommendedRecipe } from '@/types';

const DEFAULT_EXCLUSIONS = ['beef', 'pork', 'shellfish'];

const DEFAULT_SETTINGS: Settings = {
  exclusions: DEFAULT_EXCLUSIONS,
  preferredCuisines: ['indian-fusion', 'mediterranean'],
  adultCuisines: ['indian-fusion', 'mediterranean'],
  kidsCuisines: ['american'],
  vegetarianDaysPerWeek: 1,
  aiContext: {
    adultPreferences: '',
    kidsPreferences: '',
    generalNotes: '',
  },
  recipeWebsites: [],
  adultRecipeWebsites: [],
  kidsRecipeWebsites: [],
  notRecommended: [],
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [notRecommended, setNotRecommended] = useState<NotRecommendedRecipe[]>([]);
  const [newExclusion, setNewExclusion] = useState('');
  const [newAdultWebsite, setNewAdultWebsite] = useState('');
  const [newKidsWebsite, setNewKidsWebsite] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchNotRecommended();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings({ ...DEFAULT_SETTINGS, ...data });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotRecommended = async () => {
    try {
      const res = await fetch('/api/not-recommended');
      const data = await res.json();
      setNotRecommended(data);
    } catch (error) {
      console.error('Failed to fetch not-recommended:', error);
    }
  };

  const handleRemoveNotRecommended = async (recipeName: string, audience: 'adults' | 'kids') => {
    setSaving(true);
    try {
      const res = await fetch('/api/not-recommended', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeName, audience }),
      });
      const data = await res.json();
      setNotRecommended(data.list);
    } catch (error) {
      console.error('Failed to remove not-recommended:', error);
    } finally {
      setSaving(false);
    }
  };

  const showSaveMessage = (message: string) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleAddExclusion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExclusion.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exclusion: newExclusion.trim() }),
      });
      const data = await res.json();
      setSettings(data);
      setNewExclusion('');
    } catch (error) {
      console.error('Failed to add exclusion:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveExclusion = async (exclusion: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/settings?exclusion=${encodeURIComponent(exclusion)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to remove exclusion:', error);
    } finally {
      setSaving(false);
    }
  };

  // Cuisine handlers
  const handleAddCuisine = async (list: 'adultCuisines' | 'kidsCuisines', cuisineId: CuisineId) => {
    const currentList = settings[list];
    if (currentList.includes(cuisineId)) return;
    const newList = [...currentList, cuisineId];

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [list]: newList }),
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to update cuisines:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCuisine = async (list: 'adultCuisines' | 'kidsCuisines', cuisineId: CuisineId) => {
    const newList = settings[list].filter(c => c !== cuisineId);

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [list]: newList }),
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to update cuisines:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveCuisine = async (
    list: 'adultCuisines' | 'kidsCuisines',
    index: number,
    direction: 'up' | 'down'
  ) => {
    const arr = [...settings[list]];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= arr.length) return;

    [arr[index], arr[targetIndex]] = [arr[targetIndex], arr[index]];

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [list]: arr }),
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to reorder cuisines:', error);
    } finally {
      setSaving(false);
    }
  };

  // Website handlers
  const handleAddWebsite = async (list: 'adultRecipeWebsites' | 'kidsRecipeWebsites', website: string) => {
    const normalized = website.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!normalized) return;
    const currentList = settings[list];
    if (currentList.includes(normalized)) return;
    const newList = [...currentList, normalized];

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [list]: newList }),
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to add website:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveWebsite = async (list: 'adultRecipeWebsites' | 'kidsRecipeWebsites', website: string) => {
    const newList = settings[list].filter(w => w !== website);

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [list]: newList }),
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to remove website:', error);
    } finally {
      setSaving(false);
    }
  };

  // Vegetarian days handler
  const handleVegetarianDaysChange = async (count: number) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vegetarianDaysPerWeek: count }),
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to update vegetarian days:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAiContextChange = (field: keyof typeof settings.aiContext, value: string) => {
    setSettings({
      ...settings,
      aiContext: {
        ...settings.aiContext,
        [field]: value,
      },
    });
  };

  const handleSaveAiContext = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiContext: settings.aiContext }),
      });
      const data = await res.json();
      setSettings(data);
      showSaveMessage('AI context saved!');
    } catch (error) {
      console.error('Failed to save AI context:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_SETTINGS),
      });
      const data = await res.json();
      setSettings(data);
      showSaveMessage('Settings reset to defaults!');
    } catch (error) {
      console.error('Failed to reset settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const renderCuisineList = (listKey: 'adultCuisines' | 'kidsCuisines', title: string, emoji: string) => {
    const currentList = settings[listKey];
    const availableToAdd = AVAILABLE_CUISINES.filter(c => !currentList.includes(c.id));

    return (
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">{emoji} {title}</h3>
        <p className="text-gray-600 mb-3 text-sm">
          #1 is highest priority. Use arrows to reorder.
        </p>

        {availableToAdd.length > 0 && (
          <div className="mb-3">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddCuisine(listKey, e.target.value as CuisineId);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              defaultValue=""
            >
              <option value="" disabled>Add a cuisine...</option>
              {availableToAdd.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        )}

        {currentList.length > 0 ? (
          <ol className="space-y-1.5">
            {currentList.map((cuisineId, index) => {
              const cuisine = AVAILABLE_CUISINES.find(c => c.id === cuisineId);
              return (
                <li key={cuisineId} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-sm font-bold text-emerald-600 w-5 text-center">{index + 1}</span>
                  <span className="flex-1 text-sm text-gray-800">{cuisine?.label || cuisineId}</span>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => handleMoveCuisine(listKey, index, 'up')}
                      disabled={saving || index === 0}
                      className="px-1.5 py-0.5 text-gray-500 hover:text-gray-700 disabled:opacity-30 text-sm"
                      title="Move up"
                    >
                      &#9650;
                    </button>
                    <button
                      onClick={() => handleMoveCuisine(listKey, index, 'down')}
                      disabled={saving || index === currentList.length - 1}
                      className="px-1.5 py-0.5 text-gray-500 hover:text-gray-700 disabled:opacity-30 text-sm"
                      title="Move down"
                    >
                      &#9660;
                    </button>
                    <button
                      onClick={() => handleRemoveCuisine(listKey, cuisineId)}
                      disabled={saving}
                      className="px-1.5 py-0.5 text-red-500 hover:text-red-700 disabled:opacity-30 text-sm font-bold"
                      title="Remove"
                    >
                      &times;
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-gray-500 italic text-sm">No cuisines selected</p>
        )}
      </div>
    );
  };

  const renderWebsiteList = (
    listKey: 'adultRecipeWebsites' | 'kidsRecipeWebsites',
    title: string,
    emoji: string,
    newValue: string,
    setNewValue: (v: string) => void,
  ) => {
    const currentList = settings[listKey];

    return (
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">{emoji} {title}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newValue.trim()) {
              handleAddWebsite(listKey, newValue.trim());
              setNewValue('');
            }
          }}
          className="flex gap-2 mb-3"
        >
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="e.g., seriouseats.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          <button
            type="submit"
            disabled={saving || !newValue.trim()}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </form>

        <div className="space-y-1.5">
          {currentList.map((website) => (
            <div
              key={website}
              className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg"
            >
              <span className="text-sm text-gray-800">{website}</span>
              <button
                onClick={() => handleRemoveWebsite(listKey, website)}
                disabled={saving}
                className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
          {currentList.length === 0 && (
            <p className="text-gray-500 italic text-sm">No websites added</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        {saveMessage && (
          <span className="text-emerald-600 font-medium">{saveMessage}</span>
        )}
      </div>

      {/* Ingredient Exclusions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Ingredient Exclusions</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Ingredients to exclude from AI recipe suggestions.
        </p>

        <form onSubmit={handleAddExclusion} className="flex gap-3 mb-4">
          <input
            type="text"
            value={newExclusion}
            onChange={(e) => setNewExclusion(e.target.value)}
            placeholder="Add ingredient to exclude..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={saving || !newExclusion.trim()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {settings.exclusions.map((exclusion) => (
            <span
              key={exclusion}
              className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
            >
              <span className="capitalize">{exclusion}</span>
              <button
                onClick={() => handleRemoveExclusion(exclusion)}
                disabled={saving}
                className="text-gray-500 hover:text-red-600 font-bold"
              >
                &times;
              </button>
            </span>
          ))}
          {settings.exclusions.length === 0 && (
            <span className="text-gray-500 italic text-sm">No exclusions set</span>
          )}
        </div>
      </div>

      {/* Cuisine Preferences - Split by audience */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Cuisine Preferences</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {renderCuisineList('adultCuisines', 'Adult Cuisines', '🧑')}
          {renderCuisineList('kidsCuisines', 'Kids Cuisines', '👶')}
        </div>
      </div>

      {/* Vegetarian Days */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Vegetarian Days</h2>
        <p className="text-gray-600 mb-4 text-sm">
          How many days per week should have fully vegetarian meals (no meat, poultry, or fish) for both adults and kids.
        </p>
        <select
          value={settings.vegetarianDaysPerWeek}
          onChange={(e) => handleVegetarianDaysChange(Number(e.target.value))}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {[0, 1, 2, 3, 4, 5].map(n => (
            <option key={n} value={n}>
              {n === 0 ? 'None' : `${n} day${n > 1 ? 's' : ''} per week`}
            </option>
          ))}
        </select>
      </div>

      {/* AI Context */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">AI Context</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Help Claude personalize meal suggestions by describing your family&apos;s preferences.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adult Preferences
            </label>
            <textarea
              value={settings.aiContext.adultPreferences}
              onChange={(e) => handleAiContextChange('adultPreferences', e.target.value)}
              placeholder="Preferred cuisines, spice tolerance (mild/medium/hot), health goals (low-carb, high-protein), favorite ingredients..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kids Preferences
            </label>
            <textarea
              value={settings.aiContext.kidsPreferences}
              onChange={(e) => handleAiContextChange('kidsPreferences', e.target.value)}
              placeholder="Foods they reliably eat, textures they avoid, hidden veggie strategies that work, favorite meals..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              General Notes
            </label>
            <textarea
              value={settings.aiContext.generalNotes}
              onChange={(e) => handleAiContextChange('generalNotes', e.target.value)}
              placeholder="Available cooking time on weeknights, kitchen equipment (Instant Pot, air fryer), batch cooking preferences, any allergies beyond exclusions..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <button
            onClick={handleSaveAiContext}
            disabled={saving}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            Save AI Context
          </button>
        </div>
      </div>

      {/* Recipe Websites - Split by audience */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recipe Websites</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Claude will reference these trusted recipe sites when generating suggestions. Separate sites for adult and kids meals.
        </p>
        <div className="space-y-6">
          {renderWebsiteList('adultRecipeWebsites', 'Adult Recipe Sites', '🧑', newAdultWebsite, setNewAdultWebsite)}
          {renderWebsiteList('kidsRecipeWebsites', 'Kids Recipe Sites', '👶', newKidsWebsite, setNewKidsWebsite)}
        </div>
      </div>

      {/* Not Recommended Recipes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Not Recommended Recipes</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Recipes marked as not recommended will be excluded from future AI suggestions.
        </p>

        <div className="space-y-2">
          {notRecommended.map((item) => (
            <div
              key={`${item.recipeName}-${item.audience}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <span className="text-gray-800">{item.recipeName}</span>
                <span className="ml-2 text-xs text-gray-500 capitalize">({item.audience})</span>
              </div>
              <button
                onClick={() => handleRemoveNotRecommended(item.recipeName, item.audience)}
                disabled={saving}
                className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}

          {notRecommended.length === 0 && (
            <p className="text-gray-500 italic py-2 text-sm">
              No recipes blocked. Mark recipes as &quot;not recommended&quot; from the meal plan page.
            </p>
          )}
        </div>
      </div>

      {/* Reset */}
      <div className="text-center">
        <button
          onClick={handleResetDefaults}
          disabled={saving}
          className="text-gray-500 hover:text-gray-700 text-sm underline"
        >
          Reset all settings to defaults
        </button>
      </div>
    </div>
  );
}
