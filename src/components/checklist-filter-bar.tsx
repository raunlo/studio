"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  return (
    <div className="sticky top-0 z-10 bg-card border-b pb-3 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3">
      <Tabs value={activeFilter} onValueChange={(value) => onFilterChange(value as FilterType)}>
        <TabsList className="grid w-full grid-cols-3 h-11 sm:h-10 touch-manipulation">
          <TabsTrigger value="all" className="text-sm sm:text-base">
            All
            {counts && counts.all > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {counts.all}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="text-sm sm:text-base">
            Active
            {counts && counts.active > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {counts.active}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-sm sm:text-base">
            Done
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
