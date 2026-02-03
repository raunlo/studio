"use client";

import useSWR from "swr";
import { useRef, useCallback, useEffect } from "react";
import {
  ChecklistItemResponse,
  ChecklistItemRowResponse,
  CreateChecklistItemRequest,
  UpdateChecklistItemRequest,
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
  restoreChecklistItem,
} from "@/api/checklist-item/checklist-item";
import { ChecklistItem, ChecklistItemRow } from "@/components/shared/types";
import { useSSE } from './use-checklist-item-updates';
import { createLogger } from "@/lib/logger";
import { toast } from "@/hooks/use-toast";
import { useChecklistTracking } from "./use-checklist-tracking";
import { createSSEHandlers } from "./use-checklist-sse-handlers";

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
  isLoading: boolean;
  error: Error | null;
  addItem: (item: ChecklistItem) => Promise<void>;
  updateItem: (item: ChecklistItem) => Promise<void>;
  deleteItem: (itemId: number | null) => Promise<{ deletedItemId: number; deletedItemName: string } | null>;
  restoreItem: (itemId: number) => Promise<void>;
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

  // Use extracted tracking hook for refs and cleanup
  const {
    recentlyAddedItemsRef,
    recentlyReorderedItemsRef,
    recentlyDeletedItemsRef,
    recentlyToggledItemsRef,
    highlightTimeoutsRef,
    cleanupTimeoutsRef,
    refetchTimeoutRef,
    clientIdRef,
    createTrackedTimeout,
  } = useChecklistTracking();

  // Ref to track items for SSE handlers
  const itemsRef = useRef<ChecklistItem[]>([]);

  const { data: items = [], mutate: mutateItems, isLoading, error } = useSWR<ChecklistItem[]>(
    checklistId ? ["checklist-items", checklistId] : null,
    async ([, ], options?: { previousData?: ChecklistItem[] }) => {
      const previousData = options?.previousData;
      const res = await dedupeRequest(
        `checklist-items-${checklistId}`,
        () =>
          getAllChecklistItems(
            checklistId!,
            { completed: undefined }
          ),
      );
      const mappedItems: ChecklistItem[] = res.map((i: ChecklistItemResponse) => ({
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
      // Filter out recently deleted items to prevent flickering
      let finalItems: ChecklistItem[] = mappedItems.filter((item) =>
        item.id === null || !recentlyDeletedItemsRef.current.has(item.id)
      );

      // Preserve pending items that haven't been synced yet
      if (previousData) {
        const pendingItems = previousData.filter(
          (item) => item.id !== null && recentlyAddedItemsRef.current.has(item.id)
        );
        // Add pending items that aren't in the server response yet (at the front)
        for (const pendingItem of pendingItems) {
          const existsInServer = finalItems.some(i => i.id === pendingItem.id || i.name === pendingItem.name);
          if (!existsInServer) {
            finalItems = [pendingItem, ...finalItems];
          }
        }
      }
      return finalItems;
    },
    { refreshInterval },
  );

  // Helper to filter out recently deleted items from any list
  const filterDeletedItems = useCallback((itemList: ChecklistItem[]): ChecklistItem[] => {
    return itemList.filter(item =>
      item.id === null || !recentlyDeletedItemsRef.current.has(item.id)
    );
  }, []);

  // Handlers for checklist items real time updates via SSE
  const scheduleRefetch = useCallback((options: { updatedItems?: Array<ChecklistItem>} = {}) => {
    const { updatedItems: items  } = options;
    logger.debug('scheduleRefetch called with options:', options);

    // Update the UI immediately, always filtering out recently deleted items
    if (items) {
      const filtered = filterDeletedItems(items);
      mutateItems(filtered, { revalidate: false });
    }

    // Debounced API call
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    refetchTimeoutRef.current = setTimeout(() => {
      mutateItems();
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

  // Keep itemsRef in sync with items
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Refresh data when page becomes visible again (e.g., after phone unlock)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        logger.debug('Page became visible, refreshing data');
        mutateItems();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mutateItems]);

  // Create SSE handlers using the factory (cleanup is handled by useChecklistTracking)
  const sseHandlers = createSSEHandlers({
    itemsRef,
    recentlyDeletedItemsRef,
    recentlyAddedItemsRef,
    recentlyToggledItemsRef,
    scheduleRefetch,
    markItemHighlighted,
  });

  useSSE(sseHandlers, checklistId, [checklistId]);

  const addItem = async (item: ChecklistItem) => {
    if (!checklistId) return;

    const tempId = -Date.now();

    const optimisticItem: ChecklistItem = {
      ...item,
      id: tempId,
      orderNumber: (items.length + 1),
      _isPending: true,
      _originalTempId: tempId,
    };

    recentlyAddedItemsRef.current.add(tempId);

    // Optimistic update - insert at the front
    const current = itemsRef.current ?? [];
    mutateItems([optimisticItem, ...current], { revalidate: false });

    try {
      const res = await dedupeRequest(
        `add-item-${checklistId}-${item.name}-${Date.now()}`,
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
          created.rows?.map((r: ChecklistItemRowResponse) => ({
            id: r.id,
            name: r.name,
            completed: r.completed,
          })) ?? null,
        _originalTempId: tempId, // Preserve temp ID for stable React key
      };

      // Remove temp tracking and add real ID tracking
      recentlyAddedItemsRef.current.delete(tempId);
      recentlyAddedItemsRef.current.add(created.id);

      // Update temp item with real data
      mutateItems(
        (currentItems) => {
          if (!currentItems) return [newItem];
          return currentItems.map(item =>
            item.id === tempId
              ? { ...item, ...newItem, _originalTempId: item._originalTempId || tempId, _isPending: false }
              : item
          );
        },
        { revalidate: false }
      );

      // Clean up tracking after a longer delay
      createTrackedTimeout(() => {
        recentlyAddedItemsRef.current.delete(created.id);
      }, 15000);

    } catch (error) {
      logger.error('❌ Failed to add item:', error);
      // Remove optimistic item on error
      recentlyAddedItemsRef.current.delete(tempId);
      mutateItems(
        (currentItems) => {
          const result = currentItems?.filter(i => i.id !== tempId) ?? [];
          itemsRef.current = result;
          return result;
        },
        { revalidate: false }
      );
      // Show error toast
      toast({
        title: "Failed to add item",
        description: "Please try again",
        variant: "destructive",
      });
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

  const deleteItem = async (itemId: number | null): Promise<{ deletedItemId: number; deletedItemName: string } | null> => {
    if (!checklistId || !itemId) return null;

    // Get the item info before deleting (for undo functionality)
    const deletedItem = itemsRef.current.find(item => item.id === itemId);
    if (!deletedItem) return null;

    // Track deleted item to prevent flickering on revalidation
    recentlyDeletedItemsRef.current.add(itemId);

    // Optimistic update - remove from UI immediately
    mutateItems(filterDeletedItems(items));

    // Fire API call without waiting (parallel execution)
    dedupeRequest(
      `delete-item-${checklistId}-${itemId}`,
      () => deleteChecklistItemById(checklistId, itemId),
    ).then(() => {
      // Clean up tracking after 30 seconds (longer to allow time for undo)
      createTrackedTimeout(() => {
        recentlyDeletedItemsRef.current.delete(itemId);
      }, 30000);
    }).catch((error) => {
      logger.error('Failed to delete item:', error);
      // On error, remove from deleted tracking so it can reappear
      recentlyDeletedItemsRef.current.delete(itemId);
      // Refetch to restore state
      mutateItems();
      // Show error toast
      toast({
        title: "Failed to delete item",
        description: "The item has been restored",
        variant: "destructive",
      });
    });

    // Return deleted item info for undo toast
    return {
      deletedItemId: itemId,
      deletedItemName: deletedItem.name,
    };
  };

  const restoreItem = async (itemId: number) => {
    if (!checklistId) return;

    logger.debug('🔄 restoreItem called:', { checklistId, itemId });

    // Remove from recently deleted tracking immediately
    recentlyDeletedItemsRef.current.delete(itemId);

    try {
      logger.debug('📡 Calling restoreChecklistItem API...');
      const res = await dedupeRequest(
        `restore-item-${checklistId}-${itemId}`,
        () => restoreChecklistItem(checklistId, itemId),
      );
      logger.debug('✅ restoreChecklistItem API returned:', res);

      const restoredItem: ChecklistItem = {
        id: res.id,
        name: res.name,
        completed: res.completed,
        orderNumber: res.orderNumber,
        rows: res.rows?.map((r: ChecklistItemRowResponse) => ({
          id: r.id,
          name: r.name,
          completed: r.completed,
        })) ?? null,
      };

      // Add restored item back to the list with highlight
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
      
      mutateItems(updatedItems, { revalidate: false });
      
      // Schedule a refetch to ensure consistency
      scheduleRefetch();
    } catch (error) {
      logger.error('Failed to restore item:', error);
      // Refetch to get the current state
      mutateItems();
      // Show error toast
      toast({
        title: "Failed to restore item",
        description: "Please try again",
        variant: "destructive",
      });
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
          createTrackedTimeout(() => {
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
              rows: [optimisticRow, ...(item.rows ?? [])], // Insert at front
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

    // Track this item as recently toggled to prevent SSE from reverting optimistic update
    recentlyToggledItemsRef.current.add(itemId);

    // Keep items in their current order for optimistic update
    // This prevents jumping during rapid clicking
    const updatedItems = items.map((item) => (item.id === itemId ? updatedItem : item));
    mutateItems(updatedItems, false);
    // Update itemsRef immediately so subsequent clicks see the new state
    // (useEffect would be too slow for rapid clicking)
    itemsRef.current = updatedItems;

    try {
      await dedupeRequest(
        `toggle-completion-${checklistId}-${itemId}-${newCompletedStatus}`,
        () => toggleChecklistItemComplete(checklistId, itemId, { completed: newCompletedStatus }),
      );

      // Remove from recently toggled after a delay (allow SSE to settle)
      createTrackedTimeout(() => {
        recentlyToggledItemsRef.current.delete(itemId);
      }, 2000);

      // Use debounced refetch to prevent UI jumping during rapid operations
      // Only update completed field, do not move items
      scheduleRefetch({ updatedItems: items.map((item) => item.id === itemId ? updatedItem : item) });

    } catch (error) {
      // Revert optimistic update on error
      recentlyToggledItemsRef.current.delete(itemId);
      const revertedItems = items.map((item) => (item.id === itemId ? currentItem : item));
      mutateItems(revertedItems, false);
      itemsRef.current = revertedItems;
      // Show error toast
      toast({
        title: "Failed to update item",
        description: "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };


  return {
    items,
    isLoading,
    error: error ?? null,
    addItem,
    updateItem,
    deleteItem,
    restoreItem,
    reorderItem,
    addRow,
    deleteRow,
    toggleCompletion,
  };
}

