"use client";

import useSWR from "swr";
import { useRef, useCallback, useEffect, useMemo } from "react";
import {
  ChecklistItemResponse,
  ChecklistItemRowResponse,
  CreateChecklistItemRequest,
  UpdateChecklistItemRequest,
  ChecklistItemReorderedEventPayload,
  ChecklistItemRowDeletedEventPayload,
  ChecklistItemRowAddedEventPayload
} from "@/api/checklistServiceV1.schemas";
import {
  getAllChecklistItems,
  createChecklistItem,
  deleteChecklistItemById,
  updateChecklistItemBychecklistIdAndItemId,
  changeChecklistItemOrderNumber,
  createChecklistItemRow,
  deleteChecklistItemRow,
  toggleChecklistItemComplete,
} from "@/api/checklist-item/checklist-item";
import { ChecklistItem, ChecklistItemRow } from "@/components/shared/types";
import { useSSE } from './use-checklist-item-updates';
import type { MessageHandlers } from './use-checklist-item-updates';
import { createLogger } from "@/lib/logger";
import { getClientId } from "@/lib/axios";

const logger = createLogger('UseChecklist');
// SSE used for realtime updates

// Duration for SSE highlight animation (matches CSS animation duration)
const SSE_HIGHLIGHT_DURATION = 1500;

const inFlightRequests = new Map<string, Promise<unknown>>();

async function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)! as Promise<T>;
  }
  const promise = fn().finally(() => inFlightRequests.delete(key));
  inFlightRequests.set(key, promise);
  return promise;
}

interface ChecklistHookResult {
  items: ChecklistItem[];
  addItem: (item: ChecklistItem) => Promise<void>;
  updateItem: (item: ChecklistItem) => Promise<void>;
  deleteItem: (itemId: number | null) => Promise<void>;
  reorderItem: (from: number, to: number) => Promise<void>;
  addRow: (itemId: number | null, row: ChecklistItemRow) => Promise<void>;
  deleteRow: (itemId: number | null, rowId: number | null) => Promise<void>;
  toggleCompletion: (itemId: number | null) => Promise<void>;
}

interface ChecklistHookOptions {
  refreshInterval?: number;
}

