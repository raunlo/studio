"use client";

import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Star, BookOpen, Settings2, Sparkles } from "lucide-react";

export type DropdownItem = {
  key: string;
  text: string;
  description?: string;
  subItems: { text: string; quantity?: number }[];
  source: 'predefined' | 'recipe';
};

type PredefinedItemsDropdownProps = {
  items: DropdownItem[];
  onSelect: (item: DropdownItem) => void;
  isSuggestionMode?: boolean;
};

export function PredefinedItemsDropdown({ items, onSelect, isSuggestionMode }: PredefinedItemsDropdownProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="absolute z-20 w-full mt-1 bg-card border rounded-md shadow-lg overflow-hidden">
      {isSuggestionMode && (
        <div className="px-3 py-2 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary/70" />
            <span className="text-xs font-medium text-muted-foreground">
              {t('recipes.title')}
            </span>
          </div>
        </div>
      )}
      <ul className="py-1 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.key}
            className="px-3 py-2.5 text-sm text-foreground hover:bg-muted/60 cursor-pointer transition-colors active:bg-muted/80"
            onClick={() => onSelect(item)}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {item.source === 'recipe' ? (
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-3 w-3 text-primary" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Star className="h-3 w-3 text-accent" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-sm">{item.text}</span>
                  {(item.description || item.subItems.length > 0) && (
                    <span className="block text-xs text-muted-foreground truncate mt-0.5">
                      {item.description || item.subItems.slice(0, 3).map(s => s.text).join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {item.subItems.length > 0 && (
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {item.subItems.length}
                  </span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  item.source === 'recipe'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-accent/10 text-accent'
                }`}>
                  {item.source === 'recipe' ? t('recipes.userRecipe') : t('recipes.predefined')}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-border/50">
        <button
          className="w-full px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center justify-center gap-1.5 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            router.push('/templates');
          }}
        >
          <Settings2 className="h-3 w-3" />
          {t('nav.manageRecipes')}
        </button>
      </div>
    </div>
  );
}
