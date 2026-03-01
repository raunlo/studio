'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export type FilterType = 'all' | 'active' | 'completed';

type ChecklistFilterBarProps = {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts?: {
    all: number;
    active: number;
    completed: number;
  };
};

export function ChecklistFilterBar({
  activeFilter,
  onFilterChange,
  counts,
}: ChecklistFilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-10 -mx-4 bg-card px-4 py-2 sm:-mx-6 sm:px-6">
      <Tabs value={activeFilter} onValueChange={(value) => onFilterChange(value as FilterType)}>
        <TabsList className="grid h-9 w-full touch-manipulation grid-cols-3 sm:h-10">
          <TabsTrigger value="all" className="text-sm sm:text-base">
            {t('filter.all')}
            {counts && counts.all > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {counts.all}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="text-sm sm:text-base">
            {t('filter.active')}
            {counts && counts.active > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {counts.active}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-sm sm:text-base">
            {t('filter.done')}
            {counts && counts.completed > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {counts.completed}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
