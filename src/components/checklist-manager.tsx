
"use client";

// This is a Client Component.
// The "use client" directive tells Next.js to send the JavaScript for this component
// to the user's browser. This is necessary because it uses hooks like `useState` and `useSWR`
// to manage state and fetch data, which can only be done on the client.

import { useMemo, useRef } from "react";
import { ChecklistCard } from "@/components/checklist-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { PredefinedSubItem } from "@/lib/knowledge-base";
import { useToast } from "@/hooks/use-toast";
import {useGetAllChecklists} from "@/api/checklist/checklist"
import {axiousProps} from "@/lib/axios"
import {ChecklistCardHandle, ChecklistCardProps} from "@/components/shared/types"
 
// --- START: Frontend-specific types ---
// We create local types to match what the UI components expect (e.g., checklistId, title).
// This decouples the UI from the exact API schema.

// --- END: Frontend-specific types ---



export function ChecklistManager() {
  const checklistCardRefs = useRef<Record<string, ChecklistCardHandle>>({});
  // This hook fetches data on the CLIENT side. The component will initially render
  // with a loading state, and then update once the data is fetched from the /api/proxy endpoint.
  const { data, error, isLoading } = useGetAllChecklists({
    swr : {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
  },axios: axiousProps});
  const { toast } = useToast();
  

  const handleError = (title: string, error: any) => {
    console.error(error);
    toast({
      variant: "destructive",
      title: title,
      description: "Your change could not be saved. Please try again.",
    });
  };
  
  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

  if (!destination || source.droppableId !== destination.droppableId) return;

  const checklistId = source.droppableId;
  const sourceIndex = source.index;
  const destinationIndex = destination.index;
  console.log("Source index: " + sourceIndex)
  console.log("destination index: " + destinationIndex)

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

  const checklists = data?.data!!

  return (
    <div className="space-y-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-6">
          {checklists.map((checklist) => (
            <ChecklistCard
              ref={(ref) => {
                if (ref) {
                  checklistCardRefs.current[checklist.id] = ref;
                } else {
                  delete checklistCardRefs.current[checklist.id];
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
