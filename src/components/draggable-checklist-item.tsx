"use client";

import { cn } from "@/lib/utils";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { ChecklistItemComponent } from "@/components/checklist-item";
import { SwipeableItem } from "@/components/checklist-item-swipeable";
import { ChecklistItem, ChecklistItemRow } from "@/components/shared/types";

type DraggableChecklistItemProps = {
  item: ChecklistItem;
  index: number;
  checklistId: number;
  isMobile: boolean;
  deleteRow: (itemId: number | null, rowId: number | null) => Promise<void>;
  updateItem: (item: ChecklistItem) => Promise<void>;
  addRow: (itemId: number | null, row: ChecklistItemRow) => Promise<void>;
  deleteItem: (itemId: number | null) => Promise<void>;
  toggleCompletion: (itemId: number | null) => Promise<void>;
};

/**
 * Generate a stable key for checklist items.
 * Uses _originalTempId for items that transitioned from temp to real ID.
 */
export function getItemKey(item: ChecklistItem): string {
  return item._originalTempId
    ? `temp-${Math.abs(item._originalTempId)}`
    : `item-${item.id}`;
}

/**
 * Generate a draggable ID for the item.
 */
export function getDraggableId(item: ChecklistItem, index: number): string {
  return item.id ? String(item.id) : `temp-${item.name}-${index}`;
}

export function DraggableChecklistItem({
  item,
  index,
  checklistId,
  isMobile,
  deleteRow,
  updateItem,
  addRow,
  deleteItem,
  toggleCompletion,
}: DraggableChecklistItemProps) {
  const itemKey = getItemKey(item);
  const draggableId = getDraggableId(item, index);

  return (
    <Draggable key={itemKey} draggableId={draggableId} index={index}>
      {(provided, snapshot) =>
        isMobile ? (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={cn(
              "flex items-stretch bg-card rounded-lg border border-border overflow-hidden",
              snapshot.isDragging && "shadow-lg opacity-90 z-50"
            )}
          >
            {/* Drag handle - visible on mobile */}
            <div
              {...provided.dragHandleProps}
              className="flex items-center justify-center w-6 shrink-0 bg-muted/20 touch-none active:bg-muted/40"
            >
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
            </div>
            {/* Swipeable content */}
            <SwipeableItem
              onSwipeComplete={() => toggleCompletion(item.id)}
              onSwipeDelete={() => deleteItem(item.id)}
              isCompleted={item.completed}
            >
              <div className="w-full py-2.5 px-2">
                <ChecklistItemComponent
                  item={item}
                  checklistId={checklistId}
                  deleteRow={deleteRow}
                  updateItem={updateItem}
                  addRow={addRow}
                  deleteItem={deleteItem}
                  toggleCompletion={toggleCompletion}
                />
              </div>
            </SwipeableItem>
          </div>
        ) : (
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
                  checklistId={checklistId}
                  deleteRow={deleteRow}
                  updateItem={updateItem}
                  addRow={addRow}
                  deleteItem={deleteItem}
                  toggleCompletion={toggleCompletion}
                />
              </div>
            </div>
          </div>
        )
      }
    </Draggable>
  );
}

DraggableChecklistItem.displayName = 'DraggableChecklistItem';
