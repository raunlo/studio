"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { getPredefinedItems, PredefinedChecklistItem } from "@/lib/knowledge-base";
import { PredefinedItemsDropdown } from "./predefined-items-dropdown";

type AddItemFormProps = {
  onFormSubmit: (text: string) => void;
};

export function AddItemForm({ onFormSubmit }: AddItemFormProps) {
  const [itemText, setItemText] = useState("");
  const [filteredItems, setFilteredItems] = useState<PredefinedChecklistItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false); // NEW

  const suppressNextOpenRef = useRef(false); // NEW
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (itemText.trim().length > 1) {
      const allItems = getPredefinedItems();
      const lowercasedText = itemText.toLowerCase();

      const found = allItems.filter(item =>
        item.text.toLowerCase().includes(lowercasedText)
      );

      // kui just valisime dropdownist, ära ava uuesti
      if (suppressNextOpenRef.current) {
        suppressNextOpenRef.current = false;
        setFilteredItems(found);
        setIsDropdownOpen(false);
        return;
      }

      setFilteredItems(found);
      setIsDropdownOpen(isInputFocused && found.length > 0); // vaid kui input on fookuses
    } else {
      setFilteredItems([]);
      setIsDropdownOpen(false);
    }
  }, [itemText, isInputFocused]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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
      onFormSubmit(itemText.trim());
      setItemText("");
      setIsDropdownOpen(false);
      setFilteredItems([]);
    }
  };

  const handleTemplateClick = (item: PredefinedChecklistItem) => {
    suppressNextOpenRef.current = true;           // ära luba järgmisel efektitsüklil avada
    setItemText(item.text);
    setIsDropdownOpen(false);
    setFilteredItems([]);                         // kohe puhasta, et mitte “re-openida”
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex gap-2 w-full" ref={formRef}>
      <div className="flex-grow">
        <Input
          value={itemText}
          onChange={(e) => setItemText(e.target.value)}
          onFocus={() => {
            setIsInputFocused(true);
            if (filteredItems.length > 0) setIsDropdownOpen(true);
          }}
          onBlur={() => {
            // NB: dropdowni li onMouseDown preventib blur’i, nii et see ei sulge valimisel
            setIsInputFocused(false);
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
