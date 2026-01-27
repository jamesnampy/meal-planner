'use client';

import { useState, useEffect } from 'react';
import { Settings } from '@/types';

const DEFAULT_EXCLUSIONS = ['beef', 'pork', 'shellfish'];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [newExclusion, setNewExclusion] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSettings({ exclusions: DEFAULT_EXCLUSIONS });
    } finally {
      setLoading(false);
    }
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

  const handleResetDefaults = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exclusions: DEFAULT_EXCLUSIONS }),
      });
      const data = await res.json();
      setSettings(data);
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recipe Exclusions</h2>
        <p className="text-gray-600 mb-6">
          Ingredients to exclude from AI recipe suggestions. Claude will avoid recipes containing these items.
        </p>

        <form onSubmit={handleAddExclusion} className="flex gap-3 mb-6">
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

        <div className="space-y-2">
          {settings?.exclusions.map((exclusion) => (
            <div
              key={exclusion}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-gray-800 capitalize">{exclusion}</span>
              <button
                onClick={() => handleRemoveExclusion(exclusion)}
                disabled={saving}
                className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}

          {settings?.exclusions.length === 0 && (
            <p className="text-gray-500 italic py-4 text-center">
              No exclusions set. All ingredients will be allowed.
            </p>
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Reset to defaults (beef, pork, shellfish)
          </button>
        </div>
      </div>
    </div>
  );
}
