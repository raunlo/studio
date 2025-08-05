import {ChecklistItemResponse, ChecklistItemRowResponse, ChecklistResponse} from "@/api/checklistServiceV1.schemas"

export type ChecklistCardHandle = {
   handleReorder: (fromIndex: number, toIndex: number) => Promise<void>;
};

export type ChecklistCardProps = {
  checklist: ChecklistResponse;
};

export interface ChecklistItem {
    completed: boolean
    id: number | undefined
    name: string
    orderNumber: number | undefined
    rows: Array<ChecklistItemRow>
}


export interface ChecklistItemRow {
    id: number | undefined
    name: string
    completed: false
}
