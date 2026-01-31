import { ChecklistResponse } from "@/api/checklistServiceV1.schemas";

export type ChecklistCardHandle = {
   handleReorder: (fromIndex: number, toIndex: number) => Promise<void>;
};

export type ChecklistCardProps = {
  checklist: ChecklistResponse;
};

export interface ChecklistItem {
  id: number | null;
  name: string;
  completed: boolean;
  orderNumber: number | null;
  rows: ChecklistItemRow[] | null;
  /** Transient flag for SSE highlight animation - auto-clears after animation */
  _sseHighlight?: boolean;
  /** Transient flag for optimistic update - item is pending server confirmation */
  _isPending?: boolean;
  /** Original temp ID for stable React key when transitioning from temp to real item */
  _originalTempId?: number;
}

export interface ChecklistItemRow {
  id: number | null;
  name: string;
  completed: boolean | null;
}
