'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { getPredefinedItems, PredefinedChecklistItem } from '@/lib/knowledge-base';
import { PredefinedItemsDropdown } from './predefined-items-dropdown';
import { useGetAllTemplates, useApplyTemplate, Template } from '@/api/template/template';

type AddItemFormProps = {
  checklistId: number;
  onFormSubmit: (text: string) => void;
  onTemplateApplied?: () => void;
};

export function AddItemForm({ checklistId, onFormSubmit, onTemplateApplied }: AddItemFormProps) {
  const { t, ready } = useTranslation();
  const [itemText, setItemText] = useState('');
  const [filteredItems, setFilteredItems] = useState<PredefinedChecklistItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const suppressNextOpenRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { data: templates } = useGetAllTemplates();
  const applyTemplate = useApplyTemplate();

  const filteredTemplates = useMemo(() => {
    if (!templates || itemText.trim().length < 1) return [];
    const q = itemText.toLowerCase();
    return templates.filter(
      (tmpl) =>
        tmpl.name.toLowerCase().includes(q) ||
        tmpl.rows?.some((r) => r.name.toLowerCase().includes(q)),
    );
  }, [templates, itemText]);

  const handleTemplateApply = async (template: Template) => {
    suppressNextOpenRef.current = true;
    setItemText('');
    setIsDropdownOpen(false);
    setFilteredItems([]);
    try {
      await applyTemplate.trigger({ checklistId, templateId: template.id });
      onTemplateApplied?.();
    } catch {
      // error handled by SWR
    }
  };

  useEffect(() => {
    if (itemText.trim().length > 1) {
      const allItems = getPredefinedItems();
      const lowercasedText = itemText.toLowerCase();

      const found = allItems.filter((item) => item.text.toLowerCase().includes(lowercasedText));

      if (suppressNextOpenRef.current) {
        suppressNextOpenRef.current = false;
        setFilteredItems(found);
        setIsDropdownOpen(false);
        return;
      }

      const hasResults = found.length > 0 || filteredTemplates.length > 0;
      setFilteredItems(found);
      setIsDropdownOpen(isInputFocused && hasResults);
    } else {
      setFilteredItems([]);
      setIsDropdownOpen(false);
    }
  }, [itemText, isInputFocused, filteredTemplates.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    // kasuta 'click', mitte 'mousedown', et Reacti onClick jõuaks enne joosta
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemText.trim()) {
      onFormSubmit(itemText.trim());
      setItemText('');
      setIsDropdownOpen(false);
      setFilteredItems([]);
    }
  };

  const handleTemplateClick = (item: PredefinedChecklistItem) => {
    suppressNextOpenRef.current = true; // ära luba järgmisel efektitsüklil avada
    setItemText(item.text);
    setIsDropdownOpen(false);
    setFilteredItems([]); // kohe puhasta, et mitte “re-openida”
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex w-full gap-2" ref={formRef}>
      <div className="flex-grow">
        <Input
          value={itemText}
          onChange={(e) => setItemText(e.target.value)}
          onFocus={() => {
            setIsInputFocused(true);
            if (filteredItems.length > 0) setIsDropdownOpen(true);
          }}
          onBlur={() => {
            // NB: dropdowni li onMouseDown preventib blur'i, nii et see ei sulge valimisel
            setIsInputFocused(false);
          }}
          placeholder={ready ? t('main.addItem') : 'Add item...'}
          className="h-12 w-full touch-manipulation text-base sm:h-10"
          autoComplete="off"
        />
        {isDropdownOpen && (
          <PredefinedItemsDropdown
            items={filteredItems}
            templates={filteredTemplates}
            onSelect={handleTemplateClick}
            onTemplateSelect={handleTemplateApply}
          />
        )}
      </div>
      <Button
        type="submit"
        size="sm"
        className="h-12 w-12 shrink-0 touch-manipulation sm:h-10 sm:w-10"
        disabled={!itemText.trim()}
        aria-label={ready ? t('main.addButton') : 'Add item'}
      >
        <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>
    </form>
  );
}
