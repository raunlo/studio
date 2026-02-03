"use client";

import {
  ChecklistItemResponse,
  ChecklistItemRowResponse,
  ChecklistItemReorderedEventPayload,
  ChecklistItemRowDeletedEventPayload,
  ChecklistItemRowAddedEventPayload,
  ChecklistItemSoftDeletedEventPayload,
  ChecklistItemRestoredEventPayload,
} from "@/api/checklistServiceV1.schemas";
import { ChecklistItem } from "@/components/shared/types";
import type { MessageHandlers } from './use-checklist-item-updates';

export type SSEHandlerDependencies = {
  itemsRef: React.MutableRefObject<ChecklistItem[]>;
  recentlyDeletedItemsRef: React.MutableRefObject<Set<number>>;
  recentlyAddedItemsRef: React.MutableRefObject<Set<number>>;
  recentlyToggledItemsRef: React.MutableRefObject<Set<number>>;
  scheduleRefetch: (options?: { updatedItems?: ChecklistItem[] }) => void;
  markItemHighlighted: (item: ChecklistItem) => ChecklistItem;
};

/**
 * Creates SSE message handlers for checklist item updates.
 * These are pure functions that depend on injected refs and callbacks.
 */
export function createSSEHandlers(deps: SSEHandlerDependencies): MessageHandlers {
  const {
    itemsRef,
    recentlyDeletedItemsRef,
    recentlyAddedItemsRef,
    recentlyToggledItemsRef,
    scheduleRefetch,
    markItemHighlighted,
  } = deps;

  const handleItemCreated = (newItem: ChecklistItem) => {
    // Don't add if it's in the recently deleted list
    if (newItem.id && recentlyDeletedItemsRef.current.has(newItem.id)) {
      return;
    }
    // Don't add if it's in the recently added list (we already have it via optimistic update)
    if (newItem.id && recentlyAddedItemsRef.current.has(newItem.id)) {
      return;
    }
    // Don't add if item already exists (by ID or by name for pending items)
    const alreadyExists = itemsRef.current.some(
      item => item.id === newItem.id || (item._isPending && item.name === newItem.name)
    );
    if (alreadyExists) {
      return;
    }
    const highlightedItem = markItemHighlighted(newItem);
    // Insert new items at the front
    const updatedItems = [highlightedItem, ...itemsRef.current];
    scheduleRefetch({ updatedItems });
  };

  const handleItemUpdated = (payload: ChecklistItem) => {
    // Don't update if it's in the recently deleted list
    if (payload.id && recentlyDeletedItemsRef.current.has(payload.id)) {
      return;
    }
    // Don't update if we recently toggled this item (prevents SSE from reverting optimistic update)
    if (payload.id && recentlyToggledItemsRef.current.has(payload.id)) {
      return;
    }
    const highlightedItem = markItemHighlighted(payload);
    scheduleRefetch({
      updatedItems: (itemsRef.current ?? []).map(item =>
        item.id === payload.id ? highlightedItem : item
      ),
    });
  };

  const handleItemReordered = (payload: ChecklistItemReorderedEventPayload) => {
    const itemId = payload.itemId;
    const newOrderNumber = payload.newOrderNumber;

    // Copy current items
    const itemsCopy = [...(itemsRef.current ?? [])];
    const movedIndex = itemsCopy.findIndex(item => item.id === itemId);
    if (movedIndex === -1) return;

    // Remove the moved item
    const [movedItem] = itemsCopy.splice(movedIndex, 1);

    // Find the target index for the new order number
    let targetIndex = itemsCopy.findIndex(item => item.orderNumber === newOrderNumber);

    // If not found, put at the end
    if (targetIndex === -1) {
      targetIndex = itemsCopy.length;
    }

    // Insert the moved item at the target index with highlight
    const highlightedItem = markItemHighlighted({ ...movedItem, orderNumber: newOrderNumber });
    itemsCopy.splice(targetIndex, 0, highlightedItem);

    // Reassign orderNumbers to ensure correct sequence
    const sortedItems = itemsCopy.map((item, idx) => ({
      ...item,
      orderNumber: idx + 1,
    }));

    scheduleRefetch({ updatedItems: sortedItems });
  };

  const handleItemDeleted = (payload: { itemId: number }) => {
    const updatedItems = itemsRef.current.filter(item => item.id !== payload.itemId);
    scheduleRefetch({ updatedItems });
  };

  const handleItemRowAdded = (payload: ChecklistItemRowAddedEventPayload) => {
    const currentItems = itemsRef.current;
    const item = currentItems.find((i) => i.id === payload.itemId);
    if (item) {
      // Insert new rows at the front
      const newRows = [payload.row, ...(item.rows || [])];
      const updatedItem = markItemHighlighted({ ...item, rows: newRows });
      const newItemsArray = currentItems.map((i) => (i.id === item.id ? updatedItem : i));
      scheduleRefetch({ updatedItems: newItemsArray });
    }
  };

  const handleItemRowDeleted = (data: ChecklistItemRowDeletedEventPayload) => {
    const currentItems = itemsRef.current;
    const item = currentItems.find((i) => i.id === data.itemId);
    if (item) {
      const newRows = (item.rows || []).filter((r) => r.id !== data.rowId);
      const updatedItem = markItemHighlighted({ ...item, rows: newRows });
      const newItemsArray = currentItems.map((i) => (i.id === item.id ? updatedItem : i));
      scheduleRefetch({ updatedItems: newItemsArray });
    }
  };

  const handleItemSoftDeleted = (payload: ChecklistItemSoftDeletedEventPayload) => {
    // Soft delete from another client - remove from UI (they can restore on their end)
    const updatedItems = itemsRef.current.filter(item => item.id !== payload.itemId);
    scheduleRefetch({ updatedItems });
  };

  const handleItemRestored = (payload: ChecklistItemRestoredEventPayload) => {
    // Item restored from another client - add back to UI
    const existingItem = itemsRef.current.find(item => item.id === payload.item.id);
    if (existingItem) {
      // Item already exists, just update it
      return;
    }

    const restoredItem: ChecklistItem = {
      id: payload.item.id,
      name: payload.item.name,
      completed: payload.item.completed,
      orderNumber: payload.item.orderNumber,
      rows: payload.item.rows?.map((r: ChecklistItemRowResponse) => ({
        id: r.id,
        name: r.name,
        completed: r.completed,
      })) ?? null,
    };

    const highlightedItem = markItemHighlighted(restoredItem);
    // Insert at correct position based on completed status and orderNumber
    // (matches server ORDER BY: COMPLETED ASC, POSITION ASC)
    const updatedItems = [...itemsRef.current, highlightedItem].sort((a, b) => {
      // First sort by completed status (incomplete first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Then by orderNumber
      return (a.orderNumber ?? 0) - (b.orderNumber ?? 0);
    });
    scheduleRefetch({ updatedItems });
  };

  return {
    itemCreated: handleItemCreated,
    itemUpdated: handleItemUpdated,
    itemReordered: handleItemReordered,
    itemDeleted: handleItemDeleted,
    itemRowAdded: handleItemRowAdded,
    itemRowDeleted: handleItemRowDeleted,
    itemSoftDeleted: handleItemSoftDeleted,
    itemRestored: handleItemRestored,
  };
}
