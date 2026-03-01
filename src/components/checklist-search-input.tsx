'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  placeholder = 'Search items...',
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
    setLocalValue('');
    onClear();
  };

  return (
    <div className="sticky top-0 z-10 -mx-4 mb-4 border-b bg-card px-4 pb-3 pt-3 sm:-mx-6 sm:px-6">
      <div className="relative">
        {/* Search icon */}
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

        {/* Search input */}
        <Input
          type="search"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className="h-12 touch-manipulation pl-10 pr-10 text-base sm:h-11"
          aria-label="Search checklist items"
        />

        {/* Clear button */}
        {localValue && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 touch-manipulation sm:h-9 sm:w-9"
            aria-label="Clear search"
          >
            <X className="h-5 w-5 text-muted-foreground sm:h-4 sm:w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
