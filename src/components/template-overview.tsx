'use client';

import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronRight, Trash2, Circle } from 'lucide-react';
import { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useGetAllTemplates, useCreateTemplate, deleteTemplate, assignTemplateToWorkspace } from '@/api/template/template';
import type { TemplateResponse as Template } from '@/api/checklistServiceV1.schemas';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { getCircleColor } from '@/lib/circle-colors';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProfileMenu } from '@/components/ui/ProfileMenu';

export function TemplateOverview() {
  const { t } = useTranslation();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, mutate } = useGetAllTemplates();
  const { trigger: createTemplateTrigger, isMutating: isCreating } = useCreateTemplate();
  const { workspaces } = useWorkspaces();
  const defaultWorkspace = (workspaces ?? []).find((w) => w.isOwner && w.isDefault);
  const ownedWorkspaces = (workspaces ?? []).filter((w) => w.isOwner && !w.isDefault);

  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<number[]>([]);

  const openCreateDialog = () => {
    setSelectedWorkspaceIds([]);
    setCreateDialogOpen(true);
  };

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
    const name = newTemplateName.trim() || t('template.untitled', 'Untitled template');
    try {
      const created = await createTemplateTrigger({
        name,
        rows: [],
      });
      if (created?.id && selectedWorkspaceIds.length > 0) {
        await Promise.all(
          selectedWorkspaceIds.map((wId) => assignTemplateToWorkspace(created.id, { workspaceId: wId })),
        );
      }
      setCreateDialogOpen(false);
      setNewTemplateName('');
      setSelectedWorkspaceIds([]);
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
      mutate((current) => current?.filter((tmpl) => tmpl.id !== templateId), false);
      try {
        await deleteTemplate(templateId);
        mutate();
        toast({ title: t('template.deleted', 'Template deleted') });
      } catch (error) {
        console.error('Failed to delete template:', error);
        mutate();
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
    <div className="relative flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background px-4 pb-3 pt-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="font-headline text-2xl text-foreground">
            {t('template.title', 'Templates')}
          </h1>
          <div className="flex items-center gap-2">
            {templates.length > 0 && (
              <Button size="sm" onClick={openCreateDialog} disabled={isCreating} className="hidden md:inline-flex">
                <Plus className="mr-1.5 h-4 w-4" />
                {isCreating ? t('common.creating', 'Creating...') : t('template.new', 'New')}
              </Button>
            )}
            <ProfileMenu />
          </div>
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
          <button
            onClick={openCreateDialog}
            disabled={isCreating}
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors hover:bg-primary/20 active:bg-primary/25"
          >
            <Plus className="h-8 w-8 text-primary" />
          </button>
          <h2 className="font-headline text-lg text-foreground">
            {t('template.emptyTitle', 'No templates yet')}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {t(
              'template.emptyDescription',
              'Templates help you quickly create checklists with pre-defined items.',
            )}
          </p>
          <Button onClick={openCreateDialog} disabled={isCreating} className="mt-6">
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
        <div className="relative">
          {/* Template list */}
          <div ref={scrollContainerRef} className="pb-8">
            {filtered.map((template) => (
              <div
                key={template.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/templates/${template.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/templates/${template.id}`)}
                className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors active:bg-accent sm:px-6 sm:hover:bg-accent"
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
                  {(template.workspaceIds?.length ?? 0) > 0 && (() => {
                    const allOwned = [
                      ...(defaultWorkspace ? [defaultWorkspace] : []),
                      ...ownedWorkspaces,
                    ];
                    const assigned = (template.workspaceIds ?? [])
                      .map((id) => {
                        const idx = allOwned.findIndex((w) => w.id === id);
                        const w = allOwned[idx];
                        return w ? { w, color: getCircleColor(idx) } : null;
                      })
                      .filter((x): x is NonNullable<typeof x> => x !== null);
                    if (assigned.length === 0) return null;
                    return (
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {assigned.map(({ w, color }) => (
                          <span
                            key={w.id}
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                            style={{ borderColor: color + '80', color, backgroundColor: color + '15' }}
                          >
                            <Circle className="h-2 w-2" style={{ fill: color, color }} />
                            {w.isDefault ? t('workspace.personal', 'Personal') : w.name}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      {templates.length > 0 && (
        <button
          onClick={openCreateDialog}
          disabled={isCreating}
          className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform active:scale-95 disabled:opacity-60 md:hidden"
          aria-label={t('template.new', 'New template')}
        >
          <Plus className="h-6 w-6 text-primary-foreground" />
        </button>
      )}

      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) { setNewTemplateName(''); setSelectedWorkspaceIds([]); }
      }}>
        <DialogContent className="p-6 sm:max-w-[450px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="font-headline text-2xl">
              {t('template.new', 'New template')}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {t('template.newDescription', 'Give your template a name to get started')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <label htmlFor="template-name" className="block text-sm font-medium text-foreground">
                {t('template.name', 'Name')}
              </label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTemplate()}
                placeholder={t('template.namePlaceholder', 'Template name')}
                autoFocus
                className="h-11 text-base"
              />
            </div>
            {(workspaces ?? []).filter((w) => w.isOwner).length > 1 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  {t('workspace.title')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {defaultWorkspace && (() => {
                    const color = getCircleColor(0);
                    const isSelected = selectedWorkspaceIds.includes(defaultWorkspace.id);
                    return (
                      <button
                        type="button"
                        onClick={() => setSelectedWorkspaceIds((prev) =>
                          prev.includes(defaultWorkspace.id) ? prev.filter((id) => id !== defaultWorkspace.id) : [...prev, defaultWorkspace.id]
                        )}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors"
                        style={isSelected
                          ? { borderColor: color, backgroundColor: color + '20', color }
                          : { borderColor: color + '60', color }}
                      >
                        <Circle className="h-2.5 w-2.5" style={{ fill: color, color }} />
                        {t('workspace.personal', 'Personal')}
                      </button>
                    );
                  })()}
                  {ownedWorkspaces.map((w, i) => {
                    const color = getCircleColor(i + 1);
                    const isSelected = selectedWorkspaceIds.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWorkspaceIds((prev) =>
                          prev.includes(w.id) ? prev.filter((id) => id !== w.id) : [...prev, w.id]
                        )}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors"
                        style={isSelected
                          ? { borderColor: color, backgroundColor: color + '20', color }
                          : { borderColor: color + '60', color }}
                      >
                        <Circle className="h-2.5 w-2.5" style={{ fill: color, color }} />
                        {w.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isCreating}
              className="h-10 px-6"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplateName.trim() || isCreating}
              className="h-10 min-w-[100px] bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            >
              {isCreating ? t('common.creating', 'Creating...') : t('common.create', 'Create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
