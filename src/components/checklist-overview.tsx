'use client';

import { useTranslation } from 'react-i18next';
import { ChecklistOverviewCard } from '@/components/checklist-overview-card';
import { Skeleton } from '@/components/ui/skeleton';
import { leaveSharedChecklist, updateChecklistById } from '@/api/checklist/checklist';
import { mutate } from 'swr';
import { getCircleColor } from '@/lib/circle-colors';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useChecklists } from '@/hooks/use-checklists';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { AxiosError } from 'axios';
import { ProfileMenu } from '@/components/ui/ProfileMenu';

export function ChecklistOverview() {
  const { t } = useTranslation();
  const {
    checklists: data,
    isLoading,
    error,
    createChecklist: createChecklistMutation,
    deleteChecklist: deleteChecklistMutation,
  } = useChecklists({
    refreshInterval: 10000,
  });

  const { workspaces } = useWorkspaces();
  const ownedWorkspaces = (workspaces ?? []).filter((w) => w.isOwner);
  const allWorkspaces = workspaces ?? [];

  const [isCreating, setIsCreating] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openCreateDialog = () => {
    setSelectedWorkspaceId(null);
    setDialogOpen(true);
  };
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<{ id: number; name: string; workspaceId?: number | null } | null>(null);
  const [editName, setEditName] = useState('');
  const [editWorkspaceId, setEditWorkspaceId] = useState<number | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const checklists = data ?? [];

  // Group checklists by circle (includes circle checklists owned by other members)
  const workspaceMap = new Map((workspaces ?? []).map((w) => [w.id, w.name]));
  const circleGroups = (workspaces ?? [])
    .map((w) => ({
      id: w.id,
      name: w.name,
      checklists: checklists.filter((c) => c.workspaceId === w.id),
    }))
    .filter((g) => g.checklists.length > 0);
  // Checklists not in any circle: personal owned or directly shared
  const ungroupedOwned = checklists.filter(
    (c) => c.isOwner && (c.workspaceId == null || !workspaceMap.has(c.workspaceId)),
  );
  const directlyShared = checklists.filter(
    (c) => !c.isOwner && (c.workspaceId == null || !workspaceMap.has(c.workspaceId)),
  );
  // If user only has one circle (Personal) and no invited circles, flatten into a single list
  const singleCircle = (workspaces ?? []).length <= 1;

  // Time-based emoji for a touch of warmth
  const getTimeEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '🌙';
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    if (hour < 21) return '🌅';
    return '🌙';
  };

  // Redirect to home page on authentication errors - MUST be before any conditional returns
  useEffect(() => {
    if (error) {
      // Check if error is an authentication error (401 or 403)
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          // Redirect to home page with session expired error
          window.location.href = '/?error=session_expired';
          return;
        }
      }
    }
  }, [error]);

  const handleCreateChecklist = async () => {
    if (!newChecklistName.trim()) return;

    setIsCreating(true);
    try {
      await createChecklistMutation(newChecklistName.trim(), selectedWorkspaceId ?? undefined);
      setNewChecklistName('');
      setSelectedWorkspaceId(null);
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to create checklist:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenEdit = (id: number) => {
    const checklist = checklists.find((c) => c.id === id);
    if (!checklist) return;
    setEditingChecklist({ id: checklist.id, name: checklist.name, workspaceId: checklist.workspaceId });
    setEditName(checklist.name);
    setEditWorkspaceId(checklist.workspaceId ?? null);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingChecklist || !editName.trim()) return;
    setIsSavingEdit(true);
    try {
      await updateChecklistById(editingChecklist.id, { name: editName.trim(), workspaceId: editWorkspaceId });
      await mutate(['checklists']);
      setEditDialogOpen(false);
      setEditingChecklist(null);
    } catch (error: any) {
      toast({
        title: t('common.error', 'Error'),
        description: error?.message || t('common.somethingWentWrong'),
        variant: 'destructive',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm.deleteChecklist'))) {
      return;
    }

    try {
      await deleteChecklistMutation(id);
    } catch (error) {
      console.error('Failed to delete checklist:', error);
    }
  };

  const handleLeave = async (id: number) => {
    if (!confirm(t('confirm.leaveChecklist'))) {
      return;
    }

    try {
      await leaveSharedChecklist(id);
      toast({
        title: t('toast.leftChecklist'),
        description: t('toast.leftChecklistDescription'),
      });
      // Note: Manual refetch needed since leave is not in useChecklists hook
      // The hook's 10s polling will eventually update the list
    } catch (error: any) {
      toast({
        title: t('toast.failedToLeave'),
        description: error?.message || t('common.somethingWentWrong'),
        variant: 'destructive',
      });
    }
  };

  // Only show loading skeleton on first load (when there's no data)
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    // Check if it's an auth error (will redirect via useEffect above)
    const isAuthError =
      error instanceof AxiosError &&
      (error.response?.status === 401 || error.response?.status === 403);

    if (isAuthError) {
      // Show loading while redirecting
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="mb-2 h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      );
    }

    // Show error for non-auth errors
    const is500Error = error instanceof AxiosError && error.response?.status === 500;
    const errorMessage =
      error instanceof AxiosError
        ? error.response?.data?.message || error.response?.data?.error || error.message
        : error?.message || 'Unknown error';

    return (
      <div className="rounded-lg border-2 border-dashed border-destructive px-4 py-16 text-center">
        <h3 className="text-xl font-semibold text-destructive">{t('main.error')}</h3>
        <p className="mt-2 text-muted-foreground">
          {is500Error
            ? `Server error: ${errorMessage}`
            : 'Could not connect to the server. Please ensure the API is running and accessible.'}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          {t('main.retry') || 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background px-0 pb-3 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-headline text-2xl text-foreground sm:text-3xl">
              {t('overview.title')} {getTimeEmoji()}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {t('overview.subtitle')}
            </p>
          </div>
          <div className="md:hidden"><ProfileMenu /></div>
        </div>
      </div>
      <div className={`space-y-6 ${checklists.length > 0 ? 'pb-20 sm:pb-4' : 'pb-4'}`}>

        {/* Checklists Grid */}
        {checklists.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-card px-4 py-20 text-center">
            <div className="mx-auto max-w-md">
              <button
                onClick={openCreateDialog}
                className="mx-auto mb-4 flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl bg-primary/10 transition-all duration-200 hover:scale-105 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
                aria-label={t('overview.newChecklist')}
              >
                <Plus className="h-8 w-8 text-primary" />
              </button>
              <h3 className="font-headline text-xl text-foreground">{t('overview.empty')}</h3>
              <p className="mb-6 mt-2 text-muted-foreground">{t('overview.emptyDescription')}</p>
              <Button
                onClick={openCreateDialog}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('overview.createFirst')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {singleCircle ? (
              /* Single circle (Personal only) — flat list, show circle badge on non-personal items */
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                {checklists.map((checklist) => (
                  <ChecklistOverviewCard
                    key={checklist.id}
                    id={checklist.id}
                    name={checklist.name}
                    totalItems={checklist.stats.totalItems}
                    completedItems={checklist.stats.completedItems}
                    isOwner={checklist.isOwner}
                    isShared={checklist.isShared}
                    numberOfSharedUsers={checklist.numberOfSharedUsers}
                    circleName={checklist.workspaceId ? workspaceMap.get(checklist.workspaceId) : undefined}
                    onEdit={handleOpenEdit}
                    onDelete={checklist.isOwner ? handleDelete : undefined}
                    onLeave={!checklist.isOwner ? handleLeave : undefined}
                  />
                ))}
              </div>
            ) : (
              /* Multiple circles — group by circle, then ungrouped */
              <>
                {circleGroups.map((group) => (
                  <div key={group.id}>
                    <div className="mb-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-border/60" />
                      <h2 className="font-headline text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                        {group.name}
                      </h2>
                      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                        {group.checklists.length}
                      </span>
                      <div className="h-px flex-1 bg-border/60" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                      {group.checklists.map((checklist) => (
                        <ChecklistOverviewCard
                          key={checklist.id}
                          id={checklist.id}
                          name={checklist.name}
                          totalItems={checklist.stats.totalItems}
                          completedItems={checklist.stats.completedItems}
                          isOwner={checklist.isOwner}
                          isShared={checklist.isShared}
                          numberOfSharedUsers={checklist.numberOfSharedUsers}
                          onEdit={checklist.isOwner ? handleOpenEdit : undefined}
                          onDelete={checklist.isOwner ? handleDelete : undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {ungroupedOwned.length > 0 && (
                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-border/60" />
                      <h2 className="font-headline text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                        {t('overview.myChecklists')}
                      </h2>
                      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                        {ungroupedOwned.length}
                      </span>
                      <div className="h-px flex-1 bg-border/60" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                      {ungroupedOwned.map((checklist) => (
                        <ChecklistOverviewCard
                          key={checklist.id}
                          id={checklist.id}
                          name={checklist.name}
                          totalItems={checklist.stats.totalItems}
                          completedItems={checklist.stats.completedItems}
                          isOwner={checklist.isOwner}
                          isShared={checklist.isShared}
                          numberOfSharedUsers={checklist.numberOfSharedUsers}
                          onEdit={handleOpenEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {directlyShared.length > 0 && (
                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-border/60" />
                      <h2 className="font-headline text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                        {t('overview.sharedWithMe')}
                      </h2>
                      <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                        {directlyShared.length}
                      </span>
                      <div className="h-px flex-1 bg-border/60" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                      {directlyShared.map((checklist) => (
                        <ChecklistOverviewCard
                          key={checklist.id}
                          id={checklist.id}
                          name={checklist.name}
                          totalItems={checklist.stats.totalItems}
                          completedItems={checklist.stats.completedItems}
                          isOwner={checklist.isOwner}
                          isShared={checklist.isShared}
                          onEdit={undefined}
                          onLeave={handleLeave}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={openCreateDialog}
        className="group fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-elevated)] transition-all duration-200 hover:scale-110 hover:bg-primary/90 hover:shadow-xl active:scale-95 md:bottom-6 sm:h-16 sm:w-16"
        aria-label={t('overview.newChecklist')}
      >
        <Plus className="h-6 w-6 transition-transform duration-200 group-hover:rotate-90 sm:h-7 sm:w-7" />
      </button>
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setNewChecklistName(''); setSelectedWorkspaceId(null); }
      }}>
        <DialogContent className="p-6 sm:max-w-[450px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="font-headline text-2xl">
              {t('overview.createTitle')}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {t('overview.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <label htmlFor="checklist-name" className="block text-sm font-medium text-foreground">
                {t('overview.checklistNameLabel')}
              </label>
              <Input
                id="checklist-name"
                placeholder={t('overview.checklistNamePlaceholder')}
                value={newChecklistName}
                onChange={(e) => setNewChecklistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreating) {
                    handleCreateChecklist();
                  }
                }}
                autoFocus
                className="h-11 text-base"
              />
            </div>
            {allWorkspaces.length > 1 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  {t('workspace.title')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {allWorkspaces.map((w, i) => {
                    const color = getCircleColor(i);
                    const selected = selectedWorkspaceId === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWorkspaceId(selected ? null : w.id)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                          selected
                            ? 'text-foreground'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                        style={selected ? { backgroundColor: color + '22', borderColor: color + '88' } : {}}
                      >
                        <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
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
              onClick={() => {
                setDialogOpen(false);
                setNewChecklistName('');
                setSelectedWorkspaceId(null);
              }}
              disabled={isCreating}
              className="h-10 px-6"
            >
              {t('overview.cancel')}
            </Button>
            <Button
              onClick={handleCreateChecklist}
              disabled={!newChecklistName.trim() || isCreating}
              className="h-10 min-w-[100px] bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            >
              {isCreating ? t('overview.creating') : t('overview.create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Checklist Modal */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) setEditingChecklist(null);
      }}>
        <DialogContent className="p-6 sm:max-w-[450px]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="font-headline text-2xl">
              {t('overview.editTitle', 'Edit checklist')}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {t('overview.editDescription', 'Update the name and circle for this checklist.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <label htmlFor="edit-checklist-name" className="block text-sm font-medium text-foreground">
                {t('overview.checklistNameLabel')}
              </label>
              <Input
                id="edit-checklist-name"
                placeholder={t('overview.checklistNamePlaceholder')}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !isSavingEdit) handleSaveEdit(); }}
                autoFocus
                className="h-11 text-base"
              />
            </div>
            {ownedWorkspaces.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  {t('workspace.title', 'Circle')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {ownedWorkspaces.map((w, i) => {
                    const color = getCircleColor(i);
                    const selected = editWorkspaceId === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setEditWorkspaceId(selected ? null : w.id)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                          selected
                            ? 'text-foreground'
                            : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                        style={selected ? { backgroundColor: color + '22', borderColor: color + '88' } : {}}
                      >
                        <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
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
              onClick={() => setEditDialogOpen(false)}
              disabled={isSavingEdit}
              className="h-10 px-6"
            >
              {t('overview.cancel')}
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editName.trim() || isSavingEdit}
              className="h-10 min-w-[100px] bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            >
              {isSavingEdit ? t('overview.saving', 'Saving…') : t('overview.save', 'Save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
