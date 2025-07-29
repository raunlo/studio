export type SubItem = {
  subItemId: string;
  text: string;
  checked: boolean;
  quantity?: number;
};

export type ChecklistItem = {
  itemId: string;
  text: string;
  checked: boolean;
  isCollapsed: boolean;
  subItems: SubItem[];
  quantity?: number;
  position: number;
};

export type Checklist = {
  checklistId: string;
  title: string;
  items: ChecklistItem[];
};
