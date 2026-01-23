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
}

export interface ChecklistItemRow {
  id: number | null;
  name: string;
  completed: boolean | null;
}
