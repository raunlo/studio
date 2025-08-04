
"use client";

import {cn} from "@/lib/utils"
import { forwardRef, useState, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { ChecklistItemComponent } from "@/components/checklist-item";
import { AddItemModal } from "@/components/add-item-modal";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { AddItemForm } from "@/components/add-item-form";
import { PredefinedChecklistItem, PredefinedSubItem } from "@/lib/knowledge-base";
import {ChecklistItemResponse, ChecklistResponse, CreateChecklistItemRequest} from "@/api/checklistServiceV1.schemas"
import { useGetAllChecklistItems, createChecklistItem } from "@/api/checklist-item/checklist-item"
import { axiousProps } from "@/lib/axios";
import {ChecklistCardHandle} from "@/components/shared/types"
import {changeChecklistItemOrderNumber, updateChecklistItemBychecklistIdAndItemId} from "@/api/checklist-item/checklist-item" 
import { AxiosResponse } from "axios";


type ChecklistCardProps = {
  checklist: ChecklistResponse;
};

export const ChecklistCard = forwardRef<ChecklistCardHandle, ChecklistCardProps>(
  ({ checklist }, ref): JSX.Element => {
  const {data, mutate, error, isLoading} = useGetAllChecklistItems(checklist.id, {
    completed: undefined
  }, {
    swr: {
      refreshInterval: 50
    }, axios: axiousProps
  })

  useImperativeHandle(ref, () => ({
      async handleReorder(from, to) {
        const fromObj = items[from]

        const reordered = [...items];
        const [moved] = reordered.splice(from, 1);
        reordered.splice(to, 0, moved);

        mutate({ ...data, data: reordered } as AxiosResponse<ChecklistItemResponse[]>, { revalidate: false });

        try {
         await changeChecklistItemOrderNumber(
          checklist.id,
          fromObj.id,
          {newOrderNumber: to + 1},
          undefined, // sort order lets ignore it
          axiousProps
         )
        } catch (e) {
          console.log(e)
          mutate({...data, data:items} as AxiosResponse<ChecklistItemResponse[]>, {revalidate: false})
        }
      },
    }));

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newChecklistItemName, setNewChecklistItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState<number | undefined>();
  const [rows, setRows] = useState<PredefinedSubItem[]>([]);

  const handleAddItem = async (checklistItem: ChecklistItemResponse) => {
    
   const response =  await createChecklistItem(
      checklist.id,
      {
        name: checklistItem.name,
        rows: checklistItem.rows
      } as CreateChecklistItemRequest,
      axiousProps
    )

    mutate(current => {
      if (!current) throw new Error("mutate cannot be null")
      
      const currentItems = current.data
      currentItems.push(response.data)
      return {
        ...current,
        data: currentItems
      }
    })
  };

  const handleOnDeleteChecklistItem = (checklistItemId: number) => {
    mutate((current) => {
        if (!current) throw new Error("On mutate current cannot be null")
        const items = current?.data;

        const newItemsList = items.filter(i => i.id != checklistItemId)

        return {
          ...current,
          data: newItemsList
        }
      })
    }

  const handleChecklistItemUpdate = async (updatedChecklistItem: ChecklistItemResponse) => {
   const response = await updateChecklistItemBychecklistIdAndItemId(
      checklist.id,
      updatedChecklistItem.id,
      updatedChecklistItem,
      axiousProps
    )

    mutate((current) => {
       if (!current) throw new Error("Cannot mutate checklist items list response when response is null");

      const updatedItems =  current.data.map(item => response.data.id === item.id ?
          response.data : item
       )
       return {
        ...current,
        data: updatedItems
       }
    }, {revalidate: false})
  }

  const handleFormSubmit = (text: string) => {
    setNewChecklistItemName(text);
  //  setItemQuantity(undefined);
  //  setRows([]);
    setIsAddItemModalOpen(true);
  };

  const handleTemplateSelect = (item: PredefinedChecklistItem) => {
    setNewChecklistItemName(item.text);
   // setItemQuantity(item.quantity);
   // setRows(item.subItems);
   // setIsAddItemModalOpen(true);
  }

   const items = isLoading || error != null ? [] : data!.data
  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <h2 className="text-2xl font-bold font-headline">{checklist.name}</h2>
          <Button variant="ghost" size="icon" onClick={() => {}} aria-label="Delete checklist">
            <Trash2 className="h-5 w-5 text-muted-foreground" />
          </Button>
        </CardHeader>
        <CardContent className="pt-2 pb-4 flex-grow">
          <div className="pb-4 border-b mb-4">
            <AddItemForm onFormSubmit={handleFormSubmit} onTemplateSelect={handleTemplateSelect} />
          </div>
          <Droppable droppableId={String(checklist.id)} type="items">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 min-h-[10px] w-full"
              >
                {items.map((row: ChecklistItemResponse, index: number) => (
                  <Draggable  key={row.id} draggableId={String(row.id)} index={index}>
                    {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "w-full rounded-md border p-2 bg-card transition-shadow flex flex-col gap-2",
                                snapshot.isDragging && "shadow-lg scale-105"
                              )}
                              >
                           <div id="test" className="flex items-start gap-3 w-full">
             <div
              className="flex items-center pt-1 w-full"
              {...provided.dragHandleProps}
            > 
                  <ChecklistItemComponent
                      item={row}
                      index={index}
                      checklistId={checklist.id}
                      onChecklistItemUpdate={handleChecklistItemUpdate}
                      onHandleChecklistItemDelete={(checklistItem: ChecklistItemResponse) => handleOnDeleteChecklistItem(checklistItem.id)}
                  />
                  </div>
                  </div>
                          </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {items.length === 0 && (
                     <p className="text-muted-foreground text-center py-4">No items in this checklist yet.</p>
                )}
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>

     <AddItemModal 
        isOpen={isAddItemModalOpen}
        initialChecklistItemName={newChecklistItemName}
        onClose={() => setIsAddItemModalOpen(false)}
        onAddItem={handleAddItem}
      />
    </>
  );
}
);
