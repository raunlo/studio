'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { WorkspaceOverviewDetail } from '@/components/workspace-overview-detail';
import { NEXT_PUBLIC_API_BASE_URL } from '@/lib/axios';

export default function WorkspaceDetailPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const params = useParams();
  const workspaceId = Number(params.workspaceId);

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 md:pt-[57px]">
        <WorkspaceOverviewDetail workspaceId={workspaceId} />
      </div>
    </div>
  );
}
