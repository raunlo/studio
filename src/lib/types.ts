export type SubItem = {
  id: string;
  text: string;
  checked: boolean;
  quantity?: number;
};

export type ChecklistItem = {
  id: string;
  text: string;
  checked: boolean;
  isCollapsed: boolean;
  subItems: SubItem[];
  quantity?: number;
};

export type Checklist = {
  id: string;
  title: string;
  items: ChecklistItem[];
};
