
"use client";

import type { Checklist, ChecklistItem, SubItem } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { ChecklistItemComponent } from "@/components/checklist-item";
import { AddItemModal } from "@/components/add-item-modal";
import { Droppable } from "@hello-pangea/dnd";
import { AddItemForm } from "@/components/add-item-form";
import { PredefinedChecklistItem, PredefinedSubItem } from "@/lib/knowledge-base";


type ChecklistCardProps = {
  checklist: Checklist;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onAddItem: (checklistId: string, text: string, quantity: number | undefined, subItems: PredefinedSubItem[]) => void;
  onDeleteItem: (checklistId: string, itemId: string) => void;
  onUpdateItem: (checklistId: string, item: ChecklistItem) => void;
  onAddSubItem: (checklistId: string, itemId: string, text: string, quantity: number | undefined) => void;
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
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [itemText, setItemText] = useState("");
  const [itemQuantity, setItemQuantity] = useState<number | undefined>();
  const [subItems, setSubItems] = useState<PredefinedSubItem[]>([]);

  const handleAddItem = (itemText: string, quantity: number | undefined, subItems: PredefinedSubItem[]) => {
    if (itemText.trim()) {
        onAddItem(checklist.id, itemText.trim(), quantity, subItems);
    }
  };

  const handleFormSubmit = (text: string) => {
    setItemText(text);
    setItemQuantity(undefined);
    setSubItems([]);
    setIsAddItemModalOpen(true);
  };

  const handleTemplateSelect = (item: PredefinedChecklistItem) => {
    setItemText(item.text);
    setItemQuantity(item.quantity);
    setSubItems(item.subItems);
    setIsAddItemModalOpen(true);
  }


  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <h2 className="text-2xl font-bold font-headline">{checklist.title}</h2>
          <Button variant="ghost" size="icon" onClick={() => onDelete(checklist.id)} aria-label="Delete checklist">
            <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
          </Button>
        </CardHeader>
        <CardContent className="pb-4 flex-grow">
          <div className="pb-4 border-b mb-4">
            <AddItemForm onFormSubmit={handleFormSubmit} onTemplateSelect={handleTemplateSelect} />
          </div>
          <Droppable droppableId={checklist.id} type="item">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 min-h-[10px]"
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
      </Card>

      <AddItemModal 
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onAddItem={handleAddItem}
        initialText={itemText}
        initialQuantity={itemQuantity}
        initialSubItems={subItems}
      />
    </>
  );
}
