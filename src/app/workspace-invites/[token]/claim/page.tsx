'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useClaimWorkspaceInvite } from '@/api/workspace-invite/workspace-invite';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ClaimStatus = 'loading' | 'success' | 'error';

export default function ClaimWorkspaceInvitePage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<ClaimStatus>('loading');
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { trigger: claimInvite } = useClaimWorkspaceInvite(token);
  const hasClaimed = useRef(false);

  useEffect(() => {
    if (token && !hasClaimed.current) {
      hasClaimed.current = true;
      handleClaimInvite();
    }
  }, [token]);

  const handleClaimInvite = async () => {
    try {
      const result = await claimInvite();

      if (result) {
        setStatus('success');
        setWorkspaceId(result.workspaceId);

        setTimeout(() => {
          router.push(`/workspaces/${result.workspaceId}`);
        }, 1500);
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        const returnUrl = encodeURIComponent(`/workspace-invites/${token}/claim`);
        router.replace(`/?returnUrl=${returnUrl}`);
        return;
      }

      setStatus('error');
      const message = error?.response?.data?.message || error?.message || t('workspaceInvite.failedToClaim');
      setErrorMessage(message);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">{t('workspaceInvite.joining')}</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-semibold">{t('workspaceInvite.successfullyJoined')}</h2>
          <p className="text-muted-foreground">{t('workspaceInvite.redirecting')}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md space-y-6 text-center">
          <XCircle className="mx-auto h-16 w-16 text-destructive" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{t('workspaceInvite.unableToJoin')}</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>
          <Button onClick={() => router.push('/workspaces')}>{t('workspaceInvite.backToWorkspaces')}</Button>
        </div>
      </div>
    );
  }

  return null;
}
