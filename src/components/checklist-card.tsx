"use client";

import type { Checklist, ChecklistItem, SubItem } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { ChecklistItemComponent } from "@/components/checklist-item";
import { AddItemModal } from "@/components/add-item-modal";

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
  onReorderItems: (checklistId: string, draggedItemId: string, targetItemId: string) => void;
};

export function ChecklistCard({
  checklist,
  onDelete,
  onUpdateTitle,
  onAddItem,
  onReorderItems,
  ...itemHandlers
}: ChecklistCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleAddItem = (itemText: string, subItems: string[]) => {
    if (itemText.trim()) {
        onAddItem(checklist.id, itemText.trim(), subItems);
    }
  };

  const progress = checklist.items.length > 0
    ? (checklist.items.filter(item => item.checked).length / checklist.items.length) * 100
    : 0;

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
          <div className="w-full bg-muted rounded-full h-1.5 mb-4">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="space-y-2">
              {checklist.items.map((item) => (
                  <ChecklistItemComponent
                      key={item.id}
                      item={item}
                      checklistId={checklist.id}
                      onReorder={(draggedId, targetId) => onReorderItems(checklist.id, draggedId, targetId)}
                      {...itemHandlers}
                  />
              ))}
              {checklist.items.length === 0 && (
                   <p className="text-muted-foreground text-center py-4">No items in this checklist yet.</p>
              )}
          </div>
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
