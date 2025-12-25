'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useClaimInvite } from '@/api/invite/invite';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type ClaimStatus = 'loading' | 'success' | 'error';

export default function ClaimInvitePage() {
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
      const message = error?.response?.data?.message || error?.message || 'Failed to claim invite';
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
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Joining checklist...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
          <h2 className="text-2xl font-semibold">You&apos;ve joined the checklist!</h2>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 max-w-md">
          <XCircle className="h-16 w-16 mx-auto text-destructive" />
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Unable to Join Checklist</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>
          <Button onClick={() => router.push('/checklist')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
