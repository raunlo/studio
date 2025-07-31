
"use client";

// This is a Client Component.
// The "use client" directive tells Next.js to send the JavaScript for this component
// to the user's browser. This is necessary because it uses hooks like `useState` and `useSWR`
// to manage state and fetch data, which can only be done on the client.

import type { Item as ApiItem, SubItem as ApiSubItem, Checklist as ApiChecklist } from "@/lib/api.schemas";
import { useMemo } from "react";
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

// --- START: Frontend-specific types ---
// We create local types to match what the UI components expect (e.g., checklistId, title).
// This decouples the UI from the exact API schema.

export type SubItem = {
  subItemId: string;
  text: string;
  quantity?: number;
  checked: boolean;
};

export type Item = {
  itemId: string;
  text: string;
  quantity?: number;
  checked: boolean;
  isCollapsed: boolean;
  position: number;
  subItems: SubItem[];
};

export type Checklist = {
  checklistId: string;
  title: string;
  items: Item[];
};
// --- END: Frontend-specific types ---


export function ChecklistManager() {
  // This hook fetches data on the CLIENT side. The component will initially render
  // with a loading state, and then update once the data is fetched from the /api/proxy endpoint.
  const { data, error, isLoading, mutate } = useGetChecklists(undefined, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });
  const { toast } = useToast();
  
  // --- START: Data Mapping ---
  // This `useMemo` block is the key to decoupling the frontend from the backend.
  // It transforms the data from the API format (e.g., id, name) to the format
  // expected by the UI components (e.g., checklistId, title).
  const checklists: Checklist[] = useMemo(() => {
    // The raw data from the API, we cast to `any` to handle the array directly.
    const rawChecklists = data as any; 

    if (!Array.isArray(rawChecklists)) {
      return [];
    }

    // Map over the raw API data and transform it into the local `Checklist` type.
    return rawChecklists.map((cl: ApiChecklist): Checklist => ({
      checklistId: cl.id!.toString(), // Convert number `id` to string `checklistId`
      title: cl.name!, // Map `name` to `title`
      items: (cl.items || [])
        .map((item: ApiItem): Item => ({
          itemId: item.id!,
          text: item.text!,
          quantity: item.quantity ?? undefined,
          checked: item.checked ?? false,
          isCollapsed: item.isCollapsed ?? true,
          position: item.position ?? 0,
          subItems: (item.subItems || []).map((sub: ApiSubItem): SubItem => ({
            subItemId: sub.id!,
            text: sub.text!,
            quantity: sub.quantity ?? undefined,
            checked: sub.checked ?? false,
          })),
        }))
        .sort((a, b) => a.position - b.position), // Sort items by position
    }));
  }, [data]);
  // --- END: Data Mapping ---


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

  const deleteChecklist = async (checklistId: string) => {
    const originalChecklists = data;
    const updatedChecklists = checklists.filter((cl) => cl.checklistId !== checklistId);
    mutate(updatedChecklists as any, { revalidate: false });

    try {
      await deleteChecklistTrigger({ id: checklistId });
    } catch (e) {
      handleError("Failed to delete checklist", e);
      mutate(originalChecklists);
    }
  };
  
  const updateChecklistTitle = async (checklistId: string, title: string) => {
    try {
      // Map frontend `title` back to API's `name`
      await updateChecklistTitleTrigger({ id: checklistId, data: { name: title } }, {
        optimisticData: (currentData: any) => {
            const updatedChecklists = currentData.map((cl: any) =>
                cl.id.toString() === checklistId ? { ...cl, name: title } : cl
            );
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
      // Pass checklistId as `id` to the API
      await addItemTrigger({ id: checklistId, data: { text, quantity, subItems } });
      mutate();
    } catch (e) {
      handleError("Failed to add item", e);
    }
  };
  
  const deleteItem = async (checklistId: string, itemId: string) => {
    try {
      await deleteItemTrigger({ checklistId, itemId });
      mutate();
    } catch (e) {
      handleError("Failed to delete item", e);
    }
  };

  const updateItem = async (checklistId: string, updatedItem: Item) => {
    try {
        const { itemId, ...updateData } = updatedItem;
        await updateItemTrigger({ checklistId, itemId: itemId!, data: updateData }, {
          optimisticData: (currentData: any) => {
            const updatedApiChecklists = (currentData as ApiChecklist[]).map((cl) => {
              if (cl.id!.toString() !== checklistId) return cl;
              const newItems = cl.items!.map((item) => {
                if (item.id !== updatedItem.itemId) return item;
                // This is a shallow merge, you might need a deep merge if items have nested objects
                return { ...item, ...updateData };
              });
              return { ...cl, items: newItems };
            });
            return updatedApiChecklists;
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
        await deleteSubItemTrigger({ checklistId, itemId, subItemId });
        mutate();
    } catch(e) {
      handleError("Failed to delete sub-item", e);
    }
  };
  
  const updateSubItem = async (checklistId: string, itemId: string, updatedSubItem: SubItem) => {
    try {
        const { subItemId, ...updateData } = updatedSubItem;
        await updateSubItemTrigger({ checklistId, itemId, subItemId: subItemId!, data: updateData }, {
          optimisticData: (currentData: any) => {
            const currentApiChecklists = currentData as ApiChecklist[];
            const updatedChecklists = currentApiChecklists.map((cl) => {
              if (cl.id!.toString() !== checklistId) return cl;
              const updatedItems = cl.items!.map((item) => {
                if (item.id !== itemId) return item;
                const updatedSubItems = item.subItems!.map((sub) => {
                  if (sub.id !== updatedSubItem.subItemId) return sub;
                  return { ...sub, ...updatedSubItem };
                });
                const parentChecked = updatedSubItems.length > 0 && updatedSubItems.every((sub) => sub.checked);
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

        const updatedChecklistsData = checklists.map((cl) => {
            if (cl.checklistId !== sourceChecklistId) return cl;
            return { ...cl, items: reorderedItems };
        });
        mutate(updatedChecklistsData as any, { revalidate: false });
    }

    try {
      await reorderItemTrigger({ checklistId: sourceChecklistId, itemId: draggableId, data: { newPosition: destination.index } });
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
