import { Checklist, ChecklistItem, SubItem } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchApi(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error: ${response.status} ${response.statusText}`, errorBody);
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return;
  }
  
  return response.json();
}

// Checklists
export const getChecklists = (): Promise<{checklists: Checklist[]}> => fetchApi('/checklists');
export const createChecklist = (title: string): Promise<Checklist> => fetchApi('/checklists', { method: 'POST', body: JSON.stringify({ title }) });
export const updateChecklistTitle = (checklistId: string, title: string): Promise<Checklist> => fetchApi(`/checklists/${checklistId}`, { method: 'PATCH', body: JSON.stringify({ title }) });
export const deleteChecklist = (checklistId: string): Promise<void> => fetchApi(`/checklists/${checklistId}`, { method: 'DELETE' });

// Items
export const addItem = (checklistId: string, text: string, quantity: number | undefined, subItems: {text: string, quantity?: number}[]): Promise<ChecklistItem> => fetchApi(`/checklists/${checklistId}/items`, { method: 'POST', body: JSON.stringify({ text, quantity, subItems }) });
export const updateItem = (checklistId: string, itemId: string, data: Partial<Omit<ChecklistItem, 'itemId' | 'subItems'>>): Promise<Checklist> => fetchApi(`/checklists/${checklistId}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteItem = (checklistId: string, itemId: string): Promise<void> => fetchApi(`/checklists/${checklistId}/items/${itemId}`, { method: 'DELETE' });
export const reorderItem = (checklistId: string, itemId: string, newPosition: number): Promise<void> => fetchApi(`/checklists/${checklistId}/items/${itemId}/reorder`, { method: 'POST', body: JSON.stringify({ newPosition }) });


// Sub-items
export const addSubItem = (checklistId: string, itemId: string, text: string, quantity: number | undefined): Promise<SubItem> => fetchApi(`/checklists/${checklistId}/items/${itemId}/subitems`, { method: 'POST', body: JSON.stringify({ text, quantity }) });
export const updateSubItem = (checklistId: string, itemId: string, subItemId: string, data: Partial<Omit<SubItem, 'subItemId'>>): Promise<SubItem> => fetchApi(`/checklists/${checklistId}/items/${itemId}/subitems/${subItemId}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteSubItem = (checklistId: string, itemId: string, subItemId: string): Promise<void> => fetchApi(`/checklists/${checklistId}/items/${itemId}/subitems/${subItemId}`, { method: 'DELETE' });
