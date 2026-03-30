// Template invite claim page is disabled — template sharing is being replaced by workspace sharing.
// Existing invite links will redirect to /templates.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClaimTemplateInvitePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/templates');
  }, [router]);

  return null;
}
