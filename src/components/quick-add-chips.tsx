"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface QuickAddChipsProps {
  onAdd: (itemName: string) => void;
}

// Quick add item keys for translation
const QUICK_ADD_KEYS = [
  { icon: "🍞", key: "bread" },
  { icon: "🥛", key: "milk" },
  { icon: "🥚", key: "eggs" },
  { icon: "🍎", key: "apples" },
  { icon: "🧈", key: "butter" },
  { icon: "☕", key: "coffee" },
];

export function QuickAddChips({ onAdd }: QuickAddChipsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {QUICK_ADD_KEYS.map((item) => {
        const label = t(`quickAdd.${item.key}`);
        return (
          <Button
            key={item.key}
            variant="outline"
            size="sm"
            onClick={() => onAdd(label)}
            className="text-xs sm:text-sm gap-1 hover:bg-primary/10 hover:border-primary/50"
          >
            <span className="text-base">{item.icon}</span>
            {label}
          </Button>
        );
      })}
    </div>
  );
}
