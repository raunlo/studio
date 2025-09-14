
"use client";

import { useRef } from "react";
import { ChecklistCard } from "@/components/checklist-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { ChecklistCardHandle } from "@/components/shared/types";
import { useGetAllChecklists } from "@/api/checklist/checklist";
import { useEffect } from "react";
import { useSSE } from '@/hooks/use-sse';
import { mutate } from "swr";

// --- START: Frontend-specific types ---
// We create local types to match what the UI components expect (e.g., checklistId, title).
// This decouples the UI from the exact API schema.

// --- END: Frontend-specific types ---



export function ChecklistManager() {
  const checklistCardRefs = useRef<Record<string, ChecklistCardHandle>>({});
  const { data, isLoading, error } = useGetAllChecklists({
    swr: { refreshInterval: 10000 }
  });

  // SSE for real-time updates: subscribe and refresh SWR keys when relevant
  useSSE((data: any) => {
      try {
      const message = data as { type: string; checklistId?: number };
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        // eslint-disable-next-line no-console
        console.debug('Received SSE message:', message);
      }
      switch (message.type) {
        case 'checklist_item_created':
        case 'checklist_item_updated':
        case 'checklist_item_deleted':
        case 'checklist_item_toggled':
        case 'checklist_item_order_changed':
          if (message.checklistId) {
            const checklistItemsKey = `/api/v1/checklists/${message.checklistId}/items`;
            mutate(checklistItemsKey);
            mutate('/api/v1/checklists');
          }
          break;
        default:
          break;
      }
    } catch (e) {
      console.error('SSE handler error', e);
    }
  });
  
  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

  if (!destination || source.droppableId !== destination.droppableId) return;

  const checklistId = source.droppableId;

  const checklistRef = checklistCardRefs.current[checklistId];
  if (checklistRef) {
    await checklistRef.handleReorder(source.index, destination.index); // ✅ invoke method on the child
  } else {
    console.warn("Checklist ref not found for", checklistId);
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

  const checklists = data ?? []

  return (
    <div className="space-y-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-6">
          {checklists.map((checklist: any) => (
            <ChecklistCard
              ref={(ref) => {
                if (ref) {
                  checklistCardRefs.current[String(checklist.id)] = ref;
                } else {
                  delete checklistCardRefs.current[String(checklist.id)];
                }
              }}
              key={String(checklist.id)}
              checklist={checklist}
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
