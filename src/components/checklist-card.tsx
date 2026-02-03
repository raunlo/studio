
"use client";

import { forwardRef, useImperativeHandle, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Droppable } from "@hello-pangea/dnd";
import { AddItemForm } from "@/components/add-item-form";
import { ChecklistResponse } from "@/api/checklistServiceV1.schemas";
import { ChecklistCardHandle, ChecklistItem } from "@/components/shared/types";
import { useChecklist } from "@/hooks/use-checklist";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { QuickAddChips } from "@/components/quick-add-chips";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useTranslation } from 'react-i18next';
import { ChecklistFilterBar, FilterType } from "@/components/checklist-filter-bar";
import { DraggableChecklistItem, getItemKey } from "@/components/draggable-checklist-item";

type ChecklistCardProps = {
  checklist: ChecklistResponse;
  activeFilter?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
};

export const ChecklistCard = forwardRef<ChecklistCardHandle, ChecklistCardProps>(
  ({ checklist, activeFilter = 'all', onFilterChange }, ref): JSX.Element => {
  const { t } = useTranslation();
  const {
    items,
    isLoading,
    error,
    addItem,
    reorderItem,
    deleteRow: deleteRowFn,
    updateItem: updateItemFn,
    addRow: addRowFn,
    deleteItem: deleteItemFn,
    restoreItem: restoreItemFn,
    toggleCompletion
   } = useChecklist(checklist.id, { refreshInterval: 10000 });

  // Mobile detection for swipe gestures
  const isMobile = useIsMobile();

  // Single-pass filter: calculate counts and filtered items together
  const { filterCounts, displayedItems } = useMemo(() => {
    let activeCount = 0;
    let completedCount = 0;
    const active: ChecklistItem[] = [];
    const completed: ChecklistItem[] = [];

    for (const item of items) {
      if (item.completed) {
        completedCount++;
        completed.push(item);
      } else {
        activeCount++;
        active.push(item);
      }
    }

    const counts = {
      all: items.length,
      active: activeCount,
      completed: completedCount,
    };

    let filtered: ChecklistItem[];
    switch (activeFilter) {
      case 'active':
        filtered = active;
        break;
      case 'completed':
        filtered = completed;
        break;
      default:
        filtered = items;
    }

    return { filterCounts: counts, displayedItems: filtered };
  }, [items, activeFilter]);

  useImperativeHandle(ref, () => ({
      async handleReorder(filteredFrom: number, filteredTo: number) {
        // Map filtered indices back to original items array indices
        const fromItem = displayedItems[filteredFrom];
        const toItem = displayedItems[filteredTo];

        if (!fromItem) return;

        const originalFromIndex = items.findIndex(item => item.id === fromItem.id);

        // For the "to" index, we need to find where the item should go in the original array
        let originalToIndex: number;
        if (toItem) {
          originalToIndex = items.findIndex(item => item.id === toItem.id);
        } else {
          // Moving to end of filtered list - find last item position in original
          const lastFilteredItem = displayedItems[displayedItems.length - 1];
          originalToIndex = lastFilteredItem
            ? items.findIndex(item => item.id === lastFilteredItem.id)
            : items.length - 1;
        }

        if (originalFromIndex === -1 || originalToIndex === -1) return;

        await reorderItem(originalFromIndex, originalToIndex);
      },
    }), [displayedItems, items, reorderItem]);

  // Calculate completed items count (from available items, not filtered)
  const completedCount = filterCounts.completed;

  const handleAddItem = async (checklistItem: ChecklistItem) => {
    await addItem(checklistItem);
  };

  const handleFormSubmit = async (checklistItemName: string) => {
      const checklistItem: ChecklistItem = {
        completed: false,
        name: checklistItemName,
        id: null,
        orderNumber: null,
        rows: []
      }
     await addItem(checklistItem);
  };

  // Clear completed items
  const handleClearCompleted = async () => {
    const completedItems = displayedItems.filter(item => item.completed);
    if (completedItems.length === 0) return;

    for (const item of completedItems) {
      if (item.id) {
        await deleteItemFn(item.id);
      }
    }
  };

  // Delete with undo functionality - uses soft delete and restore
  const handleDeleteItem = async (itemId: number | null) => {
    if (!itemId) return;

    // Find the item before deleting to get its name for the toast
    const deletingItem = items.find(i => i.id === itemId);
    const itemName = deletingItem?.name ?? '';

    // Fire delete without awaiting to prevent scroll jump
    // The deleteItemFn handles optimistic updates internally
    const resultPromise = deleteItemFn(itemId);

    // Track if undo was already triggered to prevent duplicates
    let undoTriggered = false;
    let dismissToast: (() => void) | null = null;

    const handleUndo = async () => {
      if (undoTriggered) return;
      undoTriggered = true;

      console.log('🔄 Undo clicked, restoring item:', itemId);

      // Dismiss toast immediately
      dismissToast?.();

      // Restore the soft-deleted item
      try {
        await restoreItemFn(itemId);
        console.log('✅ Item restored successfully:', itemId);
      } catch (error) {
        console.error('❌ Failed to restore item:', itemId, error);
      }
    };

    // Show toast with undo action immediately (don't wait for API)
    const { dismiss } = toast({
      title: `🗑️ ${t('detail.itemDeleted')}`,
      description: itemName,
      action: (
        <ToastAction
          altText={t('detail.undo')}
          onTouchEnd={(e) => {
            e.preventDefault();
            (e.target as HTMLElement).blur();
            handleUndo();
          }}
          onClick={(e) => {
            (e.target as HTMLElement).blur();
            handleUndo();
          }}
        >
          {t('detail.undo')}
        </ToastAction>
      ),
    });
    dismissToast = dismiss;

    // Wait for delete to complete in background
    await resultPromise;
  };

  // Show error state if hook failed to load
  if (error) {
    return (
      <Card className="border border-destructive bg-card transition-shadow duration-200 flex flex-col rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <h2 className="text-xl sm:text-2xl font-semibold">{checklist.name}</h2>
        </CardHeader>
        <CardContent className="pt-0 pb-4 sm:pb-6 px-4 sm:px-6 flex-grow">
          <div className="text-center py-8">
            <p className="text-destructive font-medium">{t('main.error')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error.message || t('detail.loadError') || 'Failed to load checklist items'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Clean & minimal card design - Mobile-first */}
      <Card className="border border-border bg-card transition-shadow duration-200 flex flex-col rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <h2 className="text-xl sm:text-2xl font-semibold">{checklist.name}</h2>
          {/* Show "Clear all" only when viewing completed items */}
          {activeFilter === 'completed' && completedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm(t('detail.clearCompletedConfirm', { count: completedCount }) || `Delete ${completedCount} completed items?`)) {
                  handleClearCompleted();
                }
              }}
              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {t('detail.clearAll')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0 pb-4 sm:pb-6 px-4 sm:px-6 flex-grow">
          {/* Add item form */}
          <div className="pb-3 border-b mb-2">
            <AddItemForm onFormSubmit={handleFormSubmit} />
          </div>

          {/* Filter bar - only show if there are items */}
          {items.length > 0 && onFilterChange && (
            <ChecklistFilterBar
              activeFilter={activeFilter}
              onFilterChange={onFilterChange}
              counts={filterCounts}
            />
          )}

          {/* Items list - Swipe on mobile, drag-drop on desktop */}
          <Droppable droppableId={String(checklist.id)} type="items">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={isMobile ? "space-y-2 min-h-[10px] w-full pt-2" : "space-y-2 sm:space-y-3 min-h-[10px] w-full pt-2"}
              >
                {displayedItems.map((item: ChecklistItem, index: number) => (
                  <DraggableChecklistItem
                    key={getItemKey(item)}
                    item={item}
                    index={index}
                    checklistId={checklist.id}
                    isMobile={isMobile}
                    deleteRow={deleteRowFn}
                    updateItem={updateItemFn}
                    addRow={addRowFn}
                    deleteItem={handleDeleteItem}
                    toggleCompletion={toggleCompletion}
                  />
                ))}
                {provided.placeholder}

                {/* Empty state */}
                {displayedItems.length === 0 && (
                  <div className="text-center py-12 px-4">
                    <div className="mb-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <span
                          className="text-4xl"
                          role="img"
                          aria-label={
                            activeFilter === 'completed'
                              ? t('detail.completedIcon')
                              : activeFilter === 'active'
                              ? t('detail.activeIcon')
                              : t('detail.emptyIcon')
                          }
                        >
                          {activeFilter === 'completed' ? '✓' : activeFilter === 'active' ? '○' : '📋'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {activeFilter === 'completed'
                          ? t('detail.noCompletedItems')
                          : activeFilter === 'active'
                          ? t('detail.noActiveItems')
                          : t('detail.emptyListTitle')}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {activeFilter === 'completed'
                          ? t('detail.noCompletedDescription')
                          : activeFilter === 'active'
                          ? t('detail.noActiveDescription')
                          : t('detail.emptyListDescription')}
                      </p>
                    </div>
                    {activeFilter === 'all' && <QuickAddChips onAdd={(itemName) => handleFormSubmit(itemName)} />}
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>
    </>
  );
}
);

ChecklistCard.displayName = 'ChecklistCard';
