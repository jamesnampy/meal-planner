'use client';

import { useState, useEffect } from 'react';
import { Settings, AVAILABLE_CUISINES, CuisineId } from '@/types';

const DEFAULT_EXCLUSIONS = ['beef', 'pork', 'shellfish'];

const DEFAULT_SETTINGS: Settings = {
  exclusions: DEFAULT_EXCLUSIONS,
  preferredCuisines: ['indian-fusion', 'mediterranean'],
  aiContext: {
    adultPreferences: '',
    kidsPreferences: '',
    generalNotes: '',
  },
  recipeWebsites: [],
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [newExclusion, setNewExclusion] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchSettings();
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

  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebsite.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeWebsite: newWebsite.trim() }),
      });
      const data = await res.json();
      setSettings(data);
      setNewWebsite('');
    } catch (error) {
      console.error('Failed to add website:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveWebsite = async (website: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/settings?recipeWebsite=${encodeURIComponent(website)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to remove website:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCuisineToggle = async (cuisineId: CuisineId) => {
    const newCuisines = settings.preferredCuisines.includes(cuisineId)
      ? settings.preferredCuisines.filter((c) => c !== cuisineId)
      : [...settings.preferredCuisines, cuisineId];

    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredCuisines: newCuisines }),
      });
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to update cuisines:', error);
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

      {/* Preferred Cuisines */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Preferred Cuisines</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Select cuisines you want Claude to prioritize when suggesting meals.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {AVAILABLE_CUISINES.map((cuisine) => (
            <label
              key={cuisine.id}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={settings.preferredCuisines.includes(cuisine.id)}
                onChange={() => handleCuisineToggle(cuisine.id)}
                disabled={saving}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className="text-gray-700">{cuisine.label}</span>
            </label>
          ))}
        </div>
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

      {/* Recipe Websites */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Recipe Websites</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Claude will reference these trusted recipe sites when generating suggestions.
        </p>

        <form onSubmit={handleAddWebsite} className="flex gap-3 mb-4">
          <input
            type="text"
            value={newWebsite}
            onChange={(e) => setNewWebsite(e.target.value)}
            placeholder="e.g., seriouseats.com"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={saving || !newWebsite.trim()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </form>

        <div className="space-y-2">
          {settings.recipeWebsites.map((website) => (
            <div
              key={website}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-gray-800">{website}</span>
              <button
                onClick={() => handleRemoveWebsite(website)}
                disabled={saving}
                className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}

          {settings.recipeWebsites.length === 0 && (
            <p className="text-gray-500 italic py-2 text-sm">
              No websites added. Suggestions: seriouseats.com, budgetbytes.com, indianhealthyrecipes.com, skinnytaste.com
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
