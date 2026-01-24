"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import { Plus, Trash2, Check, X, ChevronRight } from "lucide-react";
import { ChecklistItem, ChecklistItemRow } from "@/components/shared/types";
import { CheckedState } from "@radix-ui/react-checkbox";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { useTranslation } from "react-i18next";

type ChecklistItemProps = {
  item: ChecklistItem;
  checklistId: number;
  updateItem: (item: ChecklistItem) => Promise<void>;
  addRow: (itemId: number | null, row: ChecklistItemRow) => Promise<void>;
  deleteItem: (itemId: number | null) => Promise<void>;
  deleteRow: (itemId: number | null, rowId: number | null) => Promise<void>;
  toggleCompletion: (itemId: number | null) => Promise<void>;
};

export function ChecklistItemComponent({
  item,
  addRow,
  updateItem,
  deleteItem,
  deleteRow,
  toggleCompletion,
}: ChecklistItemProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const [newSubItemText, setNewSubItemText] = useState("");
  const [newSubItemQuantity, setNewSubItemQuantity] = useState("");

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [titleEditValue, setTitleEditValue] = useState(item.name);
  const [rowEditValue, setRowEditValue] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const rowInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressDuration = 500; // ms

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

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
      setNewSubItemText("");
      setNewSubItemQuantity("");
      await addRow(item.id, newItemRow);
    }
  };

  const handleItemCompleted = async (checked: boolean) => {
    if (!item.id) return;

    if (item.rows && item.rows.length > 0) {
      const updatedRows = item.rows.map((row) => ({ ...row, completed: checked }));
      const updatedItem: ChecklistItem = {
        ...item,
        completed: checked,
        rows: updatedRows,
      };
      await updateItem(updatedItem);
    } else {
      await toggleCompletion(item.id);
    }
  };

  const handleRowCompleted = async (
    rowItem: ChecklistItemRow,
    checked: boolean
  ) => {
    if (!rowItem.id || rowItem.id <= 0) {
      console.warn("Cannot toggle completion for row without valid ID:", rowItem);
      return;
    }

    const updatedRow = { ...rowItem, completed: checked };
    const updatedRows = (item.rows ?? []).map((row) =>
      row.id === updatedRow.id ? updatedRow : row
    );

    const allRowsAreDone = updatedRows.filter((rows) => !rows.completed).length === 0;
    const anyRowsUndone = updatedRows.some((rows) => !rows.completed);

    const updatedChecklistItem: ChecklistItem = {
      ...item,
      completed: allRowsAreDone
        ? true
        : anyRowsUndone && item.completed
        ? false
        : item.completed,
      rows: updatedRows,
    };

    await updateItem(updatedChecklistItem);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startTitleEdit = () => {
    setTitleEditValue(item.name);
    setIsEditingTitle(true);
  };

  const handleTitleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      startTitleEdit();
    }, longPressDuration);
  };

  const handleTitleTouchEnd = () => {
    clearLongPress();
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
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitleEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelTitleEdit();
    }
  };

  const startRowEdit = (row: ChecklistItemRow) => {
    setRowEditValue(row.name);
    setEditingRowId(row.id);
  };

  const handleRowTouchStart = (row: ChecklistItemRow) => {
    longPressTimerRef.current = setTimeout(() => {
      startRowEdit(row);
    }, longPressDuration);
  };

  const handleRowTouchEnd = () => {
    clearLongPress();
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
    if (e.key === "Enter") {
      e.preventDefault();
      saveRowEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRowEdit();
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 w-full min-h-[44px] rounded-lg transition-colors",
        item._sseHighlight && "animate-sse-highlight"
      )}
    >
      {/* Custom checkbox with satisfying animation */}
      <div className="flex items-center pt-0.5">
        <button
          onClick={() => handleItemCompleted(!item.completed)}
          className={cn(
            "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 touch-manipulation",
            item.completed
              ? "bg-primary border-primary"
              : "border-border hover:border-primary/50 bg-transparent"
          )}
          aria-label={`Mark item ${item.name} as complete`}
        >
          {item.completed && (
            <svg
              className="w-4 h-4 text-primary-foreground animate-check"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Collapsible Container */}
      <Collapsible
        open={expanded}
        onOpenChange={(checkedState) => setExpanded(checkedState as boolean)}
        className="flex-grow"
      >
        {/* Title Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-grow">
            {/* Expand/Collapse Button */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 touch-manipulation text-muted-foreground hover:text-foreground"
                aria-label={
                  expanded ? "Collapse checklist item" : "Expand checklist item"
                }
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    expanded && "rotate-90"
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            {/* Title content */}
            <div className="flex flex-col items-start gap-1.5 text-left flex-grow pt-1.5">
              {/* Desktop inline edit */}
              {isEditingTitle && !isMobile ? (
                <div
                  className="flex items-center gap-2 w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    ref={titleInputRef}
                    value={titleEditValue}
                    onChange={(e) => setTitleEditValue(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={saveTitleEdit}
                    className="h-9 text-base flex-grow"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={saveTitleEdit}
                    className="h-8 w-8 shrink-0"
                    aria-label="Save edit"
                  >
                    <Check className="h-4 w-4 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={cancelTitleEdit}
                    className="h-8 w-8 shrink-0"
                    aria-label="Cancel edit"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <span
                  className={cn(
                    "cursor-pointer sm:hover:text-primary transition-colors text-base leading-relaxed select-none",
                    item.completed && "line-through text-muted-foreground"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    startTitleEdit();
                  }}
                  onTouchStart={handleTitleTouchStart}
                  onTouchEnd={handleTitleTouchEnd}
                  onTouchMove={clearLongPress}
                >
                  {item.name}
                </span>
              )}

              {/* Subitems preview */}
              {!expanded && item.rows && item.rows.length > 0 && (
                <div className="flex flex-wrap gap-x-2 text-sm leading-relaxed text-muted-foreground pointer-events-none">
                  {item.rows.map((row, index) => (
                    <span
                      key={
                        row.id
                          ? `checklistItem-row-${row.id}`
                          : `checklistItem-row-temp-${index}`
                      }
                      className={cn(
                        row.completed && "line-through opacity-60"
                      )}
                    >
                      {row.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteItem(item.id)}
            aria-label="Delete item"
            className="h-9 w-9 shrink-0 touch-manipulation text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Expanded subitems content */}
        <CollapsibleContent>
          <div className="pl-1 pt-4 space-y-3">
            {item.rows?.map((row, index) => (
              <div
                key={row.id ?? `temp-${index}`}
                className="flex items-center justify-between group min-h-[40px]"
              >
                <div className="flex items-center gap-3 flex-grow">
                  {/* Sub-item checkbox */}
                  <button
                    onClick={() => handleRowCompleted(row, !row.completed)}
                    disabled={!row.id || row.id <= 0}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 touch-manipulation",
                      row.completed
                        ? "bg-primary border-primary"
                        : "border-border hover:border-primary/50 bg-transparent",
                      (!row.id || row.id <= 0) && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label={`Mark sub-item ${row.name} as complete`}
                  >
                    {row.completed && (
                      <svg
                        className="w-3 h-3 text-primary-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Editable row name */}
                  {editingRowId === row.id ? (
                    <div className="flex items-center gap-2 flex-grow">
                      <Input
                        ref={rowInputRef}
                        value={rowEditValue}
                        onChange={(e) => setRowEditValue(e.target.value)}
                        onKeyDown={handleRowKeyDown}
                        onBlur={saveRowEdit}
                        className="h-8 text-sm flex-grow border-none shadow-none bg-transparent px-0 focus-visible:ring-1 focus-visible:ring-primary"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={saveRowEdit}
                        className="h-7 w-7 shrink-0 touch-manipulation"
                        aria-label="Save edit"
                      >
                        <Check className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={cancelRowEdit}
                        className="h-7 w-7 shrink-0 touch-manipulation"
                        aria-label="Cancel edit"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className={cn(
                        "text-sm cursor-pointer sm:hover:text-primary transition-colors leading-relaxed select-none",
                        row.completed && "line-through text-muted-foreground"
                      )}
                      onClick={() => startRowEdit(row)}
                      onTouchStart={() => handleRowTouchStart(row)}
                      onTouchEnd={handleRowTouchEnd}
                      onTouchMove={clearLongPress}
                    >
                      {row.name}
                    </span>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteRow(item.id, row.id!)}
                  className="h-7 w-7 shrink-0 touch-manipulation text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  aria-label="Delete sub-item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            {/* New sub-item form */}
            <form onSubmit={handleAddRowItem} className="flex gap-2 pt-2">
              <Input
                value={newSubItemText}
                onChange={(e) => setNewSubItemText(e.target.value)}
                placeholder={t('item.addSubItem')}
                className="h-10 text-sm flex-grow touch-manipulation"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 touch-manipulation text-muted-foreground hover:text-primary hover:bg-primary/10"
                aria-label="Add sub-item"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Bottom Sheet for editing title - only on mobile */}
      {isMobile && (
        <Sheet open={isEditingTitle} onOpenChange={(open) => !open && cancelTitleEdit()}>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>{t('item.editTitle')}</SheetTitle>
              <SheetDescription>{t('item.editDescription')}</SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <Input
                ref={titleInputRef}
                value={titleEditValue}
                onChange={(e) => setTitleEditValue(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                placeholder={t('item.namePlaceholder')}
                className="h-12 text-lg w-full"
                autoFocus
              />
            </div>
            <SheetFooter className="flex-row gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={cancelTitleEdit}
                className="flex-1 h-12 touch-manipulation"
              >
                {t('item.cancel')}
              </Button>
              <Button
                onClick={saveTitleEdit}
                className="flex-1 h-12 touch-manipulation"
              >
                {t('item.save')}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
