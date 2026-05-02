'use client';

import { useTranslation } from 'react-i18next';
import { ShareWorkspaceModal } from '@/components/share-workspace-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Settings, ExternalLink, Users, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { leaveWorkspace } from '@/api/workspace/workspace';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import type { WorkspaceResponse } from '@/api/checklistServiceV1.schemas';

const CIRCLE_COLORS = [
  '#E07060', // coral
  '#6B9B7A', // sage
  '#5B9EC9', // sky
  '#C4883A', // amber
  '#8B7BB5', // lavender
  '#C4607E', // rose
] as const;

function getCircleColor(index: number): string {
  return CIRCLE_COLORS[index % CIRCLE_COLORS.length];
}

function StackedAvatars({ count, color }: { count: number; color: string }) {
  const slots = Math.min(count, 3);
  return (
    <div className="flex items-center">
      {Array.from({ length: slots }).map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: color + '33',
            borderColor: 'hsl(var(--card))',
            marginLeft: i === 0 ? 0 : -6,
            zIndex: slots - i,
          }}
          className="relative flex h-6 w-6 items-center justify-center rounded-full border-2"
        >
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color + 'aa' }}
          />
        </div>
      ))}
      {count > 3 && (
        <span
          style={{ marginLeft: -6, color, backgroundColor: color + '20' }}
          className="relative flex h-6 items-center rounded-full border-2 border-card px-1.5 text-[10px] font-semibold"
        >
          +{count - 3}
        </span>
      )}
    </div>
  );
}

