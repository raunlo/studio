'use client';

import { PredefinedChecklistItem } from '@/lib/knowledge-base';
import type { TemplateResponse as Template } from '@/api/checklistServiceV1.schemas';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type PredefinedItemsDropdownProps = {
  items: PredefinedChecklistItem[];
  templates?: Template[];
  onSelect: (item: PredefinedChecklistItem) => void;
  onTemplateSelect?: (template: Template) => void;
};

export function PredefinedItemsDropdown({
  items,
  templates,
  onSelect,
  onTemplateSelect,
}: PredefinedItemsDropdownProps) {
  const { t } = useTranslation();
  const hasTemplates = templates && templates.length > 0;

  if (items.length === 0 && !hasTemplates) {
    return null;
  }

  return (
    <div className="absolute z-50 mt-1 max-h-60 w-[calc(100%-4rem)] overflow-y-auto rounded-md border bg-card shadow-lg">
      {/* Templates section */}
      {hasTemplates && (
        <div>
          <div className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t('templates.title', 'Templates')}
          </div>
          <ul className="py-1">
            {templates.map((template) => (
              <li
                key={`tmpl-${template.id}`}
                className="flex cursor-pointer items-start gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary"
                onClick={() => onTemplateSelect?.(template)}
                onMouseDown={(e) => e.preventDefault()}
              >
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div>
                    <span className="font-medium">{template.name}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {template.rows?.length ?? 0} {t('templates.items', 'items')}
                    </span>
                  </div>
                  {template.rows && template.rows.length > 0 && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {template.rows
                        .slice(0, 3)
                        .map((r) => r.name)
                        .join(', ')}
                      {template.rows.length > 3 && `, +${template.rows.length - 3}`}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Divider */}
      {hasTemplates && items.length > 0 && <div className="mx-3 border-t" />}

      {/* Predefined items section */}
      {items.length > 0 && (
        <ul className="py-1">
          {items.map((item) => (
            <li
              key={item.key}
              className="cursor-pointer px-3 py-2 text-sm text-foreground hover:bg-secondary"
              onClick={() => onSelect(item)}
              onMouseDown={(e) => e.preventDefault()}
            >
              {item.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
