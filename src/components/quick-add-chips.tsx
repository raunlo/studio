"use client";

import { Button } from "@/components/ui/button";

interface QuickAddChipsProps {
  onAdd: (itemName: string) => void;
}

// Common items for quick adding
const QUICK_ADD_ITEMS = [
  { icon: "🍞", label: "Bread" },
  { icon: "🥛", label: "Milk" },
  { icon: "🥚", label: "Eggs" },
  { icon: "🍎", label: "Apples" },
  { icon: "🧈", label: "Butter" },
  { icon: "☕", label: "Coffee" },
];

export function QuickAddChips({ onAdd }: QuickAddChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {QUICK_ADD_ITEMS.map((item) => (
        <Button
          key={item.label}
          variant="outline"
          size="sm"
          onClick={() => onAdd(item.label)}
          className="text-xs sm:text-sm gap-1 hover:bg-blue-50 hover:border-blue-300"
        >
          <span className="text-base">{item.icon}</span>
          {item.label}
        </Button>
      ))}
    </div>
  );
}
