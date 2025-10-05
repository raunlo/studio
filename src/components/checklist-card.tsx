
"use client";

import {cn} from "@/lib/utils"
import { forwardRef, useState, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { ChecklistItemComponent } from "@/components/checklist-item";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { AddItemForm } from "@/components/add-item-form";
import { ChecklistResponse } from "@/api/checklistServiceV1.schemas";
import { ChecklistCardHandle, ChecklistItem } from "@/components/shared/types";
import { useChecklist } from "@/hooks/use-checklist";


type ChecklistCardProps = {
  checklist: ChecklistResponse;
};

export const ChecklistCard = forwardRef<ChecklistCardHandle, ChecklistCardProps>(
  ({ checklist }, ref): JSX.Element => {
  const { 
    items, 
    addItem, 
    reorderItem,
    deleteRow: deleteRowFn,
    updateItem: updateItemFn,
    addRow: addRowFn,
    deleteItem: deleteItemFn,
    toggleCompletion
   } = useChecklist(checklist.id, { refreshInterval: 10000 });

  useImperativeHandle(ref, () => ({
      async handleReorder(from, to) {
        await reorderItem(from, to);
      },
    }));


  const handleAddItem = async (checklistItem: ChecklistItem) => {
    await addItem(checklistItem);
  };

  const handleFormSubmit = async (checklistItemName: string) => {
      const checklistItem: ChecklistItem = {
        completed: false,
        name: checklistItemName,
        id: null,
        orderNumber: null,
        rows: []
      }
     await addItem(checklistItem);
  };

  const handleAddTemplateItems = async (items: { name: string, rows: { name: string }[] }[]) => {
    for (const item of items) {
      const checklistItem: ChecklistItem = {
        completed: false,
        name: item.name,
        id: null,
        orderNumber: null,
        rows: item.rows.map(row => ({ id: null, name: row.name, completed: false }))
      };
      await addItem(checklistItem);
    }
  };

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <h2 className="text-2xl font-bold font-headline">{checklist.name}</h2>
        </CardHeader>
        <CardContent className="pt-2 pb-4 flex-grow">
          <div className="pb-4 border-b mb-4">
            <AddItemForm onFormSubmit={handleFormSubmit} onAddTemplateItems={handleAddTemplateItems} />
          </div>
          <Droppable droppableId={String(checklist.id)} type="items">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 min-h-[10px] w-full"
              >
                {items.map((item: ChecklistItem, index: number) => (
                  <Draggable  key={item.id ? `checklistItem-${item.id}` :`checklistItem-temp-${index}`} draggableId={item.id ? String(item.id) : `temp-${index}`} index={index}>
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
                      item={item}
                      checklistId={checklist.id}
                      deleteRow={deleteRowFn}
                      updateItem={updateItemFn}
                      addRow={addRowFn}
                      deleteItem={deleteItemFn}
                      toggleCompletion={toggleCompletion}
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
    </>
  );
}
);
