"use client";

import { useState } from "react";
import { getPredefinedItems, PredefinedChecklistItem, categories } from "@/lib/knowledge-base";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type TemplateMultiPickerProps = {
  onAddTemplates: (templates: PredefinedChecklistItem[]) => void;
  disabled?: boolean;
};

export function TemplateMultiPicker({ onAddTemplates, disabled }: TemplateMultiPickerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [category, setCategory] = useState<string | null>(null);

  const allTemplates = getPredefinedItems();
  const filtered = allTemplates.filter(t => {
    const matchesSearch = t.text.toLowerCase().includes(search.toLowerCase()) ||
      t.subItems.some(sub => sub.text.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === null || t.category === category;
    return matchesSearch && matchesCategory;
  });

  const toggleSelect = (key: string) => {
    setSelected(sel => sel.includes(key) ? sel.filter(k => k !== key) : [...sel, key]);
  };

  const handleAdd = () => {
    const picked = allTemplates.filter(t => selected.includes(t.key));
    onAddTemplates(picked);
    setSelected([]);
  };

  return (
    <div className="p-4 border rounded-md bg-white/80 max-w-xl mx-auto">
      <div className="mb-2 flex gap-2 flex-wrap">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Otsi template nime või alamülesannet..."
          className="w-64"
        />
        <div className="flex gap-1">
          <Button size="sm" variant={category === null ? "default" : "outline"} onClick={() => setCategory(null)}>Kõik</Button>
          {categories.map(cat => (
            <Button key={cat.key} size="sm" variant={category === cat.key ? "default" : "outline"} onClick={() => setCategory(cat.key)}>
              <span className="mr-1">{cat.icon}</span>
              <span className="hidden sm:inline">{cat.name}</span>
            </Button>
          ))}
        </div>
      </div>
      <div className="max-h-96 overflow-auto border rounded bg-slate-50 p-2">
        {filtered.length === 0 && <div className="text-muted-foreground p-4">Ei leitud ühtegi template'i.</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map(t => (
            <div
              key={t.key}
              className={`relative flex flex-col border rounded-lg bg-white shadow-sm p-3 hover:border-blue-400 transition group ${selected.includes(t.key) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}
            >
              <label className="absolute top-2 right-2">
                <input
                  type="checkbox"
                  checked={selected.includes(t.key)}
                  onChange={() => toggleSelect(t.key)}
                  className="accent-blue-600 w-5 h-5"
                  disabled={disabled}
                />
              </label>
              <div className="font-medium text-base mb-1 flex gap-2 items-center">
                {t.text}
                {t.category && (
                  <Badge className="ml-2 px-2 py-0.5 text-xs capitalize">
                    {categories.find(c => c.key === t.category)?.icon} {categories.find(c => c.key === t.category)?.name || t.category}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {t.subItems.length} alamülesannet
                </Badge>
              </div>
              {t.subItems.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1 truncate group-hover:whitespace-normal">
                  {t.subItems.slice(0, 3).map((sub, idx) => (
                    <span key={idx} className="inline-block mr-2">{sub.text}{sub.quantity ? ` (${sub.quantity})` : ""}</span>
                  ))}
                  {t.subItems.length > 3 && <span className="text-blue-500">...+{t.subItems.length - 3}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={handleAdd} disabled={selected.length === 0 || disabled}>
          Lisa valitud checklisti
        </Button>
      </div>
    </div>
  );
}

export default TemplateMultiPicker;
