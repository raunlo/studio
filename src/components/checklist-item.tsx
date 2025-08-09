"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2 } from "lucide-react";
import {ChecklistItemResponse, ChecklistItemRowResponse, UpdateChecklistItemRequest} from "@/api/checklistServiceV1.schemas"
import { CheckedState } from "@radix-ui/react-checkbox";
import { deleteChecklistItemById, createChecklistItemRow, updateChecklistItemBychecklistIdAndItemId, deleteChecklistItemRow } from "@/api/checklist-item/checklist-item"
import { axiousProps } from "@/lib/axios";
import { it } from "node:test";

type ChecklistItemProps = {
  item: ChecklistItemResponse;
  checklistId: number;
  onChecklistItemUpdate: (checklistITem: ChecklistItemResponse) => void;
  onHandleChecklistItemDelete: (checklistItem: ChecklistItemResponse) => void 
};

export function ChecklistItemComponent({
  item,
  checklistId,
  onChecklistItemUpdate,
  onHandleChecklistItemDelete
}: ChecklistItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [newSubItemText, setNewSubItemText] = useState("");
  const [newSubItemQuantity, setNewSubItemQuantity] = useState("");
  const rowsSortFn = (a: ChecklistItemRowResponse, b: ChecklistItemRowResponse) => {return Number(a.completed) - Number(b.completed)}
  const updateItem = async (item: UpdateChecklistItemRequest) =>  {
      await updateChecklistItemBychecklistIdAndItemId(
      checklistId,
      item.id,
      item,
      axiousProps
    )
  }

  const handleAddRowItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRowName = newSubItemText.trim()
    if(newRowName) {
     const newItemRow =  {
        name: newRowName,
        completed: false
      }
        const quantity = newSubItemQuantity ? parseInt(newSubItemQuantity) : undefined;
        setNewSubItemText("");
        setNewSubItemQuantity("");

      item.rows.push({
        id: 0,
        name: newItemRow.name,
        completed: newItemRow.completed,
      })
      item.rows.sort(rowsSortFn)
      onChecklistItemUpdate(item)
       await createChecklistItemRow(
          checklistId,
          item.id,
          newItemRow,
          axiousProps
      ) 
    }
  };

  const handleItemCompleted = async (checked: Boolean) => {
      let updatedChecklistItem = {...item, completed: checked} as ChecklistItemResponse
      const rows = updatedChecklistItem.rows ?? []
      const updatedRows = rows.map((row) =>
          ({...row, completed: checked}) as ChecklistItemRowResponse
      )
      updatedChecklistItem = { 
        ...updatedChecklistItem,
        rows: updatedRows
      }

      onChecklistItemUpdate(updatedChecklistItem)

      await updateItem(updatedChecklistItem)
  }

  const deleteRow = async (rowId : number) => {
    item.rows = item.rows.filter(row => row.id !== rowId)
    onChecklistItemUpdate(item)
    await deleteChecklistItemRow(
        checklistId,
        item.id,
        rowId,
        axiousProps
    )
  }

  const handleRowCompleted = async (rowItem: ChecklistItemRowResponse, checked: boolean) => {
    const updatedRow = { ...rowItem, completed: checked };
     const updatedRows = item.rows.map(row => row.id === updatedRow.id ? updatedRow : row)
        .sort(rowsSortFn)
      const allRowsAreDone = updatedRows.filter(rows => !rows.completed).length === 0
      const updatedChecklistItem = {
        ...item,
        completed: allRowsAreDone ? true : false,
        rows: updatedRows 
      }
      onChecklistItemUpdate(updatedChecklistItem)

      await updateItem(updatedChecklistItem)
  }

  return (
    <div className="flex items-start gap-3 w-full">
  {/* Drag handle + Checkbox */}
  <div className="flex items-center pt-1">
    <Checkbox
      id={String(item.id)}
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
          {!expanded && item.rows?.length > 0 && (
            <div className="flex flex-wrap gap-x-2 text-sm italic text-muted-foreground pointer-events-none">
              {item.rows.map((row, index) => (
                <span key={row.id ?? `temp-${index}`} className={cn(row.completed && "line-through")}>
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
        onClick={() =>  onHandleChecklistItemDelete(item)}
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
                id={String(row.id)}
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
              onClick={() => deleteRow(row.id)}
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
