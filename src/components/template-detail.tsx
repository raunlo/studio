'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, GripVertical, Trash2, MoreVertical, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import {
  useGetTemplateById,
  useUpdateTemplate,
  useDeleteTemplate,
} from '@/api/template/template';

interface TemplateDetailProps {
  templateId: number;
}

export function TemplateDetail({ templateId }: TemplateDetailProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: template, isLoading, mutate } = useGetTemplateById(templateId);

  const { trigger: rawUpdateTrigger } = useUpdateTemplate(templateId, {
    swr: {
      onSuccess: () => {
        mutate();
        setSaveStatus('saved');
        if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
        saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      },
      onError: () => {
        setSaveStatus('idle');
        toast({
          title: t('common.error', 'Error'),
          description: t('template.updateFailed', 'Failed to update template'),
          variant: 'destructive',
        });
      },
    },
  });

  const updateTemplateTrigger = useCallback(
    async (...args: Parameters<typeof rawUpdateTrigger>) => {
      setSaveStatus('saving');
      return rawUpdateTrigger(...args);
    },
    [rawUpdateTrigger],
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    };
  }, []);

  const { trigger: deleteTemplateTrigger } = useDeleteTemplate(templateId, {
    swr: {
      onSuccess: () => {
        toast({ title: t('template.deleted', 'Template deleted') });
        router.push('/templates');
      },
      onError: () => {
        toast({
          title: t('common.error', 'Error'),
          description: t('template.deleteFailed', 'Failed to delete template'),
          variant: 'destructive',
        });
      },
    },
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newRowName, setNewRowName] = useState('');
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [rowEditValue, setRowEditValue] = useState('');

  // Save status tracking
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveStatusTimerRef = useRef<NodeJS.Timeout | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const rowInputRef = useRef<HTMLInputElement>(null);
  const newRowInputRef = useRef<HTMLInputElement>(null);
  const hasAutoFocused = useRef(false);

  // Auto-focus name on newly created templates
  useEffect(() => {
    if (template && !hasAutoFocused.current) {
      const isUntitled = template.name === t('template.untitled', 'Untitled template');
      if (isUntitled && template.rows.length === 0) {
        setEditedName(template.name);
        setIsEditingName(true);
        hasAutoFocused.current = true;
      }
    }
  }, [template, t]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isEditingDescription]);

  useEffect(() => {
    if (editingRowId && rowInputRef.current) {
      rowInputRef.current.focus();
      rowInputRef.current.select();
    }
  }, [editingRowId]);

  const saveTemplate = useCallback(
    async (updates: { name?: string; description?: string }) => {
      if (!template) return;
      await updateTemplateTrigger({
        name: updates.name ?? template.name,
        description: updates.description ?? template.description ?? undefined,
        rows: template.rows.map((r) => ({ name: r.name, position: r.position })),
      });
    },
    [template, templateId, updateTemplateTrigger],
  );

  const handleNameSave = useCallback(async () => {
    const trimmed = editedName.trim();
    if (!trimmed) {
      setIsEditingName(false);
      return;
    }
    if (trimmed !== template?.name) {
      await saveTemplate({ name: trimmed });
    }
    setIsEditingName(false);
  }, [editedName, template, saveTemplate]);

  const handleDescriptionSave = useCallback(async () => {
    const trimmed = editedDescription.trim();
    if (trimmed !== (template?.description ?? '')) {
      await saveTemplate({ description: trimmed || undefined });
    }
    setIsEditingDescription(false);
  }, [editedDescription, template, saveTemplate]);

  const handleDeleteTemplate = useCallback(async () => {
    if (!window.confirm(t('template.confirmDelete', 'Are you sure you want to delete this template?'))) return;
    try {
      await deleteTemplateTrigger(templateId);
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  }, [deleteTemplateTrigger, templateId, t]);

  const handleAddRow = useCallback(async () => {
    const name = newRowName.trim();
    if (!name || !template) return;

    const maxPosition = template.rows.reduce((max, r) => Math.max(max, r.position), 0);
    const updatedRows = [
      ...template.rows.map((r) => ({ name: r.name, position: r.position })),
      { name, position: maxPosition + 1000 },
    ];

    try {
      await updateTemplateTrigger({
        name: template.name,
        description: template.description || undefined,
        rows: updatedRows,
      });
      setNewRowName('');
      // Re-focus the input for rapid adding
      setTimeout(() => newRowInputRef.current?.focus(), 50);
    } catch (error) {
      console.error('Failed to add row:', error);
    }
  }, [newRowName, template, templateId, updateTemplateTrigger]);

  const handleRemoveRow = useCallback(
    async (rowId: number) => {
      if (!template) return;

      const updatedRows = template.rows
        .filter((r) => r.id !== rowId)
        .map((r) => ({ name: r.name, position: r.position }));

      try {
        await updateTemplateTrigger({
          name: template.name,
          description: template.description || undefined,
          rows: updatedRows,
        });
      } catch (error) {
        console.error('Failed to remove row:', error);
      }
    },
    [template, templateId, updateTemplateTrigger],
  );

  const handleRowEditSave = useCallback(async () => {
    const trimmed = rowEditValue.trim();
    if (!trimmed || !template || !editingRowId) {
      setEditingRowId(null);
      return;
    }

    const updatedRows = template.rows.map((r) => ({
      name: r.id === editingRowId ? trimmed : r.name,
      position: r.position,
    }));

    try {
      await updateTemplateTrigger({
        name: template.name,
        description: template.description || undefined,
        rows: updatedRows,
      });
    } catch (error) {
      console.error('Failed to update row:', error);
    }
    setEditingRowId(null);
  }, [rowEditValue, template, editingRowId, templateId, updateTemplateTrigger]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="mb-4 h-12 w-full" />
        <Skeleton className="mb-2 h-10 w-full" />
        <Skeleton className="mb-2 h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">{t('template.notFound', 'Template not found')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-4 sm:py-6">
      {/* Header with back + save status + actions */}
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/templates')}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('template.backToList', 'Templates')}
        </Button>

        <div className="flex items-center gap-2">
          {/* Save status indicator */}
          {saveStatus !== 'idle' && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-fade-in">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('common.saving', 'Saving...')}
                </>
              ) : (
                <>
                  <Check className="h-3 w-3 text-primary" />
                  {t('common.saved', 'Saved')}
                </>
              )}
            </span>
          )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleDeleteTemplate}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('template.delete', 'Delete template')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      {/* Editable name */}
      <div className="mb-1">
        {isEditingName ? (
          <Input
            ref={nameInputRef}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleNameSave();
              } else if (e.key === 'Escape') {
                setIsEditingName(false);
              }
            }}
            className="h-auto border-none bg-transparent px-0 font-headline text-2xl text-foreground shadow-none focus-visible:ring-0 sm:text-3xl"
          />
        ) : (
          <h1
            onClick={() => {
              setEditedName(template.name);
              setIsEditingName(true);
            }}
            className="cursor-text font-headline text-2xl text-foreground transition-colors hover:text-primary/80 sm:text-3xl"
          >
            {template.name}
          </h1>
        )}
      </div>

      {/* Editable description */}
      <div className="mb-8">
        {isEditingDescription ? (
          <Input
            ref={descriptionInputRef}
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            onBlur={handleDescriptionSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleDescriptionSave();
              } else if (e.key === 'Escape') {
                setIsEditingDescription(false);
              }
            }}
            placeholder={t('template.descriptionPlaceholder', 'Add a description...')}
            className="h-auto border-none bg-transparent px-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0"
          />
        ) : (
          <p
            onClick={() => {
              setEditedDescription(template.description ?? '');
              setIsEditingDescription(true);
            }}
            className="cursor-text text-sm text-muted-foreground transition-colors hover:text-foreground/70"
          >
            {template.description || t('template.descriptionPlaceholder', 'Add a description...')}
          </p>
        )}
      </div>

      {/* Items section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t('template.items', 'Items')} ({template.rows.length})
          </h2>
        </div>

        {/* Row list */}
        <div className="space-y-0.5">
          {template.rows
            .sort((a, b) => a.position - b.position)
            .map((row) => (
              <div
                key={row.id}
                className="group flex items-center gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/50"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/30" />

                {editingRowId === row.id ? (
                  <Input
                    ref={rowInputRef}
                    value={rowEditValue}
                    onChange={(e) => setRowEditValue(e.target.value)}
                    onBlur={handleRowEditSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRowEditSave();
                      } else if (e.key === 'Escape') {
                        setEditingRowId(null);
                      }
                    }}
                    className="h-auto flex-1 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                  />
                ) : (
                  <span
                    onClick={() => {
                      setRowEditValue(row.name);
                      setEditingRowId(row.id);
                    }}
                    className="flex-1 cursor-text text-sm text-foreground/90"
                  >
                    {row.name}
                  </span>
                )}

                <button
                  onClick={() => handleRemoveRow(row.id)}
                  className="shrink-0 rounded p-1 text-muted-foreground/30 transition-colors hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
        </div>

        {/* Add new item */}
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-muted-foreground/20 px-2 py-2">
          <Plus className="h-4 w-4 shrink-0 text-muted-foreground/40" />
          <Input
            ref={newRowInputRef}
            value={newRowName}
            onChange={(e) => setNewRowName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRow();
              }
            }}
            placeholder={t('template.addItem', 'Add an item...')}
            className="h-auto flex-1 border-none bg-transparent px-0 text-sm shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-0"
          />
          {newRowName.trim() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddRow}
              className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
            >
              {t('common.add', 'Add')}
            </Button>
          )}
        </div>

        {/* Empty state hint */}
        {template.rows.length === 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground/60">
            {t('template.addItemHint', 'Start adding items that will be included when you use this template')}
          </p>
        )}
      </div>
    </div>
  );
}
