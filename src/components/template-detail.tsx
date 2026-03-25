'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { ArrowLeft, Plus, GripVertical, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  useGetTemplateById,
  useUpdateTemplate,
  useDeleteTemplate,
} from '@/api/template/template';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TemplateDetailProps {
  templateId: number;
}

export function TemplateDetail({ templateId }: TemplateDetailProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: template, isLoading, mutate } = useGetTemplateById(templateId);

  const { trigger: updateTemplateTrigger } = useUpdateTemplate({
    swr: {
      onSuccess: () => {
        mutate();
        toast({
          title: t('template.updated', 'Template updated'),
        });
      },
      onError: () => {
        toast({
          title: t('common.error', 'Error'),
          description: t('template.updateFailed', 'Failed to update template'),
          variant: 'destructive',
        });
      },
    },
  });

  const { trigger: deleteTemplateTrigger } = useDeleteTemplate({
    swr: {
      onSuccess: () => {
        toast({
          title: t('template.deleted', 'Template deleted'),
        });
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

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [newRowName, setNewRowName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize edit state when template loads
  if (template && !isEditing && editedName === '') {
    setEditedName(template.name);
    setEditedDescription(template.description || '');
  }

  const handleSaveChanges = useCallback(async () => {
    if (!editedName.trim()) {
      toast({
        title: t('common.error', 'Error'),
        description: t('template.nameRequired', 'Template name is required'),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateTemplateTrigger({
        id: templateId,
        data: {
          name: editedName.trim(),
          description: editedDescription.trim() || undefined,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update template:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editedName, editedDescription, templateId, updateTemplateTrigger, t]);

  const handleDeleteTemplate = useCallback(async () => {
    if (!window.confirm(t('template.confirmDelete', 'Are you sure?'))) return;

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
        id: templateId,
        data: {
          name: template.name,
          description: template.description || undefined,
          rows: updatedRows,
        },
      });
      setNewRowName('');
    } catch (error) {
      console.error('Failed to add row:', error);
    }
  }, [newRowName, template, templateId, updateTemplateTrigger]);

  const handleRemoveRow = useCallback(async (rowId: number) => {
    if (!template) return;

    const updatedRows = template.rows
      .filter((r) => r.id !== rowId)
      .map((r) => ({ name: r.name, position: r.position }));

    try {
      await updateTemplateTrigger({
        id: templateId,
        data: {
          name: template.name,
          description: template.description || undefined,
          rows: updatedRows,
        },
      });
    } catch (error) {
      console.error('Failed to remove row:', error);
    }
  }, [template, templateId, updateTemplateTrigger]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t('template.notFound', 'Template not found')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{template.name}</h1>
      </div>

      {/* Template Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{t('template.details', 'Template details')}</CardTitle>
            <CardDescription>{t('template.editInfo', 'Edit template information')}</CardDescription>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  {t('common.edit', 'Edit')}
                </Button>
                <Button variant="destructive" onClick={handleDeleteTemplate}>
                  {t('common.delete', 'Delete')}
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t('template.name', 'Template name')}</label>
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              disabled={!isEditing}
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              {t('template.description', 'Description')}
            </label>
            <Input
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              disabled={!isEditing}
              placeholder={t('template.descriptionPlaceholder', 'Optional description')}
              className="mt-2"
            />
          </div>
          <div className="text-xs text-muted-foreground pt-2">
            {t('common.created', 'Created')} {new Date(template.createdAt).toLocaleDateString()}
            {' • '}
            {t('common.modified', 'Modified')} {new Date(template.updatedAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      {/* Template Items */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('template.rows', 'Items')} ({template.rows.length})
          </CardTitle>
          <CardDescription>
            {t('template.rowsDescription', 'Items to include when using this template')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Row Form */}
          <div className="p-4 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50">
            <div className="flex gap-2">
              <Input
                placeholder="Add new item..."
                className="flex-1"
                value={newRowName}
                onChange={(e) => setNewRowName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddRow();
                  }
                }}
              />
              <Button variant="outline" size="sm" onClick={handleAddRow} disabled={!newRowName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Items List */}
          {template.rows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-3">
                {isEditing ? '✏️ No items yet. Add one above!' : '📋 No items in this template'}
              </p>
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Items you add here will be included when creating checklists from this template
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {template.rows.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                  <span className="flex-1 text-sm">{item.name}</span>
                  <button
                    onClick={() => handleRemoveRow(item.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-muted-foreground/50">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Items Info */}
          {!isEditing && template.rows.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                💡 All {template.rows.length} items will be added to your checklist when you use this template
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">💡 How to use this template</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-100 space-y-2 ml-4">
              <li>✓ Save time by reusing this template for recurring tasks</li>
              <li>✓ All {template.rows.length} items will be added to your new checklist</li>
              <li>✓ You can edit items after creating the checklist</li>
            </ul>
          </div>
          <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Next step:</strong> Create a checklist from this template on the checklist page
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
