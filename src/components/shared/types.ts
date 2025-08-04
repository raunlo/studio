import {ChecklistItemResponse, ChecklistItemRowResponse, ChecklistResponse} from "@/api/checklistServiceV1.schemas"

export type ChecklistCardHandle = {
   handleReorder: (fromIndex: number, toIndex: number) => Promise<void>;
};

export type ChecklistCardProps = {
  checklist: ChecklistResponse;
};

export type ChecklistItem = ChecklistItemResponse
export type ChecklistItemRow = ChecklistItemRowResponse