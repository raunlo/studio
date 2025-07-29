
"use client";

import type { Checklist, ChecklistItem, SubItem } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { ChecklistItemComponent } from "@/components/checklist-item";
import { AddItemModal } from "@/components/add-item-modal";
import { Droppable, Draggable } from "@hello-pangea/dnd";


type ChecklistCardProps = {
  checklist: Checklist;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onAddItem: (checklistId: string, text: string, subItems: string[]) => void;
  onDeleteItem: (checklistId: string, itemId: string) => void;
  onUpdateItem: (checklistId: string, item: ChecklistItem) => void;
  onAddSubItem: (checklistId: string, itemId: string, text: string) => void;
  onDeleteSubItem: (checklistId: string, itemId: string, subItemId: string) => void;
  onUpdateSubItem: (checklistId: string, itemId: string, subItem: SubItem) => void;
};

export function ChecklistCard({
  checklist,
  onDelete,
  onUpdateTitle,
  onAddItem,
  ...itemHandlers
}: ChecklistCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleAddItem = (itemText: string, subItems: string[]) => {
    if (itemText.trim()) {
        onAddItem(checklist.id, itemText.trim(), subItems);
    }
  };

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h2 className="text-2xl font-bold font-headline">{checklist.title}</h2>
          <Button variant="ghost" size="icon" onClick={() => onDelete(checklist.id)} aria-label="Delete checklist">
            <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
          </Button>
        </CardHeader>
        <CardContent className="pb-4">
          <Droppable droppableId={checklist.id} type="item">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {checklist.items.map((item, index) => (
                  <ChecklistItemComponent
                      key={item.id}
                      item={item}
                      index={index}
                      checklistId={checklist.id}
                      {...itemHandlers}
                  />
                ))}
                {provided.placeholder}
                {checklist.items.length === 0 && (
                     <p className="text-muted-foreground text-center py-4">No items in this checklist yet.</p>
                )}
              </div>
            )}
          </Droppable>
        </CardContent>
        <CardFooter>
           <Button onClick={() => setIsModalOpen(true)} className="w-full" variant="outline">
             <Plus className="mr-2 h-4 w-4" /> Add Item
           </Button>
        </CardFooter>
      </Card>
      <AddItemModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddItem={handleAddItem}
      />
    </>
  );
}
