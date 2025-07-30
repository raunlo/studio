
"use client";

// This is a Client Component.
// The "use client" directive tells Next.js to send the JavaScript for this component
// to the user's browser. This is necessary because it uses hooks like `useState` and `useSWR`
// to manage state and fetch data, which can only be done on the client.

import type { Checklist, Item, SubItem, UpdateItem } from "@/lib/api";
import { useState } from "react";
import { ChecklistCard } from "@/components/checklist-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { PredefinedSubItem } from "@/lib/knowledge-base";
import { useToast } from "@/hooks/use-toast";
import { 
  useGetChecklists, 
  useDeleteChecklist,
  useUpdateChecklistTitle,
  useAddItem,
  useDeleteItem,
  useUpdateItem,
  useAddSubItem,
  useDeleteSubItem,
  useUpdateSubItem,
  useReorderItem
} from "@/lib/api";


export function ChecklistManager() {
  // This hook fetches data on the CLIENT side. The component will initially render
  // with a loading state, and then update once the data is fetched from the /api/proxy endpoint.
  const { data, error, isLoading, mutate } = useGetChecklists(undefined, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });
  const { toast } = useToast();

  const checklists: Checklist[] = (data as any)?.map((cl: any) => ({
    checklistId: cl.id.toString(),
    title: cl.name,
    items: (cl.items?.sort((a: Item, b: Item) => (a.position || 0) - (b.position || 0)) || []) as Item[]
  })) || [];


  const { trigger: deleteChecklistTrigger } = useDeleteChecklist();
  const { trigger: updateChecklistTitleTrigger } = useUpdateChecklistTitle();
  const { trigger: addItemTrigger } = useAddItem();
  const { trigger: deleteItemTrigger } = useDeleteItem();
  const { trigger: updateItemTrigger } = useUpdateItem();
  const { trigger: addSubItemTrigger } = useAddSubItem();
  const { trigger: deleteSubItemTrigger } = useDeleteSubItem();
  const { trigger: updateSubItemTrigger } = useUpdateSubItem();
  const { trigger: reorderItemTrigger } = useReorderItem();

  const handleError = (title: string, error: any) => {
    console.error(error);
    toast({
      variant: "destructive",
      title: title,
      description: "Your change could not be saved. Please try again.",
    });
  };

  const deleteChecklist = async (id: string) => {
    const originalChecklists = data;
    const updatedChecklistsData = (data as any)?.filter((cl: any) => cl.id.toString() !== id);
    mutate(updatedChecklistsData, { revalidate: false });

    try {
      await deleteChecklistTrigger({ checklistId: id });
    } catch (e) {
      handleError("Failed to delete checklist", e);
      mutate(originalChecklists);
    }
  };
  
  const updateChecklistTitle = async (id: string, title: string) => {
    try {
      await updateChecklistTitleTrigger({ checklistId: id, data: { title } }, {
        optimisticData: (currentData: any) => {
          const updatedChecklists = currentData.map((cl: any) => (cl.id.toString() === id ? { ...cl, name: title } : cl));
          return updatedChecklists;
        },
        revalidate: false,
      });
    } catch (e) {
      handleError("Failed to update title", e);
    }
  };

  const addItem = async (checklistId: string, text: string, quantity: number | undefined, subItemTemplates: PredefinedSubItem[]) => {
    try {
      const subItems = subItemTemplates.map(s => ({ text: s.text, quantity: s.quantity }));
      await addItemTrigger({ checklistId, data: { text, quantity, subItems } });
      mutate();
    } catch (e) {
      handleError("Failed to add item", e);
    }
  };
  
  const deleteItem = async (checklistId: string, itemId: string) => {
    try {
      await deleteItemTrigger({ checklistId, itemId }, {
        optimisticData: (currentData: any) => {
          const updatedChecklists = currentData.map((cl: any) => {
              if (cl.id.toString() !== checklistId) return cl;
              return { ...cl, items: cl.items.filter((item: any) => item.itemId !== itemId) };
          });
          return updatedChecklists;
        },
        revalidate: false,
      });
    } catch (e) {
      handleError("Failed to delete item", e);
    }
  };

  const updateItem = async (checklistId: string, updatedItem: Item) => {
    try {
        const { itemId, ...updateData } = updatedItem;
        await updateItemTrigger({ checklistId, itemId: itemId!, data: updateData as UpdateItem }, {
          optimisticData: (currentData: any) => {
            const updatedChecklists = currentData.map((cl: any) => {
              if (cl.id.toString() !== checklistId) return cl;
              const newItems = cl.items.map((item: any) => item.itemId === updatedItem.itemId ? updatedItem : item)
              return { ...cl, items: newItems };
            });
            return updatedChecklists;
          },
          revalidate: false
        });
    } catch (e) {
      handleError("Failed to update item", e);
    }
  };
  
  const addSubItem = async (checklistId: string, itemId: string, text: string, quantity: number | undefined) => {
    try {
        await addSubItemTrigger({ checklistId, itemId, data: { text, quantity }});
        mutate();
    } catch (e) {
      handleError("Failed to add sub-item", e);
    }
  };

  const deleteSubItem = async (checklistId: string, itemId: string, subItemId: string) => {
    try {
        await deleteSubItemTrigger({ checklistId, itemId, subItemId }, {
          optimisticData: (currentData: any) => {
            const updatedChecklists = currentData.map((cl: any) => {
              if (cl.id.toString() !== checklistId) return cl;
              const updatedItems = cl.items.map((item: any) => {
                  if (item.itemId !== itemId) return item;
                  const updatedSubItems = item.subItems.filter((sub: any) => sub.subItemId !== subItemId);
                  const parentChecked = updatedSubItems.length > 0 && updatedSubItems.every((sub: any) => sub.checked);
                  return { ...item, checked: parentChecked, subItems: updatedSubItems };
              });
              return { ...cl, items: updatedItems };
            });
            return updatedChecklists;
          },
          revalidate: false,
        });
    } catch(e) {
      handleError("Failed to delete sub-item", e);
    }
  };
  
  const updateSubItem = async (checklistId: string, itemId: string, updatedSubItem: SubItem) => {
    try {
        const { subItemId, ...updateData } = updatedSubItem;
        await updateSubItemTrigger({ checklistId, itemId, subItemId: subItemId!, data: updateData }, {
          optimisticData: (currentData: any) => {
            const updatedChecklists = currentData.map((cl: any) => {
              if (cl.id.toString() !== checklistId) return cl;
              const updatedItems = cl.items.map((item: any) => {
                  if (item.itemId !== itemId) return item;
                  const updatedSubItems = item.subItems.map((sub: any) => sub.subItemId === updatedSubItem.subItemId ? updatedSubItem : sub);
                  const parentChecked = updatedSubItems.length > 0 && updatedSubItems.every((sub: any) => sub.checked);
                  return { ...item, checked: parentChecked, subItems: updatedSubItems };
              });
              return { ...cl, items: updatedItems };
            });
            return updatedChecklists;
          },
          revalidate: false
        });
    } catch (e) {
      handleError("Failed to update sub-item", e);
    }
  };
  
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    const sourceChecklistId = source.droppableId;
    const destinationChecklistId = destination.droppableId;
    
    // For now, we only support reordering within the same list.
    if (sourceChecklistId !== destinationChecklistId) {
        return;
    }
    
    const originalChecklists = data;
    
    let reorderedItems: Item[] = [];
    const checklistToUpdate = checklists.find(cl => cl.checklistId === sourceChecklistId);
    
    if (checklistToUpdate) {
        const items = Array.from(checklistToUpdate.items);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        reorderedItems = items.map((item, index) => ({...item, position: index}));

        const updatedChecklistsData = (data as any).map((cl: any) => {
            if (cl.id.toString() !== sourceChecklistId) return cl;
            // This is complex because we need to find the original raw item
            // It's better to just re-sort based on new positions if the full item is not in scope
            // A simpler optimistic update might just update the UI and wait for revalidation
            const reorderedRawItems = reorderedItems.map(item => {
                return { ...item, itemId: item.itemId }; // simplified for optimistic update
            });
            return { ...cl, items: reorderedItems };
        });
        mutate(updatedChecklistsData, { revalidate: false });
    }

    try {
      await reorderItemTrigger({ checklistId: sourceChecklistId, itemId: draggableId, data: { newPosition: destination.index } });
      // Revalidate data from server to get the canonical state
      mutate();
    } catch(e) {
      handleError("Failed to reorder item", e);
      mutate(originalChecklists);
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

  if (error) {
    return (
      <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg border-destructive">
          <h3 className="text-xl font-semibold text-destructive">Failed to load checklists</h3>
          <p className="text-muted-foreground mt-2">Could not connect to the server. Please ensure the API is running and accessible.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

  