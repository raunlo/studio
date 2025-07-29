
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { getPredefinedItems, PredefinedChecklistItem } from "@/lib/knowledge-base";
import { PredefinedItemsDropdown } from "./predefined-items-dropdown";

type AddItemFormProps = {
  onFormSubmit: (text: string) => void;
  onTemplateSelect: (item: PredefinedChecklistItem) => void;
};

export function AddItemForm({ onFormSubmit, onTemplateSelect }: AddItemFormProps) {
  const [itemText, setItemText] = useState("");
  const [filteredItems, setFilteredItems] = useState<PredefinedChecklistItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (itemText.trim().length > 1) {
      const allItems = getPredefinedItems();
      const lowercasedText = itemText.toLowerCase();
      const found = allItems.filter(item => 
        item.text.toLowerCase().includes(lowercasedText)
      );
      setFilteredItems(found);
      setIsDropdownOpen(found.length > 0);
    } else {
      setFilteredItems([]);
      setIsDropdownOpen(false);
    }
  }, [itemText]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemText.trim()) {
      onFormSubmit(itemText.trim());
      setItemText("");
      setIsDropdownOpen(false);
    }
  };

  const handleTemplateClick = (item: PredefinedChecklistItem) => {
    onTemplateSelect(item);
    setItemText("");
    setIsDropdownOpen(false);
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex gap-2 w-full" ref={formRef}>
      <div className="flex-grow">
        <Input
          value={itemText}
          onChange={(e) => setItemText(e.target.value)}
          onFocus={() => {
            if (filteredItems.length > 0) {
              setIsDropdownOpen(true);
            }
          }}
          placeholder="Add item or search templates..."
          className="h-9 w-full"
          autoComplete="off"
        />
        {isDropdownOpen && (
           <PredefinedItemsDropdown items={filteredItems} onSelect={handleTemplateClick} />
        )}
      </div>
      <Button 
        type="submit" 
        size="sm"
        className="h-9"
        disabled={!itemText.trim()}
        aria-label="Add item"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
