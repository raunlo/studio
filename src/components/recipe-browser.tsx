"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Star, Plus, Search, Check } from "lucide-react";
import { Drawer } from "vaul";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import type { DropdownItem } from "./predefined-items-dropdown";

type RecipeBrowserProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: DropdownItem[];
  onAddRecipe: (item: DropdownItem) => void;
};

type RecipeBrowserContentProps = {
  items: DropdownItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filtered: DropdownItem[];
  handleAdd: (item: DropdownItem) => void;
  recentlyAdded: Set<string>;
};

function RecipeRow({
  item,
  handleAdd,
  isRecentlyAdded,
}: {
  item: DropdownItem;
  handleAdd: (item: DropdownItem) => void;
  isRecentlyAdded: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-all duration-200 ${
        isRecentlyAdded ? "bg-emerald-50 dark:bg-emerald-950/20" : ""
      }`}
    >
      {/* Icon */}
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          item.source === "recipe" ? "bg-primary/10" : "bg-accent/10"
        }`}
      >
        {item.source === "recipe" ? (
          <BookOpen className="h-4 w-4 text-primary" />
        ) : (
          <Star className="h-4 w-4 text-accent" />
        )}
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-foreground truncate">
          {item.text}
        </span>
        <span className="block text-xs text-muted-foreground truncate">
          {item.description ||
            item.subItems
              .slice(0, 3)
              .map((s) => s.text)
              .join(", ")}
        </span>
      </div>

      {/* Sub-item count */}
      {item.subItems.length > 0 && (
        <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
          {item.subItems.length}
        </span>
      )}

      {/* Add button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 flex-shrink-0 text-primary hover:bg-primary/10 touch-manipulation"
        onClick={() => handleAdd(item)}
      >
        {isRecentlyAdded ? (
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

function RecipeBrowserContent({
  items,
  searchQuery,
  setSearchQuery,
  filtered,
  handleAdd,
  recentlyAdded,
}: RecipeBrowserContentProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("recipeBrowser.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("recipeBrowser.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("recipeBrowser.searchPlaceholder")}
            className="pl-10 h-11"
          />
        </div>
      </div>

      {/* Recipe list */}
      <div className="overflow-y-auto max-h-[60vh] border-t border-border/40">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              {t("recipeBrowser.noResults")}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {t("recipeBrowser.noResultsDescription")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filtered.map((item) => (
              <RecipeRow
                key={item.key}
                item={item}
                handleAdd={handleAdd}
                isRecentlyAdded={recentlyAdded.has(item.key)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function RecipeBrowser({
  open,
  onOpenChange,
  items,
  onAddRecipe,
}: RecipeBrowserProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setRecentlyAdded(new Set());
    }
  }, [open]);

  // Filter recipes based on search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.subItems.some((sub) => sub.text.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  // Handle adding a recipe
  const handleAdd = (item: DropdownItem) => {
    onAddRecipe(item);
    setRecentlyAdded((prev) => new Set(prev).add(item.key));
    setTimeout(() => {
      setRecentlyAdded((prev) => {
        const next = new Set(prev);
        next.delete(item.key);
        return next;
      });
    }, 1500);
  };

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] fixed bottom-0 left-0 right-0 z-50 outline-none max-h-[85vh]">
            {/* iOS-style drag handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/30 mt-4 mb-4" />
            <RecipeBrowserContent
              items={items}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filtered={filtered}
              handleAdd={handleAdd}
              recentlyAdded={recentlyAdded}
            />
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <RecipeBrowserContent
          items={items}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filtered={filtered}
          handleAdd={handleAdd}
          recentlyAdded={recentlyAdded}
        />
      </DialogContent>
    </Dialog>
  );
}
