'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useClaimInvite } from '@/api/invite/invite';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ClaimStatus = 'loading' | 'success' | 'error';

export default function ClaimInvitePage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<ClaimStatus>('loading');
  const [checklistId, setChecklistId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { trigger: claimInvite } = useClaimInvite(token);

  useEffect(() => {
    if (token) {
      handleClaimInvite();
    }
  }, [token]);

  const handleClaimInvite = async () => {
    try {
      const result = await claimInvite();

      if (result) {
        setStatus('success');
        setChecklistId(result.checklistId);

        // Auto-redirect after showing success message
        setTimeout(() => {
          router.push(`/checklist/${result.checklistId}`);
        }, 1500);
      }
    } catch (error: any) {
      setStatus('error');

      // Parse error message
      const message = error?.response?.data?.message || error?.message || t('invite.failedToClaim');
      setErrorMessage(message);

      // Check if it's an auth error
      if (error?.response?.status === 401) {
        const returnUrl = encodeURIComponent(`/invites/${token}/claim`);
        router.push(`/?returnUrl=${returnUrl}`);
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">{t('invite.joiningChecklist')}</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-semibold">{t('invite.successfullyJoined')}</h2>
          <p className="text-muted-foreground">{t('invite.redirecting')}</p>
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
            <h2 className="text-2xl font-semibold">{t('invite.unableToJoin')}</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>
          <Button onClick={() => router.push('/checklist')}>{t('invite.backToHome')}</Button>
        </div>
      </div>
    );
  }

  return null;
}
