"use client";

import type { Checklist, ChecklistItem, SubItem } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { ChecklistItemComponent } from "@/components/checklist-item";

type ChecklistCardProps = {
  checklist: Checklist;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onAddItem: (checklistId: string, text: string) => void;
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
  const [newItemText, setNewItemText] = useState("");
  
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
        onAddItem(checklist.id, newItemText.trim());
        setNewItemText("");
    }
  };

  const progress = checklist.items.length > 0
    ? (checklist.items.filter(item => item.checked).length / checklist.items.length) * 100
    : 0;

  return (
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
                    {...itemHandlers}
                />
            ))}
            {checklist.items.length === 0 && (
                 <p className="text-muted-foreground text-center py-4">No items in this checklist yet.</p>
            )}
        </div>
      </CardContent>
      <CardFooter>
         <form onSubmit={handleAddItem} className="w-full flex gap-2">
            <Input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add a new item..."
                className="text-sm"
            />
            <Button type="submit" variant="outline" size="icon" aria-label="Add item">
                <Plus className="h-4 w-4"/>
            </Button>
         </form>
      </CardFooter>
    </Card>
  );
}
