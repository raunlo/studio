
"use client";

import type { ChecklistItem, SubItem } from "@/lib/types";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Draggable } from "@hello-pangea/dnd";

type ChecklistItemProps = {
  item: ChecklistItem;
  index: number;
  checklistId: string;
  onDeleteItem: (checklistId: string, itemId: string) => void;
  onUpdateItem: (checklistId: string, item: ChecklistItem) => void;
  onAddSubItem: (checklistId: string, itemId: string, text: string, quantity: number | undefined) => void;
  onDeleteSubItem: (checklistId: string, itemId: string, subItemId: string) => void;
  onUpdateSubItem: (checklistId: string, itemId: string, subItem: SubItem) => void;
};

export function ChecklistItemComponent({
  item,
  index,
  checklistId,
  onDeleteItem,
  onUpdateItem,
  onAddSubItem,
  onDeleteSubItem,
  onUpdateSubItem,
}: ChecklistItemProps) {
  const [newSubItemText, setNewSubItemText] = useState("");
  const [newSubItemQuantity, setNewSubItemQuantity] = useState("");

  const handleToggleChecked = (checked: boolean) => {
    const updatedSubItems = item.subItems.map(sub => ({ ...sub, checked }));
    onUpdateItem(checklistId, { ...item, checked, subItems: updatedSubItems });
  };
  
  const handleToggleCollapse = (isOpen: boolean) => {
    onUpdateItem(checklistId, { ...item, isCollapsed: !isOpen });
  };

  const handleAddSubItem = (e: React.FormEvent) => {
    e.preventDefault();
    if(newSubItemText.trim()) {
        const quantity = newSubItemQuantity ? parseInt(newSubItemQuantity) : undefined;
        onAddSubItem(checklistId, item.id, newSubItemText.trim(), quantity);
        setNewSubItemText("");
        setNewSubItemQuantity("");
    }
  };

  const handleToggleSubItemChecked = (subItem: SubItem, checked: boolean) => {
    const updatedSubItem = { ...subItem, checked };
    onUpdateSubItem(checklistId, item.id, updatedSubItem);
  }

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <Collapsible 
          open={!item.isCollapsed} 
          onOpenChange={handleToggleCollapse}
          className={cn(
            "rounded-md border p-2 space-y-2 bg-card transition-shadow",
            snapshot.isDragging && "shadow-lg scale-105",
          )}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-grow">
                <Checkbox
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={handleToggleChecked}
                  className="h-5 w-5 mt-0.5"
                  aria-label={`Mark item ${item.text} as complete`}
                />

                <CollapsibleTrigger asChild>
                  <div className="flex flex-col items-start gap-2 text-left flex-grow" {...provided.dragHandleProps}>
                    <span className={cn("flex-grow", item.checked && "line-through text-muted-foreground")}>
                      {item.text}
                      {item.quantity && <span className="text-xs text-muted-foreground ml-1.5"> (x{item.quantity})</span>}
                    </span>
                    {item.subItems.length > 0 && (
                      <div className="flex flex-wrap gap-x-2 text-xs italic text-muted-foreground pointer-events-none">
                        {item.subItems.map((sub, index) => (
                          <span key={sub.id} className={cn(sub.checked && "line-through")}>
                            {sub.text}{sub.quantity ? <span className="text-xs"> (x{sub.quantity})</span> : ''}{index < item.subItems.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleTrigger>
              </div>
              
              <Button variant="ghost" size="icon" onClick={() => onDeleteItem(checklistId, item.id)} aria-label="Delete item" className="h-8 w-8">
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
            <CollapsibleContent>
              <div className="pl-8 pt-2 space-y-2">
                {item.subItems.map((subItem) => {
                   return (
                    <div key={subItem.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={subItem.id}
                          checked={subItem.checked}
                          onCheckedChange={(checked) => handleToggleSubItemChecked(subItem, checked as boolean)}
                          className="h-4 w-4"
                          aria-label={`Mark sub-item ${subItem.text} as complete`}
                        />
                        <label htmlFor={subItem.id} className={cn("text-sm", subItem.checked && "line-through text-muted-foreground")}>
                          {subItem.text}
                          {subItem.quantity && <span className="text-xs text-muted-foreground ml-1"> (x{subItem.quantity})</span>}
                        </label>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => onDeleteSubItem(checklistId, item.id, subItem.id)} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete sub-item">
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                   )
                })}
                <form onSubmit={handleAddSubItem} className="flex gap-2 pt-2">
                  <Input
                    value={newSubItemText}
                    onChange={(e) => setNewSubItemText(e.target.value)}
                    placeholder="Add a sub-item..."
                    className="h-8 text-sm flex-grow"
                  />
                   <Input
                    type="number"
                    value={newSubItemQuantity}
                    onChange={(e) => setNewSubItemQuantity(e.target.value)}
                    placeholder="Qty."
                    className="h-8 text-sm w-20"
                  />
                  <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Add sub-item">
                    <Plus className="h-4 w-4"/>
                  </Button>
                </form>
              </div>
            </CollapsibleContent>
        </Collapsible>
      )}
    </Draggable>
  );
}
