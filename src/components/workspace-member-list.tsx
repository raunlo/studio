'use client';

import { useGetWorkspaceMembers } from '@/api/workspace/workspace';
import { customInstance } from '@/lib/axios';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const MEMBER_GRADIENTS = [
  'from-[#E07060] to-[#C4607E]',
  'from-[#6B9B7A] to-[#5B9EC9]',
  'from-[#C4883A] to-[#E07060]',
  'from-[#8B7BB5] to-[#5B9EC9]',
  'from-[#5B9EC9] to-[#6B9B7A]',
  'from-[#C4607E] to-[#8B7BB5]',
];

interface WorkspaceMemberListProps {
  workspaceId: number;
  isOwner: boolean;
}

export function WorkspaceMemberList({ workspaceId, isOwner }: WorkspaceMemberListProps) {
  const { t } = useTranslation();
  const [removingId, setRemovingId] = useState<number | null>(null);

  const { data: members = [], isLoading, mutate } = useGetWorkspaceMembers(workspaceId);

  const handleRemove = async (memberId: number) => {
    if (!confirm(t('workspace.removeMember') + '?')) return;

    setRemovingId(memberId);
    try {
      await customInstance({
        url: `/api/v1/workspaces/${workspaceId}/members/${memberId}`,
        method: 'DELETE',
      });
      toast({ title: t('workspace.removeMember') });
      await mutate();
    } catch (error: any) {
      toast({
        title: 'Failed to remove member',
        description: error?.message || t('common.somethingWentWrong'),
        variant: 'destructive',
      });
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No members found</p>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member, memberIndex) => {
        const initials = (member.name || '?')
          .slice(0, 2)
          .toUpperCase();

        return (
          <div
            key={member.memberId}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${MEMBER_GRADIENTS[memberIndex % MEMBER_GRADIENTS.length]} text-sm font-semibold text-white shadow-sm`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{member.name ?? t('workspace.unknownMember', 'Member')}</p>
            </div>
            {member.isOwner && (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {t('workspace.owner')}
              </span>
            )}
            {isOwner && !member.isOwner && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRemove(member.memberId)}
                disabled={removingId === member.memberId}
                className="shrink-0 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                {t('workspace.removeMember')}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
