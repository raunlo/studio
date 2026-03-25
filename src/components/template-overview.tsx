'use client';

import { useTranslation } from 'react-i18next';
import { TemplateCard } from '@/components/template-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useGetAllTemplates, useCreateTemplate, useDeleteTemplate } from '@/api/template/template';
import type { Template } from '@/api/template/template';

export function TemplateOverview() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data, isLoading, mutate } = useGetAllTemplates();
  const { trigger: createTemplateTrigger } = useCreateTemplate({
    swr: {
      onSuccess: () => {
        mutate();
        setNewTemplateName('');
        setNewTemplateDescription('');
        setDialogOpen(false);
        toast({
          title: t('template.created', 'Template created'),
        });
      },
      onError: () => {
        toast({
          title: t('common.error', 'Error'),
          description: t('template.createFailed', 'Failed to create template'),
          variant: 'destructive',
        });
      },
    },
  });

  const { trigger: deleteTemplateTrigger } = useDeleteTemplate({
    swr: {
      onSuccess: () => {
        mutate();
        toast({
          title: t('template.deleted', 'Template deleted'),
        });
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

  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const templates: Template[] = data ?? [];

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;

    setIsCreating(true);
    try {
      await createTemplateTrigger({
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || undefined,
      });
    } catch (error) {
      console.error('Failed to create template:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTemplate = useCallback(
    async (templateId: number) => {
      if (!window.confirm(t('template.confirmDelete', 'Are you sure?'))) return;

      try {
        await deleteTemplateTrigger(templateId);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    },
    [deleteTemplateTrigger, t],
  );

  const handleEditTemplate = (templateId: number) => {
    router.push(`/templates/${templateId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('template.title', 'Templates')}</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('template.title', 'Templates')}</h1>
          <p className="text-sm text-muted-foreground">
            Create reusable templates to quickly build checklists with pre-defined items
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('template.new', 'New Template')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('template.createNew', 'Create new template')}</DialogTitle>
              <DialogDescription>
                {t('template.createDescription', 'Add a name and optional description')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('template.name', 'Template name')}</label>
                <Input
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder={t('template.namePlaceholder', 'e.g., Weekly Grocery')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isCreating) {
                      handleCreateTemplate();
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('template.description', 'Description (optional)')}</label>
                <Input
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder={t('template.descriptionPlaceholder', 'e.g., Items for weekly shopping')}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateTemplate}
                  disabled={!newTemplateName.trim() || isCreating}
                  className="flex-1"
                >
                  {isCreating ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty state */}
      {templates.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 py-16 px-6 text-center">
          <div className="mb-4 text-4xl">📋</div>
          <h2 className="text-lg font-semibold text-foreground">No templates yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Templates help you quickly create checklists with pre-defined items. Create your first template to get started.
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
            <p>💡 <strong>Example:</strong> Create a "Weekly Grocery" template with items you always buy</p>
            <p>Then reuse it every week with one click</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="mt-8">
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEditTemplate}
              onDelete={handleDeleteTemplate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
