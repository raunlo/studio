'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { WorkspaceMemberList } from '@/components/workspace-member-list';
import { NEXT_PUBLIC_API_BASE_URL } from '@/lib/axios';
import { useGetWorkspaceById, deleteWorkspace, leaveWorkspace } from '@/api/workspace/workspace';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export default function WorkspaceSettingsPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const params = useParams();
  const workspaceId = Number(params.workspaceId);
  const { t } = useTranslation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/session`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.authenticated) {
        setIsAuthenticated(true);
      } else {
        router.replace('/');
      }
    } catch {
      router.replace('/');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <WorkspaceSettings workspaceId={workspaceId} />
      </div>
    </div>
  );
}

function WorkspaceSettings({ workspaceId }: { workspaceId: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: workspace, isLoading } = useGetWorkspaceById(workspaceId);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t('confirm.deleteWorkspace'))) return;
    setIsDeleting(true);
    try {
      await deleteWorkspace(workspaceId);
      toast({ title: t('workspace.deleteWorkspace') });
      router.push('/workspaces');
    } catch (error: any) {
      toast({
        title: 'Failed to delete workspace',
        description: error?.message || t('common.somethingWentWrong'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm(t('confirm.leaveWorkspace'))) return;
    setIsLeaving(true);
    try {
      await leaveWorkspace(workspaceId);
      toast({ title: t('toast.leftWorkspace'), description: t('toast.leftWorkspaceDescription') });
      router.push('/workspaces');
    } catch (error: any) {
      toast({
        title: t('toast.failedToLeaveWorkspace'),
        description: error?.message || t('common.somethingWentWrong'),
        variant: 'destructive',
      });
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/workspaces/${workspaceId}`)}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {isLoading ? (
          <Skeleton className="h-7 w-48" />
        ) : (
          <h1 className="font-headline text-xl font-bold sm:text-2xl">
            {t('workspace.settingsTitle')}
          </h1>
        )}
      </div>

      {/* Members */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">{t('workspace.membersTitle')}</h2>
        <WorkspaceMemberList workspaceId={workspaceId} isOwner={workspace?.isOwner ?? false} />
      </section>

      {/* Danger zone or Leave */}
      {workspace && (
        <section className="space-y-4 rounded-lg border border-destructive/30 p-4">
          <h2 className="text-base font-semibold text-destructive">{t('workspace.dangerZone')}</h2>
          {workspace.isOwner ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('workspace.deleteWorkspace')}</p>
                <p className="text-xs text-muted-foreground">{t('confirm.deleteWorkspace')}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : t('workspace.deleteWorkspace')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t('workspace.leaveWorkspace')}</p>
                <p className="text-xs text-muted-foreground">{t('confirm.leaveWorkspace')}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLeave}
                disabled={isLeaving}
              >
                {isLeaving ? 'Leaving...' : t('workspace.leaveWorkspace')}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
