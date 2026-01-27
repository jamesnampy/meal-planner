'use client';

import { ShoppingItem } from '@/types';

interface ShoppingListProps {
  items: ShoppingItem[];
  onToggle: (itemName: string) => void;
}

const categoryLabels: Record<string, string> = {
  produce: 'Produce',
  protein: 'Protein',
  dairy: 'Dairy',
  pantry: 'Pantry',
  frozen: 'Frozen',
  other: 'Other',
};

const categoryOrder = ['produce', 'protein', 'dairy', 'pantry', 'frozen', 'other'];

export default function ShoppingList({ items, onToggle }: ShoppingListProps) {
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No items in shopping list.</p>
        <p className="text-sm text-gray-400 mt-2">
          Generate and approve a meal plan to see your shopping list.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categoryOrder.map((category) => {
        const categoryItems = groupedItems[category];
        if (!categoryItems || categoryItems.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b">
              {categoryLabels[category] || category}
            </h3>
            <ul className="space-y-2">
              {categoryItems.map((item) => (
                <li
                  key={item.name}
                  className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 ${
                    item.checked ? 'opacity-60' : ''
                  }`}
                >
                  <label className="flex items-center cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => onToggle(item.name)}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span
                      className={`ml-3 ${
                        item.checked ? 'line-through text-gray-400' : 'text-gray-700'
                      }`}
                    >
                      {item.amount} {item.unit} {item.name}
                    </span>
                  </label>
                  <span className="text-xs text-gray-400 ml-2">
                    {item.recipeNames.join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
