"use client";

import useSWR from "swr";
import { useRef, useCallback, useEffect, useMemo } from "react";
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
} from "@/api/checklist-item/checklist-item";
import { ChecklistItem, ChecklistItemRow } from "@/components/shared/types";
import { useSSE } from './use-sse';
import type { SseEvent } from './use-sse';
// SSE used for realtime updates

const inFlightRequests = new Map<string, Promise<any>>();

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
  const clientIdRef = useRef<string>(Math.random().toString(36).substring(2, 15)); // Unique client ID
  
  // Ref to track rapid operations and debounce refetching
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRapidOperationRef = useRef(false);

  

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
          i.rows?.map((r: any) => ({
            id: r.id,
            name: r.name,
            completed: r.completed,
          })) ?? null,
      }));
    },
    { refreshInterval },
  );

  // Debounced refetch function. Use this from UI operations and realtime events
  // to avoid double/immediate refetches during rapid changes.
  // scheduleRefetch({ immediate, completionOnly })
  // - immediate: perform refetch immediately instead of debouncing
  // - completionOnly: only update completed field, not order
  // Add debug logs to scheduleRefetch to verify completionOnly behavior
  const scheduleRefetch = useCallback((options: { items?: Array<ChecklistItem>} = {}) => {
    const { items  } = options;
    console.debug('scheduleRefetch called with options:', options);

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
          console.error('Error during API call:', e);
        }
      })();
    }, 1500);
  }, [mutateItems, checklistId]);

  const triggerRefetch = useCallback(() => {
    console.debug('Triggering immediate refetch.');
    void (async () => {
      try {
        console.debug('Performing immediate refetch.');
        mutateItems();
      } catch (e) {
        console.error('Error during immediate refetch:', e);
      }
    })();
  }, [mutateItems]);

  // Keep itemsRef in sync with items
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);


  // Consolidated realtime handler (SSE target): accepts both legacy and new event names.
  const handleRealtimeMessage = useCallback((message: { type: string; payload: any; checklistId?: number }) => {
    // Only handle messages for this specific checklist
    if (message.checklistId && message.checklistId !== checklistId) return;

    console.log('Handling realtime message:', message);

    // Normalize event names: allow backend to send either 'itemCreated' or 'checklist_item_created'
    let t = message.type;
    if (t === 'itemCreated') t = 'checklist_item_created';
    if (t === 'itemUpdated') t = 'checklist_item_updated';
    if (t === 'itemDeleted') t = 'checklist_item_deleted';
    if (t === 'itemReordered') t = 'checklist_item_order_changed';
    if (t === 'itemToggled') t = 'checklist_item_toggled';

    const currentItems = itemsRef.current;

    switch (t) {
    case 'checklist_item_created':
      if (message.payload) {
        const itemId = message.payload.id || message.payload.Id;
        const itemName = message.payload.name || message.payload.Name;
        if (!itemId) return;
        if (recentlyAddedItemsRef.current.has(itemId)) return;
        const exists = currentItems.find(item => item.id === itemId);
        if (exists) return;

        const newItem: ChecklistItem = {
          id: itemId,
          name: itemName,
          completed: message.payload.completed ?? message.payload.Completed ?? false,
          orderNumber: message.payload.orderNumber || message.payload.OrderNumber || 0,
          rows: (message.payload.rows || message.payload.Rows)?.map((r: any) => ({
            id: r.id || r.Id,
            name: r.name || r.Name,
            completed: r.completed ?? r.Completed ?? false,
          })) ?? null,
        };
        mutateItems([...(currentItems ?? []), newItem], { revalidate: false });
      }
      break;

        case 'checklist_item_updated':
      // Debounced revalidation to avoid jitter when updates come from UI + SSE
      // write code to update items with new updated item
      if (message.payload) {
        const itemId = message.payload.id || message.payload.Id;
        const itemName = message.payload.name || message.payload.Name;
        if (!itemId) return;

        const updatedItem: ChecklistItem = {
          id: itemId,
          name: itemName,
          completed: message.payload.completed ?? message.payload.Completed ?? false,
          orderNumber: message.payload.orderNumber || message.payload.OrderNumber || 0,
          rows: (message.payload.rows || message.payload.Rows)?.map((r: any) => ({
            id: r.id || r.Id,
            name: r.name || r.Name,
            completed: r.completed ?? r.Completed ?? false,
          })) ?? null,
        };

        scheduleRefetch({ items: (currentItems ?? []).map(item => item.id === itemId ? updatedItem : item) });
      }
      break;

    case 'checklist_item_order_changed':
      if (message.payload?.itemId && message.payload?.newOrderNumber !== undefined) {
        const reorderKey = `${message.payload.itemId}-${message.payload.newOrderNumber}`;
        if (recentlyReorderedItemsRef.current.has(reorderKey)) {
          recentlyReorderedItemsRef.current.delete(reorderKey);
          return;
        }
        scheduleRefetch();
      }
      break;

    case 'checklist_item_deleted':
      scheduleRefetch();
      break;
    default:
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        // eslint-disable-next-line no-console
        console.debug('⚡ Unknown realtime message type:', message.type);
      }
    }
  }, [checklistId, scheduleRefetch]);

  // SSE connection for real-time updates (replaces FCM/WebSocket)
  // Call the client-side hook directly (static import) so hooks rules are preserved.
  const processedEventIds = useRef<Set<string>>(new Set());

  useSSE((data: SseEvent) => {
    const normalizedData = {
      type: data.type,
      payload: data.payload || {}, // Ensure payload is always defined
      checklistId: data.checklistId,
    };

    handleRealtimeMessage(normalizedData);
  });

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
      
      // Mark this item as recently added to prevent WebSocket duplicate
      recentlyAddedItemsRef.current.add(created.id);
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        // eslint-disable-next-line no-console
        console.debug('🏷️ Marked item as recently added:', created.id, created.name);
      }
      
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
      
      mutateItems([...(items ?? []), newItem], { revalidate: false });
      
      // Clean up the tracking after 5 seconds
        setTimeout(() => {
        recentlyAddedItemsRef.current.delete(created.id);
        if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
          // eslint-disable-next-line no-console
          console.debug('🧹 Cleaned up recently added item:', created.id);
        }
      }, 5000);
      
    } catch (error) {
      console.error('❌ Failed to add item:', error);
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
          item.rows?.map((r) => ({
            id: r.id ?? 0,
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

    const exectuonFn = async (numberRetries: number) => {
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
      
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        // eslint-disable-next-line no-console
        console.debug('🔄 Calculated target order number:', targetOrderNumber, 'for position:', to, 'clientId:', clientIdRef.current);
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

    const res = await exectuonFn(0);
    if (res.retry) {
      await exectuonFn(1);
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
              completed: item.completed ? false : item.completed,
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
    mutateItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              rows: item.rows?.filter((row) => row.id !== rowId) ?? null,
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
    const currentItem = items.find((item) => item.id === itemId);
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
  scheduleRefetch({ items: items.map((item) => item.id === itemId ? updatedItem : item) });
      
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

