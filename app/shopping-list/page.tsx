'use client';

import { useState, useEffect } from 'react';
import { ShoppingItem } from '@/types';
import ShoppingList from '@/components/ShoppingList';

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchShoppingList();
  }, []);

  const fetchShoppingList = async () => {
    try {
      const res = await fetch('/api/shopping-list');
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (itemName: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemName)) {
      newChecked.delete(itemName);
    } else {
      newChecked.add(itemName);
    }
    setCheckedItems(newChecked);
  };

  const itemsWithChecked = items.map(item => ({
    ...item,
    checked: checkedItems.has(item.name),
  }));

  const checkedCount = checkedItems.size;
  const totalCount = items.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shopping List</h1>
          {items.length > 0 && (
            <p className="text-gray-600 mt-1">
              {checkedCount}/{totalCount} items checked
            </p>
          )}
        </div>
        {checkedCount > 0 && (
          <button
            onClick={() => setCheckedItems(new Set())}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Clear Checked
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <ShoppingList items={itemsWithChecked} onToggle={handleToggle} />
      </div>
    </div>
  );
}
