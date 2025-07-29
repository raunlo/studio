
"use client";

import type { Checklist, ChecklistItem, SubItem } from "@/lib/types";
import { useState, useEffect } from "react";
import { ChecklistCard } from "@/components/checklist-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";

const LOCAL_STORAGE_KEY = "nestedChecklists";

const defaultChecklists: Checklist[] = [
  {
    id: 'cl-1',
    title: "My Day",
    items: []
  }
];


export function ChecklistManager() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        setChecklists(JSON.parse(storedData));
      } else {
        setChecklists(defaultChecklists);
      }
    } catch (error) {
      console.error("Failed to load from local storage.", error);
      setChecklists(defaultChecklists);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(checklists));
    }
  }, [checklists, isLoading]);
  
  const deleteChecklist = (id: string) => {
    setChecklists(checklists.filter((cl) => cl.id !== id));
  };
  
  const updateChecklistTitle = (id: string, title: string) => {
     setChecklists(checklists.map((cl) => (cl.id === id ? { ...cl, title } : cl)));
  };

  const addItem = (checklistId: string, text: string, subItemTexts: string[]) => {
    const newSubItems: SubItem[] = subItemTexts.map(subText => ({
      id: crypto.randomUUID(),
      text: subText,
      checked: false,
    }));

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text,
      checked: false,
      isCollapsed: true,
      subItems: newSubItems,
    };
    setChecklists(
      checklists.map((cl) =>
        cl.id === checklistId ? { ...cl, items: [...cl.items, newItem] } : cl
      )
    );
  };
  
  const deleteItem = (checklistId: string, itemId: string) => {
     setChecklists(checklists.map(cl => {
        if (cl.id !== checklistId) return cl;
        return { ...cl, items: cl.items.filter(item => item.id !== itemId) };
     }));
  };

  const updateItem = (checklistId: string, updatedItem: ChecklistItem) => {
    setChecklists(checklists.map(cl => {
        if (cl.id !== checklistId) return cl;
        return { ...cl, items: cl.items.map(item => item.id === updatedItem.id ? updatedItem : item) };
    }));
  };
  
  const addSubItem = (checklistId: string, itemId: string, text: string) => {
    const newSubItem: SubItem = { id: crypto.randomUUID(), text, checked: false };
    setChecklists(checklists.map(cl => {
        if (cl.id !== checklistId) return cl;
        const updatedItems = cl.items.map(item => {
            if (item.id !== itemId) return item;
            // When adding a new sub-item, uncheck the parent
            return { ...item, checked: false, subItems: [...item.subItems, newSubItem] };
        });
        return { ...cl, items: updatedItems };
    }));
  };

  const deleteSubItem = (checklistId: string, itemId: string, subItemId: string) => {
    setChecklists(checklists.map(cl => {
        if (cl.id !== checklistId) return cl;
        const updatedItems = cl.items.map(item => {
            if (item.id !== itemId) return item;
            const updatedSubItems = item.subItems.filter(sub => sub.id !== subItemId);
            // After deleting, check if parent should be checked
            const parentChecked = updatedSubItems.length > 0 && updatedSubItems.every(sub => sub.checked);
            return { ...item, checked: parentChecked, subItems: updatedSubItems };
        });
        return { ...cl, items: updatedItems };
    }));
  };
  
  const updateSubItem = (checklistId: string, itemId: string, updatedSubItem: SubItem) => {
    setChecklists(checklists.map(cl => {
        if (cl.id !== checklistId) return cl;
        const updatedItems = cl.items.map(item => {
            if (item.id !== itemId) return item;
            const updatedSubItems = item.subItems.map(sub => sub.id === updatedSubItem.id ? updatedSubItem : sub);
            const parentChecked = updatedSubItems.length > 0 && updatedSubItems.every(sub => sub.checked);
            return { ...item, checked: parentChecked, subItems: updatedSubItems };
        });
        return { ...cl, items: updatedItems };
    }));
  };
  
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const checklistId = source.droppableId;
    
    setChecklists(checklists.map(cl => {
      if (cl.id !== checklistId) return cl;
  
      const items = Array.from(cl.items);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
  
      return { ...cl, items };
    }));
  };


  if (isLoading) {
    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-6">
          {checklists.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              onDelete={deleteChecklist}
              onUpdateTitle={updateChecklistTitle}
              onAddItem={addItem}
              onDeleteItem={deleteItem}
              onUpdateItem={updateItem}
              onAddSubItem={addSubItem}
              onDeleteSubItem={deleteSubItem}
              onUpdateSubItem={updateSubItem}
            />
          ))}
          {checklists.length === 0 && (
              <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg">
                  <h3 className="text-xl font-semibold text-muted-foreground">No checklists yet!</h3>
                  <p className="text-muted-foreground mt-2">Create your first checklist to get started.</p>
              </div>
          )}
        </div>
      </DragDropContext>
    </div>
  );
}
