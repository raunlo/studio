'use client';

import { PredefinedChecklistItem } from '@/lib/knowledge-base';

type PredefinedItemsDropdownProps = {
  items: PredefinedChecklistItem[];
  onSelect: (item: PredefinedChecklistItem) => void;
};

export function PredefinedItemsDropdown({ items, onSelect }: PredefinedItemsDropdownProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="absolute z-10 mt-1 w-[calc(100%-4rem)] rounded-md border bg-card shadow-lg">
      <ul className="py-1">
        {items.map((item) => (
          <li
            key={item.key}
            className="cursor-pointer px-3 py-2 text-sm text-foreground hover:bg-secondary"
            onClick={() => onSelect(item)}
            onMouseDown={(e) => e.preventDefault()} // Prevents input from losing focus
          >
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
