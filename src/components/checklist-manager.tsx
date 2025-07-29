
"use client";

import type { Checklist, ChecklistItem, SubItem } from "@/lib/types";
import { useState, useEffect } from "react";
import { ChecklistCard } from "@/components/checklist-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { PredefinedSubItem } from "@/lib/knowledge-base";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function ChecklistManager() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadChecklists = async () => {
      try {
        setIsLoading(true);
        const { checklists } = await api.getChecklists();
        const sortedChecklists = checklists.map(cl => ({
          ...cl,
          items: cl.items.sort((a, b) => a.position - b.position)
        }));

        setChecklists(sortedChecklists);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load checklists",
          description: "Could not fetch data from the server. Please try again later.",
        });
        setChecklists([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadChecklists();
  }, [toast]);

  const handleError = (title: string, originalState: Checklist[]) => {
    toast({
      variant: "destructive",
      title: title,
      description: "Your change could not be saved. Please try again.",
    });
    setChecklists(originalState);
  }

  const deleteChecklist = async (id: string) => {
    const originalChecklists = [...checklists];
    setChecklists(checklists.filter((cl) => cl.checklistId !== id));
    try {
      await api.deleteChecklist(id);
    } catch (error) {
      handleError("Failed to delete checklist", originalChecklists);
    }
  };
  
  const updateChecklistTitle = async (id: string, title: string) => {
    const originalChecklists = [...checklists];
    setChecklists(checklists.map((cl) => (cl.checklistId === id ? { ...cl, title } : cl)));
     try {
       await api.updateChecklistTitle(id, title);
     } catch (error) {
       handleError("Failed to update title", originalChecklists);
     }
  };

  const addItem = async (checklistId: string, text: string, quantity: number | undefined, subItemTemplates: PredefinedSubItem[]) => {
    const originalChecklists = [...checklists];
    // Optimistic UI update (with temporary item)
    const tempItemId = `temp-${crypto.randomUUID()}`;
    const newItem: Omit<ChecklistItem, 'itemId' | 'position'> = {
      text,
      quantity,
      checked: false,
      isCollapsed: true,
      subItems: subItemTemplates.map(s => ({...s, subItemId: `temp-sub-${crypto.randomUUID()}`, checked: false})),
    };
    setChecklists(
      checklists.map((cl) => {
        if (cl.checklistId === checklistId) {
          return { ...cl, items: [...cl.items, {...newItem, itemId: tempItemId, position: cl.items.length }] };
        }
        return cl;
      })
    );

    try {
        const createdItem = await api.addItem(checklistId, text, quantity, subItemTemplates);
        setChecklists(prev => prev.map(cl => {
            if (cl.checklistId !== checklistId) return cl;
            return {
                ...cl,
                items: cl.items.map(it => it.itemId === tempItemId ? createdItem : it)
            }
        }));
    } catch (error) {
        handleError("Failed to add item", originalChecklists);
    }
  };
  
  const deleteItem = async (checklistId: string, itemId: string) => {
    const originalChecklists = [...checklists];
    setChecklists(checklists.map(cl => {
        if (cl.checklistId !== checklistId) return cl;
        return { ...cl, items: cl.items.filter(item => item.itemId !== itemId) };
    }));
    try {
        await api.deleteItem(checklistId, itemId);
    } catch (error) {
        handleError("Failed to delete item", originalChecklists);
    }
  };

  const updateItem = async (checklistId: string, updatedItem: ChecklistItem) => {
    const originalChecklists = [...checklists];
    setChecklists(checklists.map(cl => {
        if (cl.checklistId !== checklistId) return cl;
        return { ...cl, items: cl.items.map(item => item.itemId === updatedItem.itemId ? updatedItem : item) };
    }));
    try {
        const { itemId, ...updateData } = updatedItem;
        await api.updateItem(checklistId, itemId, updateData);
    } catch (error) {
        handleError("Failed to update item", originalChecklists);
    }
  };
  
  const addSubItem = async (checklistId: string, itemId: string, text: string, quantity: number | undefined) => {
    const originalChecklists = [...checklists];
    const tempSubItemId = `temp-sub-${crypto.randomUUID()}`;
    setChecklists(checklists.map(cl => {
        if (cl.checklistId !== checklistId) return cl;
        const updatedItems = cl.items.map(item => {
            if (item.itemId !== itemId) return item;
            const newSubItem: SubItem = { subItemId: tempSubItemId, text, quantity, checked: false };
            return { ...item, checked: false, subItems: [...item.subItems, newSubItem] };
        });
        return { ...cl, items: updatedItems };
    }));

    try {
        const createdSubItem = await api.addSubItem(checklistId, itemId, text, quantity);
        setChecklists(prev => prev.map(cl => {
            if (cl.checklistId !== checklistId) return cl;
            const newItems = cl.items.map(item => {
                if (item.itemId !== itemId) return item;
                const newSubItems = item.subItems.map(si => si.subItemId === tempSubItemId ? createdSubItem : si);
                return {...item, subItems: newSubItems};
            });
            return {...cl, items: newItems};
        }));
    } catch (error) {
        handleError("Failed to add sub-item", originalChecklists);
    }
  };

  const deleteSubItem = async (checklistId: string, itemId: string, subItemId: string) => {
    const originalChecklists = [...checklists];
    setChecklists(checklists.map(cl => {
        if (cl.checklistId !== checklistId) return cl;
        const updatedItems = cl.items.map(item => {
            if (item.itemId !== itemId) return item;
            const updatedSubItems = item.subItems.filter(sub => sub.subItemId !== subItemId);
            const parentChecked = updatedSubItems.length > 0 && updatedSubItems.every(sub => sub.checked);
            return { ...item, checked: parentChecked, subItems: updatedSubItems };
        });
        return { ...cl, items: updatedItems };
    }));
    try {
        await api.deleteSubItem(checklistId, itemId, subItemId);
    } catch(error) {
        handleError("Failed to delete sub-item", originalChecklists);
    }
  };
  
  const updateSubItem = async (checklistId: string, itemId: string, updatedSubItem: SubItem) => {
    const originalChecklists = [...checklists];
    setChecklists(checklists.map(cl => {
        if (cl.checklistId !== checklistId) return cl;
        const updatedItems = cl.items.map(item => {
            if (item.itemId !== itemId) return item;
            const updatedSubItems = item.subItems.map(sub => sub.subItemId === updatedSubItem.subItemId ? updatedSubItem : sub);
            const parentChecked = updatedSubItems.length > 0 && updatedSubItems.every(sub => sub.checked);
            return { ...item, checked: parentChecked, subItems: updatedSubItems };
        });
        return { ...cl, items: updatedItems };
    }));
    try {
        const { subItemId, ...updateData } = updatedSubItem;
        await api.updateSubItem(checklistId, itemId, subItemId, updateData);
    } catch (error) {
        handleError("Failed to update sub-item", originalChecklists);
    }
  };
  
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    const checklistId = source.droppableId;
    
    const originalChecklists = [...checklists];
    
    let reorderedItems: ChecklistItem[] = [];
    setChecklists(checklists.map(cl => {
      if (cl.checklistId !== checklistId) return cl;
  
      const items = Array.from(cl.items);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      reorderedItems = items.map((item, index) => ({...item, position: index}));
  
      return { ...cl, items: reorderedItems };
    }));

    try {
      await api.reorderItem(checklistId, draggableId, destination.index);
    } catch(error) {
      handleError("Failed to reorder item", originalChecklists);
    }
  };


  if (isLoading) {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    )
  }

  return (
    <div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-6">
          {checklists.map((checklist) => (
            <ChecklistCard
              key={checklist.checklistId}
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
