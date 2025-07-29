"use client";

import type { ChecklistItem, SubItem } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ChecklistItemProps = {
  item: ChecklistItem;
  checklistId: string;
  onDeleteItem: (checklistId: string, itemId: string) => void;
  onUpdateItem: (checklistId: string, item: ChecklistItem) => void;
  onAddSubItem: (checklistId: string, itemId: string, text: string) => void;
  onDeleteSubItem: (checklistId: string, itemId: string, subItemId: string) => void;
  onUpdateSubItem: (checklistId: string, itemId: string, subItem: SubItem) => void;
  onReorder: (draggedItemId: string, targetItemId: string) => void;
};

export function ChecklistItemComponent({
  item,
  checklistId,
  onDeleteItem,
  onUpdateItem,
  onAddSubItem,
  onDeleteSubItem,
  onUpdateSubItem,
  onReorder,
}: ChecklistItemProps) {
  const [newSubItemText, setNewSubItemText] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout>();
  const collapsibleTriggerRef = useRef<HTMLButtonElement>(null);


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
        onAddSubItem(checklistId, item.id, newSubItemText.trim());
        setNewSubItemText("");
    }
  };

  const handleToggleSubItemChecked = (subItem: SubItem, checked: boolean) => {
    const updatedSubItem = { ...subItem, checked };
    onUpdateSubItem(checklistId, item.id, updatedSubItem);
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.effectAllowed = "move";
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedItemId = e.dataTransfer.getData("text/plain");
    if (draggedItemId && draggedItemId !== item.id) {
        onReorder(draggedItemId, item.id);
    }
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  
  const handlePointerDown = () => {
    pressTimer.current = setTimeout(() => {
        setIsDraggable(true);
    }, 300); // 300ms for long press
  };

  const handlePointerUp = () => {
    clearTimeout(pressTimer.current);
    if (!isDraggable) {
      // This was a click, not a long press for dragging
      collapsibleTriggerRef.current?.click();
    }
    // Reset draggable state after any interaction ends
    setTimeout(() => setIsDraggable(false), 0);
  };

  const handlePointerMove = () => {
    // Cancel long press if mouse moves
    clearTimeout(pressTimer.current);
  };
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearTimeout(pressTimer.current);
    };
  }, []);


  return (
    <div 
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
            "rounded-md border p-2 space-y-2 bg-card transition-all",
            isDraggingOver && "border-primary border-dashed ring-2 ring-primary",
            isDraggable && "opacity-50 shadow-lg cursor-grabbing"
        )}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
    >
        <Collapsible open={!item.isCollapsed} onOpenChange={handleToggleCollapse}>
        <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-grow cursor-pointer">
              <Checkbox
                  id={item.id}
                  checked={item.checked}
                  onCheckedChange={handleToggleChecked}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  className={cn("h-5 w-5 mt-0.5", item.checked && "data-[state=checked]:bg-accent data-[state=checked]:border-accent-foreground")}
                  aria-label={`Mark item ${item.text} as complete`}
              />
              <CollapsibleTrigger asChild ref={collapsibleTriggerRef}>
                  <button className="flex flex-col items-start gap-2 text-left flex-grow" tabIndex={-1}>
                    <span className={cn("flex-grow", item.checked && "line-through text-muted-foreground")}>
                        {item.text}
                    </span>
                    {item.subItems.length > 0 && (
                      <div className="flex flex-wrap gap-x-2 text-xs italic text-muted-foreground">
                        {item.subItems.map((sub, index) => (
                          <span key={sub.id} className={cn(sub.checked && "line-through")}>
                            {sub.text}{index < item.subItems.length - 1 ? ',' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
              </CollapsibleTrigger>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onDeleteItem(checklistId, item.id)} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} aria-label="Delete item">
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
        </div>
        <CollapsibleContent>
            <div className="pl-12 pt-2 space-y-2">
                {item.subItems.map((subItem) => (
                    <div key={subItem.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id={subItem.id}
                                checked={subItem.checked}
                                onCheckedChange={(checked) => handleToggleSubItemChecked(subItem, checked as boolean)}
                                className={cn("h-4 w-4", subItem.checked && "data-[state=checked]:bg-accent data-[state=checked]:border-accent-foreground")}
                                aria-label={`Mark sub-item ${subItem.text} as complete`}
                            />
                            <label htmlFor={subItem.id} className={cn("text-sm", subItem.checked && "line-through text-muted-foreground")}>
                                {subItem.text}
                            </label>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onDeleteSubItem(checklistId, item.id, subItem.id)} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete sub-item">
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                    </div>
                ))}
                <form onSubmit={handleAddSubItem} className="flex gap-2 pt-2">
                    <Input
                        value={newSubItemText}
                        onChange={(e) => setNewSubItemText(e.target.value)}
                        placeholder="Add a sub-item..."
                        className="h-8 text-sm"
                    />
                    <Button type="submit" variant="ghost" size="icon" className="h-8 w-8" aria-label="Add sub-item">
                        <Plus className="h-4 w-4"/>
                    </Button>
                </form>
            </div>
        </CollapsibleContent>
        </Collapsible>
    </div>
  );
}
