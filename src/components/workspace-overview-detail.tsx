'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Settings, ChevronRight, FileText, Plus, UserPlus, ListChecks } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useGetWorkspaceById,
  useGetWorkspaceTemplates,
  useGetWorkspaceChecklists,
  getGetWorkspaceChecklistsKey,
  getGetWorkspaceTemplatesKey,
} from '@/api/workspace/workspace';
import { useCreateChecklist, useGetAllChecklists, updateChecklistById } from '@/api/checklist/checklist';
import { useCreateTemplate, assignTemplateToWorkspace, useGetAllTemplates } from '@/api/template/template';
import { mutate } from 'swr';
import { ShareWorkspaceModal } from '@/components/share-workspace-modal';
import { WorkspaceMemberList } from '@/components/workspace-member-list';

interface WorkspaceOverviewDetailProps {
  workspaceId: number;
}

export function WorkspaceOverviewDetail({ workspaceId }: WorkspaceOverviewDetailProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [createChecklistOpen, setCreateChecklistOpen] = useState(false);
  const [assignChecklistOpen, setAssignChecklistOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [assignTemplateOpen, setAssignTemplateOpen] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [assignSearch, setAssignSearch] = useState('');
  const [assignTemplateSearch, setAssignTemplateSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assigningTemplate, setAssigningTemplate] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspaceById(workspaceId);
  const { data: templates = [], isLoading: templatesLoading } = useGetWorkspaceTemplates(workspaceId);
  const { data: checklistsData, isLoading: checklistsLoading } = useGetWorkspaceChecklists(workspaceId);
  const checklists = checklistsData ?? [];

  const { data: allChecklistsData } = useGetAllChecklists();
  const allChecklists = allChecklistsData?.checklists ?? [];

  const { data: allTemplatesData } = useGetAllTemplates();
  const allTemplates = allTemplatesData ?? [];

  const assignableChecklists = useMemo(() => {
    const inCircleIds = new Set(checklists.map((c) => c.id));
    return allChecklists.filter((c) => c.isOwner && !inCircleIds.has(c.id));
  }, [allChecklists, checklists]);

  const assignableTemplates = useMemo(() => {
    const inCircleIds = new Set(templates.map((t) => t.id));
    return allTemplates.filter((t) => t.isOwner && !inCircleIds.has(t.id));
  }, [allTemplates, templates]);

  const filteredAssignable = useMemo(() => {
    if (!assignSearch.trim()) return assignableChecklists;
    const q = assignSearch.toLowerCase();
    return assignableChecklists.filter((c) => c.name.toLowerCase().includes(q));
  }, [assignableChecklists, assignSearch]);

  const filteredAssignableTemplates = useMemo(() => {
    if (!assignTemplateSearch.trim()) return assignableTemplates;
    const q = assignTemplateSearch.toLowerCase();
    return assignableTemplates.filter((t) => t.name.toLowerCase().includes(q));
  }, [assignableTemplates, assignTemplateSearch]);

  const { trigger: triggerCreateChecklist, isMutating: creatingChecklist } = useCreateChecklist();
  const { trigger: triggerCreateTemplate, isMutating: creatingTemplate } = useCreateTemplate();

  async function handleCreateChecklist() {
    if (!newChecklistName.trim()) return;
    await triggerCreateChecklist({ name: newChecklistName.trim(), workspaceId });
    await mutate(getGetWorkspaceChecklistsKey(workspaceId));
    setNewChecklistName('');
    setCreateChecklistOpen(false);
  }

  async function handleAssignChecklist(checklist: { id: number; name: string }) {
    setAssigning(true);
    try {
      await updateChecklistById(checklist.id, { name: checklist.name, workspaceId });
      await mutate(getGetWorkspaceChecklistsKey(workspaceId));
      setAssignChecklistOpen(false);
      setAssignSearch('');
    } finally {
      setAssigning(false);
    }
  }

  async function handleAssignTemplate(template: { id: number }) {
    setAssigningTemplate(true);
    try {
      await assignTemplateToWorkspace(template.id, { workspaceId });
      await mutate(getGetWorkspaceTemplatesKey(workspaceId));
      setAssignTemplateOpen(false);
      setAssignTemplateSearch('');
    } finally {
      setAssigningTemplate(false);
    }
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
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAssignChecklistOpen(true)}
              className="gap-1 text-xs"
            >
              <ListChecks className="h-3.5 w-3.5" />
              {t('workspace.addExisting', 'Add existing')}
            </Button>
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
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAssignTemplateOpen(true)}
              className="gap-1 text-xs"
            >
              <ListChecks className="h-3.5 w-3.5" />
              {t('workspace.addExistingTemplate', 'Add existing')}
            </Button>
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
      <Dialog open={createChecklistOpen} onOpenChange={(open) => {
        setCreateChecklistOpen(open);
        if (!open) setNewChecklistName('');
      }}>
        <DialogContent className="p-6 sm:max-w-[450px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="font-headline text-2xl">
              {t('workspace.newChecklist', 'New checklist')}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {t('workspace.newChecklistDescription', 'Give your checklist a name and start adding items.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <label htmlFor="checklist-name" className="block text-sm font-medium text-foreground">
              {t('checklist.name', 'Checklist name')}
            </label>
            <Input
              id="checklist-name"
              value={newChecklistName}
              onChange={(e) => setNewChecklistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !creatingChecklist && handleCreateChecklist()}
              placeholder={t('checklist.namePlaceholder', 'e.g., Shopping list')}
              autoFocus
              className="h-11 text-base"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setCreateChecklistOpen(false)}
              disabled={creatingChecklist}
              className="h-10 px-6"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleCreateChecklist}
              disabled={!newChecklistName.trim() || creatingChecklist}
              className="h-10 min-w-[100px] px-6"
            >
              {t('common.create', 'Create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Existing Checklist Dialog */}
      <Dialog open={assignChecklistOpen} onOpenChange={(open) => {
        setAssignChecklistOpen(open);
        if (!open) setAssignSearch('');
      }}>
        <DialogContent className="p-6 sm:max-w-[450px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="font-headline text-2xl">
              {t('workspace.addExistingChecklist', 'Add existing checklist')}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {t('workspace.addExistingDescription', 'Choose a checklist to add to this circle.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Input
              placeholder={t('workspace.searchChecklists', 'Search checklists...')}
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
              className="h-11 text-base"
              autoFocus
            />
            {filteredAssignable.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {assignableChecklists.length === 0
                  ? t('workspace.noAssignableChecklists', 'All your checklists are already in this circle.')
                  : t('workspace.noSearchResults', 'No checklists found.')}
              </p>
            ) : (
              <div className="max-h-60 divide-y overflow-y-auto rounded-lg border bg-card">
                {filteredAssignable.map((checklist) => {
                  const { totalItems, completedItems } = checklist.stats;
                  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                  return (
                    <button
                      key={checklist.id}
                      onClick={() => !assigning && handleAssignChecklist(checklist)}
                      disabled={assigning}
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{checklist.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {completedItems}/{totalItems} • {pct}%
                        </p>
                      </div>
                      <Plus className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setAssignChecklistOpen(false)}
              className="h-10 px-6"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Existing Template Dialog */}
      <Dialog open={assignTemplateOpen} onOpenChange={(open) => {
        setAssignTemplateOpen(open);
        if (!open) setAssignTemplateSearch('');
      }}>
        <DialogContent className="p-6 sm:max-w-[450px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="font-headline text-2xl">
              {t('workspace.addExistingTemplate', 'Add existing template')}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {t('workspace.addExistingTemplateDescription', 'Choose a template to add to this circle.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Input
              placeholder={t('workspace.searchTemplates', 'Search templates...')}
              value={assignTemplateSearch}
              onChange={(e) => setAssignTemplateSearch(e.target.value)}
              className="h-11 text-base"
              autoFocus
            />
            {filteredAssignableTemplates.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {assignableTemplates.length === 0
                  ? t('workspace.noAssignableTemplates', 'All your templates are already in this circle.')
                  : t('workspace.noSearchResults', 'No templates found.')}
              </p>
            ) : (
              <div className="max-h-60 divide-y overflow-y-auto rounded-lg border bg-card">
                {filteredAssignableTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => !assigningTemplate && handleAssignTemplate(template)}
                    disabled={assigningTemplate}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <span className="truncate font-medium">{template.name}</span>
                    </div>
                    <Plus className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setAssignTemplateOpen(false)}
              className="h-10 px-6"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={createTemplateOpen} onOpenChange={(open) => {
        setCreateTemplateOpen(open);
        if (!open) setNewTemplateName('');
      }}>
        <DialogContent className="p-6 sm:max-w-[450px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="font-headline text-2xl">
              {t('workspace.newTemplate', 'New template')}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {t('workspace.newTemplateDescription', 'Give your template a name to get started.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <label htmlFor="template-name" className="block text-sm font-medium text-foreground">
              {t('template.name', 'Template name')}
            </label>
            <Input
              id="template-name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !creatingTemplate && handleCreateTemplate()}
              placeholder={t('template.namePlaceholder', 'Template name')}
              autoFocus
              className="h-11 text-base"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setCreateTemplateOpen(false)}
              disabled={creatingTemplate}
              className="h-10 px-6"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!newTemplateName.trim() || creatingTemplate}
              className="h-10 min-w-[100px] px-6"
            >
              {t('common.create', 'Create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members section */}
      <div className="mt-6">
        <WorkspaceMemberList workspaceId={workspaceId} isOwner={workspace?.isOwner ?? false} />
      </div>

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
