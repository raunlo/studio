'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllTemplates, useApplyTemplate, useCreateTemplate, Template } from '@/api/template/template';
import { FileText, Plus, Loader2, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TemplateDrawerProps {
  checklistId: number;
  onTemplateApplied?: () => void;
}

export function TemplateDrawer({ checklistId, onTemplateApplied }: TemplateDrawerProps) {
  const { t } = useTranslation();
  const { data: templates, isLoading } = useGetAllTemplates();
  const applyTemplate = useApplyTemplate();
  const createTemplate = useCreateTemplate();

  const [confirmTemplate, setConfirmTemplate] = useState<Template | null>(null);
  const [applying, setApplying] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const templateCount = templates?.length ?? 0;

  const filteredTemplates = templates?.filter((tmpl) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      tmpl.name.toLowerCase().includes(q) ||
      tmpl.rows?.some((r) => r.name.toLowerCase().includes(q))
    );
  });

  const handleApply = async () => {
    if (!confirmTemplate) return;
    setApplying(true);
    try {
      await applyTemplate.trigger({
        checklistId,
        templateId: confirmTemplate.id,
      });
      setConfirmTemplate(null);
      onTemplateApplied?.();
    } catch {
      // error handled by SWR
    } finally {
      setApplying(false);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createTemplate.trigger({ name });
      setNewName('');
      setShowCreateForm(false);
    } catch {
      // error handled by SWR
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Drawer.Root snapPoints={[0.4, 0.85]} modal={false}>
        {/* Fixed bottom trigger/handle */}
        <Drawer.Trigger asChild>
          <button
            className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center bg-background border-t border-border pt-2 touch-manipulation"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mb-2 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-2 pb-1 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Templates{templateCount > 0 ? ` (${templateCount})` : ''}</span>
            </div>
          </button>
        </Drawer.Trigger>

        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex h-full max-h-[85vh] flex-col rounded-t-[10px] bg-background outline-none">
            {/* iOS drag handle */}
            <div className="mx-auto mb-4 mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />

            <div className="px-4 pb-2">
              <h2 className="text-lg font-semibold text-foreground">Templates</h2>
              <p className="text-sm text-muted-foreground">
                {t('templates.drawerDescription', 'Choose a template to add to this checklist')}
              </p>
            </div>

            {/* Search */}
            {!isLoading && templateCount > 0 && (
              <div className="px-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('templates.search', 'Search templates...')}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <div
              className="flex-1 overflow-y-auto px-4 pb-4"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
              <div className="space-y-2 py-2">
                {isLoading && (
                  <>
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </>
                )}

                {!isLoading && templateCount === 0 && !showCreateForm && (
                  <div className="py-8 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="text-sm">{t('templates.noTemplates', 'No templates yet')}</p>
                  </div>
                )}

                {!isLoading && search.trim() && filteredTemplates?.length === 0 && (
                  <div className="py-6 text-center text-muted-foreground">
                    <p className="text-sm">{t('templates.noResults', 'No templates found')}</p>
                  </div>
                )}

                {!isLoading &&
                  filteredTemplates?.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setConfirmTemplate(template)}
                      className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent active:bg-accent"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{template.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({template.rows?.length ?? 0})
                          </span>
                        </div>
                        {template.rows && template.rows.length > 0 && (
                          <p className="truncate text-xs text-muted-foreground">
                            {template.rows.map((r) => r.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}

                {/* Create new template form */}
                {showCreateForm ? (
                  <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={t('templates.namePlaceholder', 'Template name')}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewName('');
                        }}
                        className="flex-1"
                      >
                        {t('common.cancel', 'Cancel')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreate}
                        disabled={!newName.trim() || creating}
                        className="flex-1"
                      >
                        {creating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t('common.save', 'Save')
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('templates.createNew', 'Create new template')}
                  </Button>
                )}
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Confirm apply dialog */}
      <AlertDialog open={!!confirmTemplate} onOpenChange={(open) => !open && setConfirmTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('templates.applyConfirmTitle', 'Apply template?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('templates.applyConfirmDescription', `Add '${confirmTemplate?.name}' to this checklist?`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applying}>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply} disabled={applying}>
              {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('templates.apply', 'Apply')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
