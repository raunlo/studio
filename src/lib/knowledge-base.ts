export type PredefinedSubItem = {
  text: string;
  quantity?: number;
}

export type PredefinedChecklistItem = {
    key: string;
    text: string;
    quantity?: number;
    subItems: PredefinedSubItem[];
};
