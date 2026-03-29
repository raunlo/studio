'use client';

import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronRight, Trash2 } from 'lucide-react';
import { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useGetAllTemplates, useCreateTemplate, useDeleteTemplate } from '@/api/template/template';
import type { Template } from '@/api/template/template';

export function TemplateOverview() {
  const { t } = useTranslation();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, mutate } = useGetAllTemplates();
  const { trigger: createTemplateTrigger, isMutating: isCreating } = useCreateTemplate();

  const { trigger: deleteTemplateTrigger } = useDeleteTemplate({
    swr: {
      onSuccess: () => {
        mutate();
        toast({ title: t('template.deleted', 'Template deleted') });
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

  const [search, setSearch] = useState('');

  const templates: Template[] = data ?? [];

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (tmpl) =>
        tmpl.name.toLowerCase().includes(q) ||
        tmpl.rows?.some((r) => r.name.toLowerCase().includes(q)),
    );
  }, [templates, search]);

  // Group by first letter, sorted alphabetically
  const { grouped, letters } = useMemo(() => {
    const map = new Map<string, Template[]>();
    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

    for (const tmpl of sorted) {
      const letter = tmpl.name[0]?.toUpperCase() || '#';
      const key = /[A-ZÄÖÜÕ]/.test(letter) ? letter : '#';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tmpl);
    }

    const sortedLetters = [...map.keys()].sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });

    return { grouped: map, letters: sortedLetters };
  }, [filtered]);

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
        await deleteTemplateTrigger(templateId);
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    },
    [deleteTemplateTrigger, t],
  );

  const scrollToLetter = (letter: string) => {
    const el = document.getElementById(`template-section-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
            {letters.map((letter) => (
              <div key={letter} id={`template-section-${letter}`}>
                {/* Section header */}
                <div className="sticky top-0 z-10 bg-muted/80 px-4 py-1 backdrop-blur-sm sm:px-6">
                  <span className="text-xs font-semibold text-muted-foreground">{letter}</span>
                </div>

                {/* Items */}
                {grouped.get(letter)!.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => router.push(`/templates/${template.id}`)}
                    className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-accent sm:px-6 sm:hover:bg-accent"
                  >
                    {/* Avatar circle with first letter */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {template.name[0]?.toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {template.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {template.rows?.length ?? 0} {t('templates.items', 'items')}
                        {template.description && ` · ${template.description}`}
                      </div>
                    </div>

                    {/* Delete + chevron */}
                    <button
                      onClick={(e) => handleDeleteTemplate(e, template.id)}
                      className="shrink-0 rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Alphabet sidebar */}
          {letters.length > 1 && (
            <div className="absolute right-0 top-0 z-20 flex h-full flex-col items-center justify-center py-2 pr-0.5">
              {letters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => scrollToLetter(letter)}
                  className="flex h-[18px] w-5 items-center justify-center text-[10px] font-semibold text-primary active:scale-125"
                >
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
