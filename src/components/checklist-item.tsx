
"use client";

import type { Item, SubItem } from "@/lib/api";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Draggable } from "@hello-pangea/dnd";

type ChecklistItemProps = {
  item: Item;
  index: number;
  checklistId: string;
  onDeleteItem: (checklistId: string, itemId: string) => void;
  onUpdateItem: (checklistId: string, item: Item) => void;
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
        onAddSubItem(checklistId, item.itemId, newSubItemText.trim(), quantity);
        setNewSubItemText("");
        setNewSubItemQuantity("");
    }
  };

  const handleToggleSubItemChecked = (subItem: SubItem, checked: boolean) => {
    const updatedSubItem = { ...subItem, checked };
    onUpdateSubItem(checklistId, item.itemId, updatedSubItem);
  }

  return (
    <Draggable draggableId={item.itemId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "rounded-md border p-2 bg-card transition-shadow flex flex-col gap-2",
            snapshot.isDragging && "shadow-lg scale-105"
          )}
        >
          <div className="flex items-start gap-3">
             <div
              className="flex items-center pt-1"
              {...provided.dragHandleProps}
            >
              <Checkbox
                id={item.itemId}
                checked={item.checked}
                onCheckedChange={handleToggleChecked}
                className="h-5 w-5 shrink-0"
                aria-label={`Mark item ${item.text} as complete`}
              />
            </div>
            <Collapsible
              open={!item.isCollapsed}
              onOpenChange={handleToggleCollapse}
              className="flex-grow"
            >
              <div className="flex items-start justify-between gap-2">
                <CollapsibleTrigger asChild>
                  <div
                    className="flex flex-col items-start gap-2 text-left flex-grow cursor-pointer pt-0.5"
                  >
                    <span className={cn("flex-grow", item.checked && "line-through text-muted-foreground")}>
                      {item.text}
                      {item.quantity && <span className="text-xs text-muted-foreground ml-1.5"> (x{item.quantity})</span>}
                    </span>
                    {item.isCollapsed && item.subItems && item.subItems.length > 0 && (
                      <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground pointer-events-none">
                        {item.subItems.map((sub, index) => (
                          <span key={sub.subItemId} className={cn(sub.checked && "line-through")}>
                            {sub.text}{sub.quantity ? <span className="text-xs"> (x{sub.quantity})</span> : ''}{index < item.subItems.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleTrigger>
                <Button variant="ghost" size="icon" onClick={() => onDeleteItem(checklistId, item.itemId)} aria-label="Delete item" className="h-8 w-8 shrink-0">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <CollapsibleContent>
                <div className="pl-1 pt-2 space-y-2">
                  {item.subItems && item.subItems.map((subItem) => {
                    return (
                      <div key={subItem.subItemId} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={subItem.subItemId}
                            checked={subItem.checked}
                            onCheckedChange={(checked) => handleToggleSubItemChecked(subItem, checked as boolean)}
                            className="h-4 w-4"
                            aria-label={`Mark sub-item ${subItem.text} as complete`}
                          />
                          <label htmlFor={subItem.subItemId} className={cn("text-sm", subItem.checked && "line-through text-muted-foreground")}>
                            {subItem.text}
                            {subItem.quantity && <span className="text-xs text-muted-foreground ml-1"> (x{subItem.quantity})</span>}
                          </label>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onDeleteSubItem(checklistId, item.itemId, subItem.subItemId)} className="h-7 w-7" aria-label="Delete sub-item">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
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
          </div>
        </div>
      )}
    </Draggable>
  );
}
