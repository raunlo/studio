"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, Edit2, Check, X, ChevronRight } from "lucide-react";
import { ChecklistItem, ChecklistItemRow } from "@/components/shared/types";
import { CheckedState } from "@radix-ui/react-checkbox";

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
  
  // Edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [titleEditValue, setTitleEditValue] = useState(item.name);
  const [rowEditValue, setRowEditValue] = useState("");
  
  // Refs for auto-focus
  const titleInputRef = useRef<HTMLInputElement>(null);
  const rowInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);
  
  useEffect(() => {
    if (editingRowId && rowInputRef.current) {
      rowInputRef.current.focus();
      rowInputRef.current.select();
    }
  }, [editingRowId]);

  const handleAddRowItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRowName = newSubItemText.trim();
    if (newRowName) {
      const newItemRow: ChecklistItemRow = {
        id: null,
        name: newRowName,
        completed: false,
      };
      // Clear input immediately for better UX
      setNewSubItemText("");
      setNewSubItemQuantity("");
      
      // Add row with optimistic update already handled in hook
      await addRow(item.id, newItemRow);
    }
  };

  const handleItemCompleted = async (checked: boolean) => {
    if (!item.id) return;
    
    // If checking main item as completed, mark all sub-items as completed
    // If unchecking main item, mark all sub-items as uncompleted
    if (item.rows && item.rows.length > 0) {
      const updatedRows = item.rows.map(row => ({ ...row, completed: checked }));
      const updatedItem: ChecklistItem = {
        ...item,
        completed: checked,
        rows: updatedRows
      };
      
      // Update the item with all sub-items synced
      await updateItem(updatedItem);
    } else {
      // No sub-items, just toggle the main item
      await toggleCompletion(item.id);
    }
  };

  const handleRowCompleted = async (rowItem: ChecklistItemRow, checked: boolean) => {
    const updatedRow = { ...rowItem, completed: checked };
    const updatedRows = (item.rows ?? [])
      .map((row) => (row.id === updatedRow.id ? updatedRow : row));
    
    // Check if all sub-items are completed to auto-complete the main item
    const allRowsAreDone = updatedRows.filter((rows) => !rows.completed).length === 0;
    const anyRowsUndone = updatedRows.some((rows) => !rows.completed);
    
    const updatedChecklistItem: ChecklistItem = {
      ...item,
      // Auto-complete main item if all sub-items are done
      // Auto-uncomplete main item if any sub-item is undone (only if main was completed)
      completed: allRowsAreDone ? true : (anyRowsUndone && item.completed ? false : item.completed),
      rows: updatedRows,
    };

    await updateItem(updatedChecklistItem);
  }

  // Title editing functions
  const startTitleEdit = () => {
    setTitleEditValue(item.name);
    setIsEditingTitle(true);
  };

  const saveTitleEdit = async () => {
    const trimmedValue = titleEditValue.trim();
    if (trimmedValue && trimmedValue !== item.name) {
      const updatedItem = { ...item, name: trimmedValue };
      await updateItem(updatedItem);
    }
    setIsEditingTitle(false);
  };

  const cancelTitleEdit = () => {
    setTitleEditValue(item.name);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitleEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelTitleEdit();
    }
  };

  // Row editing functions
  const startRowEdit = (row: ChecklistItemRow) => {
    setRowEditValue(row.name);
    setEditingRowId(row.id);
  };

  const saveRowEdit = async () => {
    const trimmedValue = rowEditValue.trim();
    if (trimmedValue && editingRowId) {
      const updatedRows = (item.rows ?? []).map((row) =>
        row.id === editingRowId ? { ...row, name: trimmedValue } : row
      );
      const updatedItem = { ...item, rows: updatedRows };
      await updateItem(updatedItem);
    }
    setEditingRowId(null);
  };

  const cancelRowEdit = () => {
    setEditingRowId(null);
    setRowEditValue("");
  };

  const handleRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveRowEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRowEdit();
    }
  };

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
      <div className="flex items-start gap-2 flex-grow">
        {/* Expand/Collapse Button */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 mt-0.5"
            aria-label={expanded ? "Collapse checklist item" : "Expand checklist item"}
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-90")} />
          </Button>
        </CollapsibleTrigger>
        
        {/* Title content */}
        <div className="flex flex-col items-start gap-2 text-left flex-grow pt-0.5">
          {/* Editable title */}
          {isEditingTitle ? (
            /* Prevent event bubbling so the collapsible trigger does not fire when interacting with edit controls */
            <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
              <Input
                ref={titleInputRef}
                value={titleEditValue}
                onChange={(e) => setTitleEditValue(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={saveTitleEdit}
                className="h-8 text-sm flex-grow border-none shadow-none bg-transparent px-0 focus-visible:ring-1 focus-visible:ring-primary"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={saveTitleEdit}
                className="h-7 w-7 shrink-0"
                aria-label="Save edit"
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelTitleEdit}
                className="h-7 w-7 shrink-0"
                aria-label="Cancel edit"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <span 
              className={cn("cursor-pointer hover:text-primary transition-colors", item.completed && "line-through text-muted-foreground")}
              onClick={(e) => {
                // Prevent event bubbling so the collapsible trigger does not fire when clicking to edit
                e.stopPropagation();
                startTitleEdit();
              }}
              title="Click to edit"
            >
              {item.name}
            </span>
          )}

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
      </div>

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
            <div className="flex items-center gap-3 flex-grow">
              <Checkbox
                id={String(row.id ?? `temp-${index}`)}
                checked={row.completed as CheckedState}
                onCheckedChange={(checked) => handleRowCompleted(row, checked as boolean)}
                className="h-4 w-4 shrink-0"
                aria-label={`Mark sub-item ${row.name} as complete`}
              />
              
              {/* Editable row name */}
              {editingRowId === row.id ? (
                <div className="flex items-center gap-2 flex-grow">
                  <Input
                    ref={rowInputRef}
                    value={rowEditValue}
                    onChange={(e) => setRowEditValue(e.target.value)}
                    onKeyDown={handleRowKeyDown}
                    onBlur={saveRowEdit}
                    className="h-7 text-sm flex-grow border-none shadow-none bg-transparent px-0 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={saveRowEdit}
                    className="h-6 w-6 shrink-0"
                    aria-label="Save edit"
                  >
                    <Check className="h-3 w-3 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={cancelRowEdit}
                    className="h-6 w-6 shrink-0"
                    aria-label="Cancel edit"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <span
                  className={cn("text-sm cursor-pointer hover:text-primary transition-colors", row.completed && "line-through text-muted-foreground")}
                  onClick={() => startRowEdit(row)}
                  title="Click to edit"
                >
                  {row.name}
                </span>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteRow(item.id, row.id!)}
              className="h-7 w-7 shrink-0"
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
