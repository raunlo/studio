
"use client";

import {cn} from "@/lib/utils"
import { forwardRef, useImperativeHandle, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { ChecklistItemComponent } from "@/components/checklist-item";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { AddItemForm } from "@/components/add-item-form";
import { ChecklistResponse } from "@/api/checklistServiceV1.schemas";
import { ChecklistCardHandle, ChecklistItem } from "@/components/shared/types";
import { useChecklist } from "@/hooks/use-checklist";
import { SwipeableItem } from "@/components/checklist-item-swipeable";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { QuickAddChips } from "@/components/quick-add-chips";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useTranslation } from 'react-i18next';

type ChecklistCardProps = {
  checklist: ChecklistResponse;
};

export const ChecklistCard = forwardRef<ChecklistCardHandle, ChecklistCardProps>(
  ({ checklist }, ref): JSX.Element => {
  const { t } = useTranslation();
  const {
    items,
    addItem,
    reorderItem,
    deleteRow: deleteRowFn,
    updateItem: updateItemFn,
    addRow: addRowFn,
    deleteItem: deleteItemFn,
    toggleCompletion
   } = useChecklist(checklist.id, { refreshInterval: 10000 });

  // Track items pending deletion (for undo functionality)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(new Set());
  const deleteTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Mobile detection for swipe gestures
  const isMobile = useIsMobile();

  // Filter out items pending deletion from display
  const displayedItems = useMemo(() =>
    items.filter(item => item.id === null || !pendingDeleteIds.has(item.id))
  , [items, pendingDeleteIds]);

  useImperativeHandle(ref, () => ({
      async handleReorder(from, to) {
        await reorderItem(from, to);
      },
    }));

  // Calculate completed items count (from displayed items)
  const completedCount = useMemo(() =>
    displayedItems.filter(item => item.completed).length
  , [displayedItems]);

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

  // Delete with undo functionality
  const handleDeleteItem = async (itemId: number | null) => {
    if (!itemId) return;

    // Find the item to save for undo
    const deletedItem = items.find(i => i.id === itemId);
    if (!deletedItem) return;

    // Cancel any existing timeout for this item
    const existingTimeout = deleteTimeoutsRef.current.get(itemId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      deleteTimeoutsRef.current.delete(itemId);
    }

    // Add to pending deletes (hides from UI immediately)
    setPendingDeleteIds(prev => new Set(prev).add(itemId));

    // Show toast with undo action
    toast({
      title: `🗑️ ${t('detail.itemDeleted')}`,
      description: deletedItem.name,
      action: (
        <ToastAction
          altText={t('detail.undo')}
          onClick={() => {
            // Cancel the scheduled deletion
            const timeout = deleteTimeoutsRef.current.get(itemId);
            if (timeout) {
              clearTimeout(timeout);
              deleteTimeoutsRef.current.delete(itemId);
            }
            // Restore item to UI by removing from pending deletes
            setPendingDeleteIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(itemId);
              return newSet;
            });
          }}
        >
          {t('detail.undo')}
        </ToastAction>
      ),
    });

    // Schedule actual deletion after toast duration
    const timeout = setTimeout(async () => {
      // Remove from pending deletes
      setPendingDeleteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      // Actually delete from backend
      await deleteItemFn(itemId);
      // Clean up timeout ref
      deleteTimeoutsRef.current.delete(itemId);
    }, 5000); // Default toast duration is 5 seconds

    // Store timeout ref
    deleteTimeoutsRef.current.set(itemId, timeout);
  };

  return (
    <>
      {/* Clean & minimal card design - Mobile-first */}
      <Card className="border border-border bg-card transition-shadow duration-200 flex flex-col rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <h2 className="text-xl sm:text-2xl font-semibold">{checklist.name}</h2>
        </CardHeader>
        <CardContent className="pt-0 pb-4 sm:pb-6 px-4 sm:px-6 flex-grow">
          {/* Add item form - sticky at top */}
          <div className="pb-4 border-b mb-4">
            <AddItemForm onFormSubmit={handleFormSubmit} />
          </div>

          {/* Clear completed button - only show when there are completed items */}
          {completedCount > 0 && (
            <div className="py-3 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCompleted}
                className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto"
              >
                <Trash2 className="w-3 h-3 mr-1.5" />
                {t('detail.clearCompleted')} ({completedCount})
              </Button>
            </div>
          )}

          {/* Items list - Swipe on mobile, drag-drop on desktop */}
          {!isMobile ? (
            <Droppable droppableId={String(checklist.id)} type="items">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3 sm:space-y-4 min-h-[10px] w-full pt-4"
                >
                  {displayedItems.map((item: ChecklistItem, index: number) => (
                    <Draggable
                      key={item.id ? `checklistItem-${item.id}` :`checklistItem-temp-${index}`}
                      draggableId={item.id ? String(item.id) : `temp-${index}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "w-full rounded-lg border border-border p-3 sm:p-4 bg-card transition-all duration-200",
                            snapshot.isDragging && "shadow-lg scale-105 opacity-90"
                          )}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <div
                              className="flex items-center w-full"
                              {...provided.dragHandleProps}
                            >
                              <ChecklistItemComponent
                                item={item}
                                checklistId={checklist.id}
                                deleteRow={deleteRowFn}
                                updateItem={updateItemFn}
                                addRow={addRowFn}
                                deleteItem={handleDeleteItem}
                                toggleCompletion={toggleCompletion}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  {/* Empty states */}
                  {displayedItems.length === 0 && (
                    <div className="text-center py-12 px-4">
                      <div className="mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-4xl">📋</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('detail.emptyListTitle')}</h3>
                        <p className="text-sm text-gray-600 mb-6">{t('detail.emptyListDescription')}</p>
                      </div>
                      <QuickAddChips onAdd={(itemName) => handleFormSubmit(itemName)} />
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          ) : (
            <div className="space-y-3 sm:space-y-4 min-h-[10px] w-full pt-4">
              {displayedItems.map((item: ChecklistItem, index: number) => (
                <SwipeableItem
                  key={item.id ? `checklistItem-${item.id}` :`checklistItem-temp-${index}`}
                  onSwipeComplete={() => toggleCompletion(item.id)}
                  onSwipeDelete={() => handleDeleteItem(item.id)}
                  isCompleted={item.completed}
                >
                  <div className="w-full border border-border p-3 bg-card">
                    <ChecklistItemComponent
                      item={item}
                      checklistId={checklist.id}
                      deleteRow={deleteRowFn}
                      updateItem={updateItemFn}
                      addRow={addRowFn}
                      deleteItem={handleDeleteItem}
                      toggleCompletion={toggleCompletion}
                    />
                  </div>
                </SwipeableItem>
              ))}

              {/* Empty state */}
              {displayedItems.length === 0 && (
                <div className="text-center py-12 px-4">
                  <div className="mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-4xl">📋</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('detail.emptyListTitle')}</h3>
                    <p className="text-sm text-gray-600 mb-6">{t('detail.emptyListDescription')}</p>
                  </div>
                  <QuickAddChips onAdd={(itemName) => handleFormSubmit(itemName)} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
);
