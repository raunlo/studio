"use client";

import useSWR from "swr";
import {
  ChecklistItemResponse,
  ChecklistItemRowResponse,
  ChecklistResponse,
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
} from "@/api/checklist-item/checklist-item";
import { useGetAllChecklists } from "@/api/checklist/checklist";
import { axiousProps } from "@/lib/axios";
import { ChecklistItem, ChecklistItemRow } from "@/components/shared/types";

interface ChecklistHookResult {
  checklists: ChecklistResponse[];
  items: ChecklistItem[];
  isLoading: boolean;
  error: unknown;
  addItem: (item: ChecklistItem) => Promise<void>;
  updateItem: (item: ChecklistItem) => Promise<void>;
  deleteItem: (itemId: number | null) => Promise<void>;
  reorderItem: (from: number, to: number) => Promise<void>;
  addRow: (itemId: number | null, row: ChecklistItemRow) => Promise<void>;
  deleteRow: (itemId: number | null, rowId: number | null) => Promise<void>;
}

interface ChecklistHookOptions {
  refreshInterval?: number;
}

export function useChecklist(
  checklistId?: number,
  options: ChecklistHookOptions = {},
): ChecklistHookResult {
  const { refreshInterval } = options;

  const {
    data: checklistRes,
    error,
    isLoading: isChecklistsLoading,
  } = useGetAllChecklists({ axios: axiousProps, swr: { refreshInterval } });

  const { data: items = [], mutate: mutateItems } = useSWR<ChecklistItem[]>(
    checklistId ? ["checklist-items", checklistId] : null,
    async () => {
      const res = await getAllChecklistItems(
        checklistId!,
        { completed: undefined },
        axiousProps,
      );
      return res.data.map((i: ChecklistItemResponse) => ({
        id: i.id,
        name: i.name,
        completed: i.completed,
        orderNumber: i.orderNumber,
        rows:
          i.rows?.map((r) => ({
            id: r.id,
            name: r.name,
            completed: r.completed,
          })) ?? null,
      }));
    },
    { refreshInterval },
  );

  const addItem = async (item: ChecklistItem) => {
    if (!checklistId) return;
    mutateItems([...(items ?? []), item], false);
    await createChecklistItem(
      checklistId,
      {
        name: item.name,
        rows:
          item.rows?.map((r) => ({
            name: r.name,
            completed: r.completed ?? null,
          })) ?? [],
      } as CreateChecklistItemRequest,
      axiousProps,
    );
    mutateItems();
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
      await updateChecklistItemBychecklistIdAndItemId(
        checklistId,
        item.id,
        req,
        axiousProps,
      );
      mutateItems();
    }
  };

  const deleteItem = async (itemId: number | null) => {
    if (!checklistId) return;
    mutateItems(items.filter((i) => i.id !== itemId), false);
    if (itemId) {
      await deleteChecklistItemById(checklistId, itemId, axiousProps);
      mutateItems();
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
      const targetOrderNumber = items[to]?.orderNumber;
      const newList = [...items];
      const [moved] = newList.splice(from, 1);
      newList.splice(to, 0, moved);
      const previousItems = [...items];
      mutateItems(newList, { revalidate: false });
      if (moved?.id && targetOrderNumber) {
        try {
          await changeChecklistItemOrderNumber(
            checklistId,
            moved.id,
            { newOrderNumber: targetOrderNumber },
            undefined,
            axiousProps,
          );
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
    mutateItems(
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: item.completed ? false : item.completed,
              rows: [...(item.rows ?? []), row],
            }
          : item,
      ),
      false,
    );
    if (itemId) {
      const requests = []
      const checklistItem = items.find(item => item.id === itemId)
     const addRowFn = createChecklistItemRow(
        checklistId,
        itemId,
        { name: row.name, completed: row.completed ?? null } as Omit<
          ChecklistItemRowResponse,
          "id"
        >,
        axiousProps,
      );
      requests.push(addRowFn)
      if (checklistItem && checklistItem.completed) {
        requests.push(updateItem(
          {
            ...checklistItem,
            completed: false
          }
        ))
      }
      await Promise.all(requests)
      mutateItems();
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
      await deleteChecklistItemRow(checklistId, itemId, rowId, axiousProps);
      mutateItems();
    }
  };

  const isLoading = isChecklistsLoading || (checklistId ? items.length === 0 : false);

  return {
    checklists: checklistRes?.data ?? [],
    items,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    reorderItem,
    addRow,
    deleteRow,
  };
}

