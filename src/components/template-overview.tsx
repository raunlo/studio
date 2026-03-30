'use client';

import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronRight, Trash2 } from 'lucide-react';
import { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useGetAllTemplates, useCreateTemplate, deleteTemplate } from '@/api/template/template';
import type { Template } from '@/api/template/template';
// import { ShareTemplateModal } from '@/components/share-template-modal'; // disabled: template sharing via workspace

export function TemplateOverview() {
  const { t } = useTranslation();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, mutate } = useGetAllTemplates();
  const { trigger: createTemplateTrigger, isMutating: isCreating } = useCreateTemplate();


  const [search, setSearch] = useState('');

  const templates: Template[] = data ?? [];

  // Filter by search
  const filtered = useMemo(() => {
    const sorted = [...templates].sort((a, b) => a.name.localeCompare(b.name));
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(
      (tmpl) =>
        tmpl.name.toLowerCase().includes(q) ||
        tmpl.rows?.some((r) => r.name.toLowerCase().includes(q)),
    );
  }, [templates, search]);

  const handleCreateTemplate = async () => {
    try {
      const created = await createTemplateTrigger({
        name: t('template.untitled', 'Untitled template'),
      });
      if (created?.id) {
        router.push(`/templates/${created.id}`);
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('template.createFailed', 'Failed to create template'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = useCallback(
    async (e: React.MouseEvent, templateId: number) => {
      e.stopPropagation();
      if (!window.confirm(t('template.confirmDelete', 'Are you sure?'))) return;
      try {
        await deleteTemplate(templateId);
        mutate();
        toast({ title: t('template.deleted', 'Template deleted') });
      } catch (error) {
        console.error('Failed to delete template:', error);
        toast({
          title: t('common.error', 'Error'),
          description: t('template.deleteFailed', 'Failed to delete template'),
          variant: 'destructive',
        });
      }
    },
    [mutate, t],
  );

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pb-3 pt-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="font-headline text-2xl text-foreground">
            {t('template.title', 'Templates')}
          </h1>
          <Button size="sm" onClick={handleCreateTemplate} disabled={isCreating}>
            <Plus className="mr-1.5 h-4 w-4" />
            {isCreating ? t('common.creating', 'Creating...') : t('template.new', 'New')}
          </Button>
        </div>

        {/* Search */}
        {templates.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('templates.search', 'Search templates...')}
              className="h-9 pl-9 text-sm"
            />
          </div>
        )}
      </div>

      {/* Empty state */}
      {templates.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-headline text-lg text-foreground">
            {t('template.emptyTitle', 'No templates yet')}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {t(
              'template.emptyDescription',
              'Templates help you quickly create checklists with pre-defined items.',
            )}
          </p>
          <Button onClick={handleCreateTemplate} disabled={isCreating} className="mt-6">
            <Plus className="mr-1.5 h-4 w-4" />
            {t('template.createFirst', 'Create your first template')}
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t('templates.noResults', 'No templates found')}
          </p>
        </div>
      ) : (
        <div className="relative flex flex-1 overflow-hidden">
          {/* Template list */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-8">
            {filtered.map((template) => (
              <button
                key={template.id}
                onClick={() => router.push(`/templates/${template.id}`)}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-accent sm:px-6 sm:hover:bg-accent"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {template.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {template.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {template.rows?.length ?? 0} {t('templates.items', 'items')}
                    {template.description && ` · ${template.description}`}
                  </div>
                </div>
                {template.isOwner && (
                  <button
                    onClick={(e) => handleDeleteTemplate(e, template.id)}
                    className="shrink-0 rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
