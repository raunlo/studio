export type SubItem = {
  id: string;
  text: string;
  checked: boolean;
};

export type ChecklistItem = {
  id:string;
  text: string;
  checked: boolean;
  isCollapsed: boolean;
  subItems: SubItem[];
};

export type Checklist = {
  id: string;
  title: string;
  items: ChecklistItem[];
};
