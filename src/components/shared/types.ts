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
}

export interface ChecklistItemRow {
  id: number | null;
  name: string;
  completed: boolean | null;
}