export function WorkspaceOverview() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    workspaces: data,
    isLoading,
    error,
    createWorkspace: createWorkspaceMutation,
    deleteWorkspace: deleteWorkspaceMutation,
    renameWorkspace: renameWorkspaceMutation,
    mutateWorkspaces,
  } = useWorkspaces({ refreshInterval: 10000 });

  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingWorkspace, setRenamingWorkspace] = useState<{ id: number; name: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<{ id: number; name: string } | null>(null);

  const workspaces = data ?? [];
  const ownedWorkspaces = workspaces.filter((w) => w.isOwner);
  const sharedWorkspaces = workspaces.filter((w) => !w.isOwner);

  useEffect(() => {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        router.replace('/');
      }
    }
  }, [error, router]);

  const handleCreate = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsCreating(true);
    try {
      await createWorkspaceMutation(newWorkspaceName.trim(), newWorkspaceDescription.trim() || undefined);
      setDialogOpen(false);
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
    } catch {
      // error toast handled in hook
    } finally {
      setIsCreating(false);
    }
  };

  const handleRename = async () => {
    if (!renamingWorkspace || !newName.trim()) return;
    setIsRenaming(true);
    try {
      await renameWorkspaceMutation(renamingWorkspace.id, newName.trim());
      setRenameDialogOpen(false);
      setRenamingWorkspace(null);
      setNewName('');
    } catch {
      // error toast handled in hook
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async (workspace: WorkspaceResponse) => {
    if (!confirm(t('confirm.deleteWorkspace'))) return;
    try {
      await deleteWorkspaceMutation(workspace.id);
    } catch {
      // handled in hook
    }
  };

  const handleLeave = async (workspace: WorkspaceResponse) => {
    if (!confirm(t('confirm.leaveWorkspace'))) return;
    try {
      await leaveWorkspace(workspace.id);
      toast({
        title: t('toast.leftWorkspace'),
        description: t('toast.leftWorkspaceDescription'),
      });
      mutateWorkspaces();
    } catch {
      toast({ title: t('toast.failedToLeaveWorkspace'), variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 pt-4 sm:px-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <div className="flex-shrink-0 px-4 pb-3 pt-4 sm:px-6">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="font-headline text-2xl text-foreground">{t('workspace.title')}</h1>
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            {t('workspace.newWorkspace')}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{t('workspace.subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: '#E0706018' }}
            >
              <Users className="h-8 w-8" style={{ color: '#E07060' }} />
            </div>
            <h2 className="font-headline mb-2 text-xl text-foreground">{t('workspace.empty')}</h2>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
              {t('workspace.emptyDescription')}
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('workspace.createFirst')}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {ownedWorkspaces.length > 0 && (
              <section>
                {sharedWorkspaces.length > 0 && (
                  <h2 className="mb-3 font-headline text-xl text-foreground">
                    {t('overview.myChecklists', 'My circles')}
                  </h2>
                )}
                <CircleList
                  workspaces={ownedWorkspaces}
                  onOpen={(w) => router.push(`/workspaces/${w.id}`)}
                  onSettings={(w) => router.push(`/workspaces/${w.id}/settings`)}
                  onShare={(w) => { setSelectedWorkspace(w); setShareModalOpen(true); }}
                  onRename={(w) => { setRenamingWorkspace(w); setNewName(w.name); setRenameDialogOpen(true); }}
                  onDelete={handleDelete}
                  onLeave={handleLeave}
                />
              </section>
            )}

            {sharedWorkspaces.length > 0 && (
              <section>
                <h2 className="mb-3 font-headline text-xl text-foreground">
                  {t('overview.sharedWithMe', 'Shared with me')}
                </h2>
                <CircleList
                  workspaces={sharedWorkspaces}
                  onOpen={(w) => router.push(`/workspaces/${w.id}`)}
                  onSettings={(w) => router.push(`/workspaces/${w.id}/settings`)}
                  onShare={(w) => { setSelectedWorkspace(w); setShareModalOpen(true); }}
                  onRename={(w) => { setRenamingWorkspace(w); setNewName(w.name); setRenameDialogOpen(true); }}
                  onDelete={handleDelete}
                  onLeave={handleLeave}
                />
              </section>
            )}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('workspace.createTitle')}</DialogTitle>
            <DialogDescription>{t('workspace.createDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">{t('workspace.workspaceNameLabel')}</Label>
              <Input
                id="workspace-name"
                placeholder={t('workspace.workspaceNamePlaceholder')}
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                maxLength={255}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspace-desc">{t('workspace.descriptionLabel')}</Label>
              <Input
                id="workspace-desc"
                placeholder={t('workspace.descriptionPlaceholder')}
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                maxLength={500}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('workspace.cancel')}
              </Button>
              <Button onClick={handleCreate} disabled={isCreating || !newWorkspaceName.trim()}>
                {isCreating ? t('workspace.creating') : t('workspace.create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('workspace.renameTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="rename-workspace">{t('workspace.workspaceNameLabel')}</Label>
              <Input
                id="rename-workspace"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                maxLength={255}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                {t('workspace.cancel')}
              </Button>
              <Button onClick={handleRename} disabled={isRenaming || !newName.trim()}>
                {isRenaming ? t('workspace.saving') : t('workspace.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      {selectedWorkspace && (
        <ShareWorkspaceModal
          workspaceId={selectedWorkspace.id}
          workspaceName={selectedWorkspace.name}
          isOpen={shareModalOpen}
          onClose={() => { setShareModalOpen(false); setSelectedWorkspace(null); }}
        />
      )}
    </div>
  );
}

interface WorkspaceListProps {
  workspaces: WorkspaceResponse[];
  onOpen: (w: WorkspaceResponse) => void;
  onSettings: (w: WorkspaceResponse) => void;
  onShare: (w: WorkspaceResponse) => void;
  onRename: (w: WorkspaceResponse) => void;
  onDelete: (w: WorkspaceResponse) => void;
  onLeave: (w: WorkspaceResponse) => void;
}

function CircleList({ workspaces, onOpen, onSettings, onShare, onLeave }: WorkspaceListProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((workspace, index) => {
        const color = getCircleColor(index);
        return (
          <div
            key={workspace.id}
            onClick={() => onOpen(workspace)}
            className="group relative w-full cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card text-left shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.99]"
            style={{ borderLeft: `4px solid ${color}` }}
          >
            <div className="p-4">
              <h3 className="font-headline mb-3 truncate text-base text-foreground">
                {workspace.isDefault ? t('workspace.personal', 'My personal circle') : workspace.name}
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StackedAvatars count={workspace.memberCount} color={color} />
                  <span
                    style={{ color, backgroundColor: color + '18' }}
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                  >
                    {workspace.memberCount} {t('workspace.members')}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {workspace.isOwner && !workspace.isDefault && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onShare(workspace); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {workspace.isOwner ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSettings(workspace); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onLeave(workspace); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
