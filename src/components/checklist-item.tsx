"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2 } from "lucide-react";
import { ChecklistItem, ChecklistItemRow } from "@/components/shared/types";
import { CheckedState } from "@radix-ui/react-checkbox";
import { useChecklistItems } from "@/hooks/use-checklist";
import { useToggleChecklistItemComplete } from "@/api/checklist-item/checklist-item";

type ChecklistItemProps = {
  item: ChecklistItem;
  checklistId: number;
  updateItem: (item: ChecklistItem) => Promise<void>
  addRow: (itemId: number | null, row: ChecklistItemRow) => Promise<void>
  deleteItem: (itemId: number | null) => Promise<void>
  deleteRow: (itemId: number | null, rowId: number | null) => Promise<void>
  toggleCompletion: (itemId: number | null) => Promise<void>
};

export function ChecklistItemComponent({ item, addRow, updateItem, deleteItem, deleteRow, toggleCompletion }: ChecklistItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [newSubItemText, setNewSubItemText] = useState("");
  const [newSubItemQuantity, setNewSubItemQuantity] = useState("");
  
  const rowsSortFn = (
    a: ChecklistItemRow,
    b: ChecklistItemRow,
  ) => {
    return Number(a.completed) - Number(b.completed);
  };

  const handleAddRowItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRowName = newSubItemText.trim();
    if (newRowName) {
      const newItemRow: ChecklistItemRow = {
        id: null,
        name: newRowName,
        completed: false,
      };
      setNewSubItemText("");
      setNewSubItemQuantity("");
      await addRow(item.id, newItemRow);
    }
  };

  const handleItemCompleted = async (checked: boolean) => {
    if (!item.id) return;
    
    // Use toggle completion from umbrella hook
    await toggleCompletion(item.id);
  };

  const handleRowCompleted = async (rowItem: ChecklistItemRow, checked: boolean) => {
    const updatedRow = { ...rowItem, completed: checked };
    const updatedRows = (item.rows ?? [])
      .map((row) => (row.id === updatedRow.id ? updatedRow : row))
      .sort(rowsSortFn);
    const allRowsAreDone = updatedRows.filter((rows) => !rows.completed).length === 0;
    const updatedChecklistItem: ChecklistItem = {
      ...item,
      completed: allRowsAreDone ? true : false,
      rows: updatedRows,
    };

    await updateItem(updatedChecklistItem);
  }

  return (
    <div className="flex items-start gap-3 w-full">
  {/* Drag handle + Checkbox */}
  <div className="flex items-center pt-1">
    <Checkbox
      id={String(item.id ?? "temp")}
      checked={item.completed}
      onCheckedChange={(checked) => handleItemCompleted(checked as boolean)}
      className="h-5 w-5 shrink-0"
      aria-label={`Mark item ${item.name} as complete`}
    />
  </div>

  {/* Collapsible Container */}
  <Collapsible
    open={expanded}
    onOpenChange={(checkedState) => setExpanded(checkedState as boolean)}
    className="flex-grow"
  >
    {/* Title Row with trigger and delete button */}
    <div className="flex items-start justify-between gap-2">
      <CollapsibleTrigger asChild>
        <div className="flex flex-col items-start gap-2 text-left flex-grow cursor-pointer pt-0.5">
          <span className={cn("flex-grow", item.completed && "line-through text-muted-foreground")}>
            {item.name}
          </span>

          {/* Subitems preview (collapsed state only) */}
            {!expanded && item.rows && item.rows.length > 0 && (
              <div className="flex flex-wrap gap-x-2 text-sm italic text-muted-foreground pointer-events-none">
                {item.rows.map((row, index) => (
                <span key={row.id ? `checklistItem-row-${row.id}` : `checklistItem-row-temp-${index}`} className={cn(row.completed && "line-through")}>
                  {row.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </CollapsibleTrigger>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => deleteItem(item.id)}
        aria-label="Delete item"
        className="h-8 w-8 shrink-0"
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>

    {/* Expanded subitems content */}
    <CollapsibleContent>
      <div className="pl-1 pt-2 space-y-2">
          {item.rows?.map((row, index) => (
          <div key={row.id ?? `temp-${index}`} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <Checkbox
                id={String(row.id ?? `temp-${index}`)}
                checked={row.completed as CheckedState}
                onCheckedChange={(checked) => handleRowCompleted(row, checked as boolean)}
                className="h-4 w-4"
                aria-label={`Mark sub-item ${row.name} as complete`}
              />
              <label
                htmlFor={String(row.id)}
                className={cn("text-sm", row.completed && "line-through text-muted-foreground")}
              >
                {row.name}
              </label>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteRow(item.id, row.id!)}
              className="h-7 w-7"
              aria-label="Delete sub-item"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}

        {/* New sub-item form */}
        <form onSubmit={handleAddRowItem} className="flex gap-2 pt-2">
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
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="Add sub-item"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </CollapsibleContent>
  </Collapsible>
</div>
  );
}
