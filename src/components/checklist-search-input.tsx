"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

type ChecklistSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  debounceMs?: number;
};

export function ChecklistSearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search items...",
  debounceMs = 300,
}: ChecklistSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange]);

  const handleClear = () => {
    setLocalValue("");
    onClear();
  };

  return (
    <div className="sticky top-0 z-10 bg-card border-b pb-3 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 mb-4">
      <div className="relative">
        {/* Search icon */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />

        {/* Search input */}
        <Input
          type="search"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="h-12 sm:h-11 pl-10 pr-10 text-base touch-manipulation"
          aria-label="Search checklist items"
        />

        {/* Clear button */}
        {localValue && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-9 sm:w-9 touch-manipulation"
            aria-label="Clear search"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}
