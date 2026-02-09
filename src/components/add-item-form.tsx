"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { PredefinedItemsDropdown, DropdownItem } from "./predefined-items-dropdown";
import { TemplatePreviewDialog } from "./template-preview-dialog";
import { useGetAllRecipes } from "@/api/recipe/recipe";

type AddItemFormProps = {
  onFormSubmit: (text: string, rows?: { name: string }[]) => void;
};

export function AddItemForm({ onFormSubmit }: AddItemFormProps) {
  const { t, ready } = useTranslation();
  const [itemText, setItemText] = useState("");
  const [filteredItems, setFilteredItems] = useState<DropdownItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [pendingRows, setPendingRows] = useState<{ name: string }[] | undefined>(undefined);
  const [previewItem, setPreviewItem] = useState<DropdownItem | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suppressNextOpenRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Fetch user recipes
  const { data: recipes } = useGetAllRecipes();

  // Build combined dropdown items: user recipes + predefined items
  const allDropdownItems = useMemo<DropdownItem[]>(() => {

    const recipeItems: DropdownItem[] = (recipes ?? []).map(recipe => ({
      key: `recipe-${recipe.id}`,
      text: recipe.name,
      description: recipe.description ?? undefined,
      subItems: recipe.rows.map(r => ({ text: r.name })),
      source: 'recipe' as const,
    }));

    // User recipes first, then predefined
    return [...recipeItems];
  }, [recipes]);

  // Show suggestions (all templates) when focused and empty
  const suggestedItems = useMemo(() => {
    return allDropdownItems.slice(0, 5);
  }, [allDropdownItems]);

  useEffect(() => {
    if (itemText.trim().length > 0) {
      const lowercasedText = itemText.toLowerCase();

      const found = allDropdownItems.filter(item =>
        item.text.toLowerCase().includes(lowercasedText)
      );

      // kui just valisime dropdownist, ära ava uuesti
      if (suppressNextOpenRef.current) {
        suppressNextOpenRef.current = false;
        setFilteredItems(found);
        setIsDropdownOpen(false);
        setShowSuggestions(false);
        return;
      }

      setFilteredItems(found);
      setShowSuggestions(false);
      setIsDropdownOpen(isInputFocused && found.length > 0); // vaid kui input on fookuses
    } else {
      setFilteredItems([]);
      setIsDropdownOpen(false);
      // Show suggestions when focused and empty
      if (isInputFocused && allDropdownItems.length > 0) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }
  }, [itemText, isInputFocused, allDropdownItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setShowSuggestions(false);
      }
    };
    // kasuta 'click', mitte 'mousedown', et Reacti onClick jõuaks enne joosta
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemText.trim()) {
      onFormSubmit(itemText.trim(), pendingRows);
      setItemText("");
      setPendingRows(undefined);
      setIsDropdownOpen(false);
      setShowSuggestions(false);
      setFilteredItems([]);
    }
  };

  const handleTemplateClick = (item: DropdownItem) => {
    suppressNextOpenRef.current = true;
    setIsDropdownOpen(false);
    setShowSuggestions(false);
    setFilteredItems([]);

    // Show preview dialog for items with sub-items
    if (item.subItems.length > 0) {
      setPreviewItem(item);
      return;
    }

    setItemText(item.text);
    setPendingRows(undefined);
  };

  const handlePreviewConfirm = () => {
    if (!previewItem) return;
    onFormSubmit(previewItem.text, previewItem.subItems.map(sub => ({ name: sub.text })));
    setPreviewItem(null);
    setItemText("");
    setPendingRows(undefined);
  };

  const handlePreviewCancel = () => {
    setPreviewItem(null);
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex gap-2 w-full" ref={formRef}>
      <div className="flex-grow relative">
        <Input
          value={itemText}
          onChange={(e) => {
            setItemText(e.target.value);
            // Clear pending rows when user manually types
            setPendingRows(undefined);
          }}
          onFocus={() => {
            setIsInputFocused(true);
            if (filteredItems.length > 0) {
              setIsDropdownOpen(true);
            } else if (!itemText.trim() && allDropdownItems.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // NB: dropdowni li onMouseDown preventib blur'i, nii et see ei sulge valimisel
            setIsInputFocused(false);
          }}
          placeholder={ready ? t('main.addItem') : 'Add item...'}
          className="h-12 sm:h-10 w-full text-base touch-manipulation"
          autoComplete="off"
        />
        {isDropdownOpen && (
          <PredefinedItemsDropdown items={filteredItems} onSelect={handleTemplateClick} />
        )}
        {showSuggestions && !isDropdownOpen && (
          <PredefinedItemsDropdown
            items={suggestedItems}
            onSelect={handleTemplateClick}
            isSuggestionMode
          />
        )}
      </div>
      <Button
        type="submit"
        size="sm"
        className="h-12 w-12 sm:h-10 sm:w-10 touch-manipulation shrink-0"
        disabled={!itemText.trim()}
        aria-label={ready ? t('main.addButton') : 'Add item'}
      >
        <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>
      <TemplatePreviewDialog
        item={previewItem}
        onConfirm={handlePreviewConfirm}
        onCancel={handlePreviewCancel}
      />
    </form>
  );
}
