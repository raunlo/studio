'use client';

import { cn } from '@/lib/utils';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet';
import { Drawer } from 'vaul';
import { Plus, Trash2, Check, X, ChevronRight } from 'lucide-react';
import { ChecklistItem, ChecklistItemRow } from '@/components/shared/types';
import { CheckedState } from '@radix-ui/react-checkbox';
import { useIsMobile } from '@/lib/hooks/use-media-query';
import { useTranslation } from 'react-i18next';

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
  const [newSubItemText, setNewSubItemText] = useState('');
  const [newSubItemQuantity, setNewSubItemQuantity] = useState('');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [titleEditValue, setTitleEditValue] = useState(item.name);
  const [rowEditValue, setRowEditValue] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const mobileTitleInputRef = useRef<HTMLInputElement>(null);
  const rowInputRef = useRef<HTMLTextAreaElement>(null);
  const mobileRowInputRef = useRef<HTMLInputElement>(null);
  const subItemTextareaRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressDuration = 500; // ms

  // Auto-resize textarea
  const autoResize = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current && !isMobile) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle, isMobile]);

  // Auto-focus mobile drawer inputs after drawer animation completes
  useEffect(() => {
    if (isEditingTitle && isMobile && mobileTitleInputRef.current) {
      const timer = setTimeout(() => {
        mobileTitleInputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isEditingTitle, isMobile]);

  useEffect(() => {
    if (editingRowId && isMobile && mobileRowInputRef.current) {
      const timer = setTimeout(() => {
        mobileRowInputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [editingRowId, isMobile]);

  useEffect(() => {
    if (editingRowId && rowInputRef.current) {
      rowInputRef.current.focus();
      rowInputRef.current.select();
      autoResize(rowInputRef.current);
    }
  }, [editingRowId, autoResize]);

  const handleAddRowItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRowName = newSubItemText.trim();
    if (newRowName) {
      const newItemRow: ChecklistItemRow = {
        id: null,
        name: newRowName,
        completed: false,
      };
      setNewSubItemText('');
      setNewSubItemQuantity('');
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

  const handleRowCompleted = async (rowItem: ChecklistItemRow, checked: boolean) => {
    if (!rowItem.id || rowItem.id <= 0) {
      console.warn('Cannot toggle completion for row without valid ID:', rowItem);
      return;
    }

    const updatedRow = { ...rowItem, completed: checked };
    const updatedRows = (item.rows ?? []).map((row) =>
      row.id === updatedRow.id ? updatedRow : row,
    );

    const allRowsAreDone = updatedRows.filter((rows) => !rows.completed).length === 0;
    const anyRowsUndone = updatedRows.some((rows) => !rows.completed);

    const updatedChecklistItem: ChecklistItem = {
      ...item,
      completed: allRowsAreDone ? true : anyRowsUndone && item.completed ? false : item.completed,
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
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitleEdit();
    } else if (e.key === 'Escape') {
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
        row.id === editingRowId ? { ...row, name: trimmedValue } : row,
      );
      const updatedItem = { ...item, rows: updatedRows };
      await updateItem(updatedItem);
    }
    setEditingRowId(null);
  };

  const cancelRowEdit = () => {
    setEditingRowId(null);
    setRowEditValue('');
  };

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveRowEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRowEdit();
    }
  };

  return (
    <div
      className={cn(
        'flex min-h-[52px] w-full items-start gap-4 rounded-lg px-1 py-3 transition-all duration-300',
        item.completed && 'opacity-60',
        item._sseHighlight && 'animate-sse-highlight',
      )}
    >
      {/* Custom checkbox with satisfying animation */}
      <button
        onClick={() => handleItemCompleted(!item.completed)}
        className={cn(
          'group relative mt-0.5 flex h-7 w-7 shrink-0 touch-manipulation items-center justify-center overflow-hidden rounded-md border-2 transition-all duration-300',
          item.completed
            ? 'border-primary bg-primary shadow-sm'
            : 'border-border bg-card hover:border-primary/60 hover:bg-primary/5',
        )}
        aria-label={`Mark item ${item.name} as complete`}
      >
        {/* Animated background on hover */}
        <div
          className={cn(
            'absolute inset-0 scale-0 rounded-md bg-primary/10 transition-transform duration-300 group-hover:scale-100',
            item.completed && 'hidden',
          )}
        />

        {item.completed && (
          <svg
            className="relative z-10 h-4 w-4 animate-check text-primary-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Collapsible Container */}
      <Collapsible
        open={expanded}
        onOpenChange={(checkedState) => setExpanded(checkedState as boolean)}
        className="flex-grow"
      >
        {/* Title Row - clickable to expand/collapse */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="group flex flex-grow cursor-pointer flex-col items-start gap-2 text-left"
            onClick={() => setExpanded(!expanded)}
          >
            {/* Title with expand indicator */}
            <div className="flex w-full items-start gap-2">
              <ChevronRight
                className={cn(
                  'mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:text-primary/70',
                  expanded && 'rotate-90 text-primary/70',
                )}
              />
              {/* Desktop inline edit */}
              {isEditingTitle && !isMobile ? (
                <div
                  className="flex flex-grow items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Input
                    ref={titleInputRef}
                    value={titleEditValue}
                    onChange={(e) => setTitleEditValue(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={saveTitleEdit}
                    className="h-10 flex-grow text-base font-medium"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={saveTitleEdit}
                    className="h-9 w-9 shrink-0 hover:bg-primary/10"
                    aria-label="Save edit"
                  >
                    <Check className="h-4 w-4 text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={cancelTitleEdit}
                    className="h-9 w-9 shrink-0"
                    aria-label="Cancel edit"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <span
                  className={cn(
                    'select-none break-all py-0.5 text-[15px] font-medium leading-relaxed transition-all duration-200',
                    'group-hover:text-primary/90',
                    item.completed ? 'text-muted-foreground/70' : 'text-foreground',
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
            </div>
          </div>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              deleteItem(item.id);
            }}
            aria-label="Delete item"
            className="h-8 w-8 shrink-0 touch-manipulation text-muted-foreground/50 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Subitems preview */}
        {!expanded && item.rows && item.rows.length > 0 && (
          <div
            className="pointer-events-none flex flex-wrap gap-x-2 text-sm leading-relaxed text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {item.rows.map((row, index) => (
              <span
                key={row.id ? `checklistItem-row-${row.id}` : `checklistItem-row-temp-${index}`}
                className={cn('break-all', row.completed && 'line-through opacity-60')}
              >
                {row.name}
              </span>
            ))}
          </div>
        )}

        {/* Expanded subitems content */}
        <CollapsibleContent>
          <div className="-ml-5 space-y-3 pl-3 pt-4">
            {item.rows?.map((row, index) => (
              <div
                key={row.id ?? `temp-${index}`}
                className="group flex min-h-[40px] items-start justify-between gap-3 transition-all duration-200 hover:translate-x-0.5"
              >
                <div className="flex min-w-0 flex-grow items-start gap-3">
                  {/* Sub-item checkbox */}
                  <button
                    onClick={() => handleRowCompleted(row, !row.completed)}
                    disabled={!row.id || row.id <= 0}
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 touch-manipulation items-center justify-center rounded border-2 transition-all duration-200',
                      row.completed
                        ? 'border-accent bg-accent'
                        : 'border-border bg-card hover:border-accent/60 hover:bg-accent/5',
                      (!row.id || row.id <= 0) && 'cursor-not-allowed opacity-50',
                    )}
                    aria-label={`Mark sub-item ${row.name} as complete`}
                  >
                    {row.completed && (
                      <svg
                        className="h-3 w-3 text-accent-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Editable row name - inline on desktop only */}
                  {editingRowId === row.id && !isMobile ? (
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Textarea
                        ref={rowInputRef}
                        value={rowEditValue}
                        onChange={(e) => {
                          setRowEditValue(e.target.value);
                          autoResize(e.target);
                        }}
                        onKeyDown={handleRowKeyDown}
                        onBlur={saveRowEdit}
                        className="max-h-[150px] min-h-[60px] w-full resize-none overflow-hidden rounded-md border border-border bg-card px-3 py-2 text-base focus-visible:ring-primary"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={saveRowEdit}
                          className="h-8 w-8 shrink-0 touch-manipulation"
                          aria-label="Save edit"
                        >
                          <Check className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={cancelRowEdit}
                          className="h-8 w-8 shrink-0 touch-manipulation"
                          aria-label="Cancel edit"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <span
                      className={cn(
                        'cursor-pointer select-none break-all py-1 text-[14px] leading-relaxed transition-all duration-200',
                        'hover:text-primary/90',
                        row.completed
                          ? 'text-muted-foreground/70 line-through'
                          : 'text-foreground/90',
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
                  tabIndex={-1}
                  onClick={() => deleteRow(item.id, row.id!)}
                  className="h-7 w-7 shrink-0 touch-manipulation text-muted-foreground/50 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:focus:opacity-100 sm:group-hover:opacity-100"
                  aria-label="Delete sub-item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            {/* New sub-item form */}
            <form onSubmit={handleAddRowItem} className="flex items-end gap-2 pb-1 pt-3">
              <Textarea
                ref={subItemTextareaRef}
                value={newSubItemText}
                onChange={(e) => {
                  setNewSubItemText(e.target.value);
                  autoResize(e.target);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddRowItem(e);
                    // Reset textarea height after submit
                    if (subItemTextareaRef.current) {
                      subItemTextareaRef.current.style.height = 'auto';
                    }
                  }
                }}
                placeholder={t('item.addSubItem')}
                className="max-h-[120px] min-h-[40px] flex-grow touch-manipulation resize-none overflow-hidden border-border/50 bg-muted/30 py-2 text-base focus:bg-card sm:text-sm"
                rows={1}
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 touch-manipulation text-muted-foreground hover:bg-primary/10 hover:text-primary"
                aria-label="Add sub-item"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Bottom Drawer for editing title - only on mobile */}
      {isMobile && (
        <Drawer.Root
          open={isEditingTitle}
          onOpenChange={(open) => !open && cancelTitleEdit()}
          repositionInputs={false}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex h-auto flex-col rounded-t-[10px] bg-background outline-none">
              {/* iOS-style drag handle */}
              <div className="mx-auto mb-6 mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />

              <div
                className="px-6 pb-6"
                style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
              >
                <div className="mb-4">
                  <h2 className="mb-1 text-lg font-semibold text-foreground">
                    {t('item.editTitle')}
                  </h2>
                  <p className="text-sm text-muted-foreground">{t('item.editDescription')}</p>
                </div>

                <div className="py-4">
                  <Input
                    ref={mobileTitleInputRef}
                    value={titleEditValue}
                    onChange={(e) => setTitleEditValue(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    placeholder={t('item.namePlaceholder')}
                    className="h-12 w-full text-lg"
                  />
                </div>

                <div className="flex flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={cancelTitleEdit}
                    className="h-12 flex-1 touch-manipulation"
                  >
                    {t('item.cancel')}
                  </Button>
                  <Button onClick={saveTitleEdit} className="h-12 flex-1 touch-manipulation">
                    {t('item.save')}
                  </Button>
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}

      {/* Bottom Drawer for editing row - only on mobile */}
      {isMobile && (
        <Drawer.Root
          open={editingRowId !== null}
          onOpenChange={(open) => !open && cancelRowEdit()}
          repositionInputs={false}
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex h-auto flex-col rounded-t-[10px] bg-background outline-none">
              {/* iOS-style drag handle */}
              <div className="mx-auto mb-6 mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />

              <div
                className="px-6 pb-6"
                style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
              >
                <div className="mb-4">
                  <h2 className="mb-1 text-lg font-semibold text-foreground">
                    {t('item.editSubItem')}
                  </h2>
                </div>

                <div className="py-4">
                  <Input
                    ref={mobileRowInputRef}
                    value={rowEditValue}
                    onChange={(e) => setRowEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveRowEdit();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelRowEdit();
                      }
                    }}
                    placeholder={t('item.namePlaceholder')}
                    className="h-12 w-full text-lg"
                  />
                </div>

                <div className="flex flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={cancelRowEdit}
                    className="h-12 flex-1 touch-manipulation"
                  >
                    {t('item.cancel')}
                  </Button>
                  <Button onClick={saveRowEdit} className="h-12 flex-1 touch-manipulation">
                    {t('item.save')}
                  </Button>
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </div>
  );
}
