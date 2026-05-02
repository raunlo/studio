'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Settings, ChevronRight, FileText, Plus, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useGetWorkspaceById,
  useGetWorkspaceTemplates,
  useGetWorkspaceChecklists,
  getGetWorkspaceChecklistsKey,
  getGetWorkspaceTemplatesKey,
} from '@/api/workspace/workspace';
import { useCreateChecklist } from '@/api/checklist/checklist';
import { useCreateTemplate, assignTemplateToWorkspace } from '@/api/template/template';
import { mutate } from 'swr';
import { ShareWorkspaceModal } from '@/components/share-workspace-modal';

interface WorkspaceOverviewDetailProps {
  workspaceId: number;
}

export function WorkspaceOverviewDetail({ workspaceId }: WorkspaceOverviewDetailProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [createChecklistOpen, setCreateChecklistOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspaceById(workspaceId);
  const { data: templates = [], isLoading: templatesLoading } = useGetWorkspaceTemplates(workspaceId);
  const { data: checklistsData, isLoading: checklistsLoading } = useGetWorkspaceChecklists(workspaceId);
  const checklists = checklistsData ?? [];

  const { trigger: triggerCreateChecklist, isMutating: creatingChecklist } = useCreateChecklist();
  const { trigger: triggerCreateTemplate, isMutating: creatingTemplate } = useCreateTemplate();

  async function handleCreateChecklist() {
    if (!newChecklistName.trim()) return;
    await triggerCreateChecklist({ name: newChecklistName.trim(), workspaceId });
    await mutate(getGetWorkspaceChecklistsKey(workspaceId));
    setNewChecklistName('');
    setCreateChecklistOpen(false);
  }

  async function handleCreateTemplate() {
    if (!newTemplateName.trim()) return;
    const created = await triggerCreateTemplate({ name: newTemplateName.trim(), rows: [] });
    if (created?.id) {
      await assignTemplateToWorkspace(created.id, { workspaceId });
    }
    await mutate(getGetWorkspaceTemplatesKey(workspaceId));
    setNewTemplateName('');
    setCreateTemplateOpen(false);
  }

  if (workspaceLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/workspaces')}
        className="-ml-2 gap-1.5 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('workspaceInvite.backToWorkspaces')}
      </Button>

      {/* Circle header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-headline text-xl font-bold sm:text-2xl">
            {workspace?.name ?? ''}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {workspace?.memberCount ?? 0} {t('workspace.members')}
          </p>
        </div>
        {workspace?.isOwner && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareModalOpen(true)}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              {t('workspace.share')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/workspaces/${workspaceId}/settings`)}
              className="gap-1.5"
            >
              <Settings className="h-4 w-4" />
              {t('workspace.settings')}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="checklists">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="checklists" className="flex-1 gap-1.5 sm:flex-none">
            {t('workspace.checklists')}
            {!checklistsLoading && (
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                {checklists.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex-1 gap-1.5 sm:flex-none">
            {t('workspace.templates')}
            {!templatesLoading && (
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                {templates.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklists" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreateChecklistOpen(true)}
              className="gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('workspace.newChecklist', 'New checklist')}
            </Button>
          </div>
          {checklistsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : checklists.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t('workspace.noChecklists')}
            </p>
          ) : (
            <div className="divide-y rounded-lg border bg-card">
              {checklists.map((checklist) => {
                const { totalItems, completedItems } = checklist.stats;
                const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                return (
                  <button
                    key={checklist.id}
                    onClick={() => router.push(`/checklist/${checklist.id}`)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{checklist.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {completedItems}/{totalItems} • {pct}%
                      </p>
                    </div>
                    <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreateTemplateOpen(true)}
              className="gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('workspace.newTemplate', 'New template')}
            </Button>
          </div>
          {templatesLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
          ) : templates.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t('workspace.noTemplates')}
            </p>
          ) : (
            <div className="divide-y rounded-lg border bg-card">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => router.push(`/templates/${template.id}`)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{template.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Checklist Dialog */}
      <Dialog open={createChecklistOpen} onOpenChange={setCreateChecklistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('workspace.newChecklist', 'New checklist')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="checklist-name">{t('checklist.name', 'Name')}</Label>
            <Input
              id="checklist-name"
              value={newChecklistName}
              onChange={(e) => setNewChecklistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateChecklist()}
              placeholder={t('checklist.namePlaceholder', 'Checklist name')}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateChecklistOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleCreateChecklist}
              disabled={!newChecklistName.trim() || creatingChecklist}
            >
              {t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={createTemplateOpen} onOpenChange={setCreateTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('workspace.newTemplate', 'New template')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="template-name">{t('template.name', 'Name')}</Label>
            <Input
              id="template-name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTemplate()}
              placeholder={t('template.namePlaceholder', 'Template name')}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTemplateOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplateName.trim() || creatingTemplate}
            >
              {t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      {workspace && (
        <ShareWorkspaceModal
          workspaceId={workspaceId}
          workspaceName={workspace.name}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
}
