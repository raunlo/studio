"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { PredefinedChecklistItem, getPredefinedItems, categories } from "@/lib/knowledge-base";

type AddItemFormProps = {
  onFormSubmit: (text: string, subItems?: Array<{text: string, quantity?: number}>) => void;
};

export function AddItemFormNew({ onFormSubmit }: AddItemFormProps) {
  const [itemText, setItemText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const predefinedTemplates = getPredefinedItems();
  
  // Filter templates based on input text
  const filteredTemplates = itemText.length > 0 
    ? predefinedTemplates.filter(template => 
        template.text.toLowerCase().includes(itemText.toLowerCase())
      ).slice(0, 8) // Show max 8 suggestions
    : predefinedTemplates.slice(0, 6); // Show 6 popular when empty

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemText.trim()) {
      onFormSubmit(itemText.trim());
      setItemText("");
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  const handleTemplateSelect = (template: PredefinedChecklistItem) => {
    onFormSubmit(template.text, template.subItems);
    setItemText("");
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItemText(e.target.value);
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow clicks
    setTimeout(() => setShowDropdown(false), 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredTemplates.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev > 0 ? prev - 1 : filteredTemplates.length - 1
      );
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleTemplateSelect(filteredTemplates[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="relative">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2 w-full" ref={formRef}>
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={itemText}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder="Lisa uus ülesanne..."
            className="h-10"
            autoComplete="off"
          />
          
          {/* Dropdown suggestions */}
          {showDropdown && filteredTemplates.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              <div className="p-2 text-xs text-slate-500 border-b border-slate-100">
                {itemText ? `Sobivad template'id:` : `Populaarsed template'id:`}
              </div>
              
              {filteredTemplates.map((template, index) => {
                const categoryConfig = categories.find(cat => cat.key === template.category) || 
                                     { key: 'other', name: 'Other', color: '#64748b', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: '📝' };
                
                return (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full px-3 py-2 text-left hover:bg-blue-50 border-none bg-transparent text-sm flex items-center ${
                      index === highlightedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-base">{categoryConfig.icon}</span>
                      <span className="truncate">{template.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <Button
          type="submit"
          size="sm"
          className="h-10 px-4"
          disabled={!itemText.trim()}
          aria-label="Lisa ülesanne"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