export function useChecklist(
  checklistId: number,
  options: ChecklistHookOptions = {},
): ChecklistHookResult {
  const { refreshInterval } = options;
  
  // Refs to track items and recent operations to prevent duplicates
  const itemsRef = useRef<ChecklistItem[]>([]);
  const recentlyAddedItemsRef = useRef<Set<number>>(new Set()); // Track recently added item IDs
  const recentlyReorderedItemsRef = useRef<Set<string>>(new Set()); // Track recently reordered items
  const clientIdRef = useRef<string>(''); // Persistent client ID - initialized lazily
  const highlightTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map()); // Track highlight clear timeouts

  // Initialize client ID lazily to avoid SSR issues
  if (typeof window !== 'undefined' && !clientIdRef.current) {
    clientIdRef.current = getClientId();
  }
  
  // Ref to track rapid operations and debounce refetching
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: items = [], mutate: mutateItems } = useSWR<ChecklistItem[]>(
    checklistId ? ["checklist-items", checklistId] : null,
    async () => {
      const res = await dedupeRequest(
        `checklist-items-${checklistId}`,
        () =>
          getAllChecklistItems(
            checklistId!,
            { completed: undefined }
          ),
      );
      return res.map((i: ChecklistItemResponse) => ({
        id: i.id,
        name: i.name,
        completed: i.completed,
        orderNumber: i.orderNumber,
        rows:
          i.rows?.map((r: ChecklistItemRowResponse) => ({
            id: r.id,
            name: r.name,
            completed: r.completed,
          })) ?? null,
      }));
    },
    { refreshInterval },
  );

  // Handlers for checklist items real time updates via SSE
  const scheduleRefetch = useCallback((options: { updatedItems?: Array<ChecklistItem>} = {}) => {
    const { updatedItems: items  } = options;
    logger.debug('scheduleRefetch called with options:', options);

    // Update the UI immediately
    if (items) {
      mutateItems(items, { revalidate: false }); // Update UI immediately
    }

    // Debounced API call
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    refetchTimeoutRef.current = setTimeout(() => {
      console.debug('Calling API after debounce.');
      void (async () => {
        try {
          mutateItems(); // Fetch fresh data from API
        } catch (e) {
          logger.error('Error during API call:', e);
        }
      })();
    }, 1500);
  }, [mutateItems, checklistId]);

  // Clear SSE highlight after animation completes
  const clearSseHighlight = useCallback((itemId: number) => {
    // Clear any existing timeout for this item
    const existingTimeout = highlightTimeoutsRef.current.get(itemId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule clearing the highlight
    const timeout = setTimeout(() => {
      mutateItems((currentItems) => {
        if (!currentItems) return currentItems;
        return currentItems.map(item =>
          item.id === itemId ? { ...item, _sseHighlight: undefined } : item
        );
      }, { revalidate: false });
      highlightTimeoutsRef.current.delete(itemId);
    }, SSE_HIGHLIGHT_DURATION);

    highlightTimeoutsRef.current.set(itemId, timeout);
  }, [mutateItems]);

  // Mark an item as highlighted from SSE and schedule clear
  const markItemHighlighted = useCallback((item: ChecklistItem): ChecklistItem => {
    if (item.id) {
      clearSseHighlight(item.id);
    }
    return { ...item, _sseHighlight: true };
  }, [clearSseHighlight]);

  const handleItemCreatedMessageFromChecklistItemUpdates = (newItem: ChecklistItem)  => {
          const firstCompletedIndex = itemsRef.current.findIndex(item => item.completed);
          const insertIndex = firstCompletedIndex === -1 ? itemsRef.current.length : firstCompletedIndex;
          const highlightedItem = markItemHighlighted(newItem);
          const updatedItems = [
        ...itemsRef.current.slice(0, insertIndex),
        highlightedItem,
        ...itemsRef.current.slice(insertIndex)
          ];
          scheduleRefetch({ updatedItems: updatedItems });
        }

  const handleItemUpdatedMessageFromChecklistItemUpdates = (payload: ChecklistItem)  => {
          const highlightedItem = markItemHighlighted(payload);
          scheduleRefetch({ updatedItems: (itemsRef.current ?? []).map(item => item.id === payload.id ? highlightedItem : item) });
  }
  const handleItemReorderedMessageFromChecklistItemUpdates = (payload: ChecklistItemReorderedEventPayload)  => {
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
  }
  const handleItemDeletedMessageFromChecklistItemUpdates = (payload: { itemId: number })  => {
          const updatedItems = itemsRef.current.filter(item => item.id !== payload.itemId);
          scheduleRefetch({ updatedItems });
  }
  const handleItemRowAddedMessageFromChecklistItemUpdates = (payload: ChecklistItemRowAddedEventPayload)  => {
     const currentItems = itemsRef.current;
      const item = currentItems.find((i) => i.id === payload.itemId);
      if (item) {
        const newRows = [...(item.rows || []), payload.row];
        const updatedItem = markItemHighlighted({ ...item, rows: newRows });
        const newItemsArray = currentItems.map((i) => (i.id === item.id ? updatedItem : i));
        scheduleRefetch({ updatedItems: newItemsArray });
      }
    }
  const handleItemRowDeletedMessageFromChecklistItemUpdates = (data: ChecklistItemRowDeletedEventPayload)  => {
    const currentItems = itemsRef.current;
      const item = currentItems.find((i) => i.id === data.itemId);
      if (item) {
        const newRows = (item.rows || []).filter((r) => r.id !== data.rowId);
        const updatedItem = markItemHighlighted({ ...item, rows: newRows });
        const newItemsArray = currentItems.map((i) => (i.id === item.id ? updatedItem : i));
        scheduleRefetch({ updatedItems: newItemsArray });
      }
    }


  // Keep itemsRef in sync with items
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const handleRealtimeMessageFromSSE: MessageHandlers = {
    itemUpdated: handleItemUpdatedMessageFromChecklistItemUpdates,
    itemCreated: handleItemCreatedMessageFromChecklistItemUpdates,
    itemReordered: handleItemReorderedMessageFromChecklistItemUpdates,
    itemDeleted: handleItemDeletedMessageFromChecklistItemUpdates,
    itemRowAdded: handleItemRowAddedMessageFromChecklistItemUpdates,
    itemRowDeleted: handleItemRowDeletedMessageFromChecklistItemUpdates,
  }

  useSSE(handleRealtimeMessageFromSSE, checklistId, [checklistId]);

  const addItem = async (item: ChecklistItem) => {
    if (!checklistId) return;
    
    try {
      const res = await dedupeRequest(
        `add-item-${checklistId}-${item.name}`,
        () =>
          createChecklistItem(
            checklistId,
            {
              name: item.name,
              rows:
                item.rows?.map((r) => ({
                  name: r.name,
                  completed: r.completed ?? null,
                })) ?? [],
            } as CreateChecklistItemRequest
          ),
      );
      const created = res;
      
      const newItem: ChecklistItem = {
        id: created.id,
        name: created.name,
        completed: created.completed,
        orderNumber: created.orderNumber,
        rows:
          created.rows?.map((r: any) => ({
            id: r.id,
            name: r.name,
            completed: r.completed,
          })) ?? null,
      };
      
      // Insert the new item before the first completed item so it lands
      // at the bottom of incomplete items but at the top of completed ones.
      {
        const current = items ?? [];
        const firstCompletedIndex = current.findIndex((i) => i.completed);
        const insertIndex = firstCompletedIndex === -1 ? current.length : firstCompletedIndex;
        const newItems = [
          ...current.slice(0, insertIndex),
          newItem,
          ...current.slice(insertIndex),
        ];
        mutateItems(newItems, { revalidate: false });
      }
    
      
    } catch (error) {
      logger.error('❌ Failed to add item:', error);
    }
  };

  const updateItem = async (item: ChecklistItem) => {
    if (!checklistId) return;
    mutateItems(items.map((i) => (i.id === item.id ? item : i)), false);
    if (item.id) {
      const req: UpdateChecklistItemRequest = {
        id: item.id ?? 0,
        name: item.name,
        completed: item.completed,
        rows:
          item.rows
            ?.filter((r) => r.id !== null && r.id !== undefined && r.id > 0)
            .map((r) => ({
              id: r.id!,
              name: r.name,
              completed: r.completed ?? null,
            })) ?? [],
      };
      await dedupeRequest(
        `update-item-${checklistId}-${item.id}`,
        () =>
          updateChecklistItemBychecklistIdAndItemId(
            checklistId,
            item.id!,
            req
          ),
      );
  // Use debounced refetch to prevent UI jumping during rapid row toggling
  scheduleRefetch();
    }
  };

  const deleteItem = async (itemId: number | null) => {
    if (!checklistId) return;
    mutateItems(items.filter((i) => i.id !== itemId), false);
    if (itemId) {
      await dedupeRequest(
        `delete-item-${checklistId}-${itemId}`,
        () => deleteChecklistItemById(checklistId, itemId),
      );
  // Debounced refetch to avoid immediate revalidation during rapid UI ops
  scheduleRefetch();
    }
  };

  const reorderItem = async (from: number, to: number) => {
    // Prevent moving completed items before incomplete ones and vice versa
    const movingItem = items[from];
    if (!movingItem) return;

    const firstDoneIndex = items.findIndex((i) => i.completed);
    const doneStartIndex = firstDoneIndex === -1 ? items.length : firstDoneIndex;

    if (!movingItem.completed && to >= doneStartIndex) {
      return;
    }

    if (movingItem.completed && to < doneStartIndex) {
      return;
    }

    const executionFn = async (numberRetries: number) => {
      let retry = false;
      if (!checklistId) return { retry };
      
      // Calculate the correct target order number based on neighbor +/-1 strategy
      // Use previous neighbor + 1 when moving after a previous item, or next neighbor - 1 when moving before next.
      // This keeps integers and avoids midpoint fractions.
      let targetOrderNumber: number;
      if (to === 0) {
        // Moving to first position: take firstItem.orderNumber - 1 or 1
        const firstItem = items[0];
        targetOrderNumber = firstItem && firstItem.orderNumber ? firstItem.orderNumber - 1 : 1;
      } else if (to >= items.length - 1) {
        // Moving to last position: take lastItem.orderNumber + 1
        const lastItem = items[items.length - 1];
        targetOrderNumber = lastItem && lastItem.orderNumber ? lastItem.orderNumber + 1 : items.length + 1;
      } else {
        // Prefer using previous neighbor + 1 to avoid fractional midpoints
        const prevItem = items[to - 1];
        const nextItem = items[to];
        if (prevItem && typeof prevItem.orderNumber === 'number') {
          targetOrderNumber = prevItem.orderNumber + 1;
        } else if (nextItem && typeof nextItem.orderNumber === 'number') {
          targetOrderNumber = nextItem.orderNumber - 1;
        } else {
          targetOrderNumber = to + 1; // Fallback
        }
      }
    
      
      const newList = [...items];
      const [moved] = newList.splice(from, 1);
      newList.splice(to, 0, moved);
      const previousItems = [...items];
      mutateItems(newList, { revalidate: false });
      if (moved?.id) {
        try {
          // Ensure order number is an integer before sending to backend and at least 1
          const sentOrderNumber = Math.max(1, Math.round(targetOrderNumber));

          // Track this reorder operation to prevent WebSocket duplication (use the sent integer)
          const reorderKey = `${moved.id}-${sentOrderNumber}`;
          recentlyReorderedItemsRef.current.add(reorderKey);
          if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
            // eslint-disable-next-line no-console
            console.debug('🔄 Reordering item locally:', moved.id, 'to order:', sentOrderNumber, 'clientId:', clientIdRef.current);
          }

          await dedupeRequest(
            `reorder-item-${checklistId}-${moved.id}-${sentOrderNumber}`,
            () =>
              changeChecklistItemOrderNumber(
                checklistId,
                moved.id!,
                { newOrderNumber: sentOrderNumber }
              ),
          );

          // Clean up the tracking after 5 seconds
          setTimeout(() => {
            recentlyReorderedItemsRef.current.delete(reorderKey);
            if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
              // eslint-disable-next-line no-console
              console.debug('🧹 Cleaned up recently reordered item:', reorderKey);
            }
          }, 5000);
          
        } catch (e) {
          mutateItems(previousItems, { revalidate: false });
          if (numberRetries === 1) retry = true;
        }
      }
      return { retry };
    };

    const res = await executionFn(0);
    if (res.retry) {
      await executionFn(1);
    }
  };

  const addRow = async (itemId: number | null, row: ChecklistItemRow) => {
    if (!checklistId) return;
    
    // Generate temporary ID for better optimistic update rendering
    const tempId = -Date.now() - Math.random() * 1000; // Negative ID to distinguish from real IDs
    const optimisticRow = { ...row, id: tempId };
    
    mutateItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: false, // Adding a sub-item marks parent as incomplete
              rows: [...(item.rows ?? []), optimisticRow],
            }
          : item,
      ),
      false,
    );
    
    if (itemId) {
      const requests: Promise<unknown>[] = [];
      const checklistItem = items.find((item) => item.id === itemId);
      const addRowFn = dedupeRequest(
        `add-row-${checklistId}-${itemId}-${row.name}`,
        () =>
          createChecklistItemRow(
            checklistId,
            itemId,
            { name: row.name, completed: row.completed ?? null } as Omit<
              ChecklistItemRowResponse,
              "id"
            >
          ),
      );
      requests.push(addRowFn);
      if (checklistItem && checklistItem.completed) {
        requests.push(
          updateItem({
            ...checklistItem,
            completed: false,
          }),
        );
      }
      await Promise.all(requests);
  // Debounced refetch to pick up authoritative server state
  scheduleRefetch();
    }
  };

  const deleteRow = async (itemId: number | null, rowId: number | null) => {
    if (!checklistId) return;
    
    // Find the item to update
    const targetItem = items.find((item) => item.id === itemId);
    if (!targetItem) return;
    
    // Calculate remaining rows after deletion
    const remainingRows = targetItem.rows?.filter((row) => row.id !== rowId) ?? [];
    
    // Check if all remaining rows are completed
    const allRemainingRowsCompleted = remainingRows.length > 0 && remainingRows.every((row) => row.completed);
    
    mutateItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              rows: remainingRows,
              // Auto-complete parent item if all remaining sub-items are completed
              completed: allRemainingRowsCompleted ? true : item.completed,
            }
          : item,
      ),
      false,
    );
    if (itemId && rowId) {
      await dedupeRequest(
        `delete-row-${checklistId}-${itemId}-${rowId}`,
        () => deleteChecklistItemRow(checklistId, itemId, rowId),
      );
  // Debounced refetch after delete-row
  scheduleRefetch();
    }
  };

  const toggleCompletion = async (itemId: number | null) => {
    if (!checklistId || !itemId) return;
    
    // Optimistic update
    const currentItem = itemsRef.current.find((item) => item.id === itemId);
    if (!currentItem) return;
    
    const newCompletedStatus = !currentItem.completed;
    const updatedItem = { ...currentItem, completed: newCompletedStatus };
    
    // Keep items in their current order for optimistic update
    // This prevents jumping during rapid clicking
    mutateItems(
      items.map((item) => (item.id === itemId ? updatedItem : item)),
      false,
    );
    
    try {
      await dedupeRequest(
        `toggle-completion-${checklistId}-${itemId}`,
        () => toggleChecklistItemComplete(checklistId, itemId, { completed: newCompletedStatus }),
      );
      
  // Use debounced refetch to prevent UI jumping during rapid operations
  // Only update completed field, do not move items
  scheduleRefetch({ updatedItems: items.map((item) => item.id === itemId ? updatedItem : item) });

    } catch (error) {
      // Revert optimistic update on error
      mutateItems(
        items.map((item) => (item.id === itemId ? currentItem : item)),
        false,
      );
      throw error;
    }
  };


  return {
    items,
    addItem,
    updateItem,
    deleteItem,
    reorderItem,
    addRow,
    deleteRow,
    toggleCompletion,
  };
}

