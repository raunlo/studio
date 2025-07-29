
"use client";

import { PredefinedChecklistItem } from "@/lib/knowledge-base";

type PredefinedItemsDropdownProps = {
  items: PredefinedChecklistItem[];
  onSelect: (item: PredefinedChecklistItem) => void;
};

export function PredefinedItemsDropdown({ items, onSelect }: PredefinedItemsDropdownProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="absolute z-10 w-[calc(100%-4rem)] mt-1 bg-card border rounded-md shadow-lg">
      <ul className="py-1">
        {items.map((item) => (
          <li
            key={item.key}
            className="px-3 py-2 text-sm text-foreground hover:bg-secondary cursor-pointer"
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
