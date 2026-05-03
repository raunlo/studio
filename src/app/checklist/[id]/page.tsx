'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { ChecklistCard } from '@/components/checklist-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useGetChecklistById } from '@/api/checklist/checklist';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { ChecklistCardHandle } from '@/components/shared/types';
import { AxiosError } from 'axios';
import { NEXT_PUBLIC_API_BASE_URL } from '@/lib/axios';
import { ChecklistFilterBar, FilterType } from '@/components/checklist-filter-bar';

export default function ChecklistDetailPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const checklistId = params.id as string;
  const checklistCardRef = useRef<ChecklistCardHandle>(null);

  const { data: checklist, isLoading, error } = useGetChecklistById(Number(checklistId));

  useEffect(() => {
    checkAuth();
  }, []);

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

  const checkAuth = async () => {
    try {
      // Call backend directly to include session cookie
      const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/session`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.authenticated) {
        setIsAuthenticated(true);
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/');
    } finally {
      setIsChecking(false);
    }
  };

  const handleBackToOverview = useCallback(async () => {
    // Force revalidate checklists cache to get fresh stats from server
    // This ensures stats are always up-to-date when navigating back
    await mutate(['checklists'], undefined, { revalidate: true });
    router.push('/checklist');
  }, [mutate, router]);

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination || source.droppableId !== destination.droppableId) return;

    if (checklistCardRef.current) {
      await checklistCardRef.current.handleReorder(source.index, destination.index);
    }
  }, []);

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
    <>
      {/* Fixed header */}
      <div className="fixed inset-x-0 top-0 z-20 flex items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
        <button
          onClick={handleBackToOverview}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          aria-label={t('detail.back')}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 truncate font-headline text-xl text-foreground">
          {checklist?.name ?? ''}
        </h1>
        <button
          onClick={() => {
            if (navigator.share && checklist) {
              navigator.share({ title: checklist.name, url: window.location.href }).catch(() => {});
            }
          }}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
          aria-label="Share"
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>

      {/* Offset content below fixed header (py-3 * 2 + icon h-5 = 56px) */}
      <div className="container mx-auto w-full px-4 pt-[56px] pb-4 sm:max-w-2xl sm:px-6 sm:pt-[56px] sm:pb-6">

        {/* Checklist content */}
        {(isLoading || (!checklist && !error)) && (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}

        {error &&
          (() => {
            // Check if it's an auth error (will redirect via useEffect above)
            const isAuthError =
              error instanceof AxiosError &&
              (error.response?.status === 401 || error.response?.status === 403);

            if (isAuthError) {
              // Show loading while redirecting
              return (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-96 w-full" />
                </div>
              );
            }

            // Show error for non-auth errors
            return (
              <div className="rounded-lg border-2 border-dashed border-destructive px-4 py-16 text-center">
                <h3 className="text-xl font-semibold text-destructive">{t('detail.error')}</h3>
                <p className="mt-2 text-muted-foreground">{t('detail.errorDescription')}</p>
                <Button onClick={handleBackToOverview} className="mt-4">
                  {t('detail.backToOverview')}
                </Button>
              </div>
            );
          })()}

        {checklist && (
          <div className="space-y-6">
            <DragDropContext onDragEnd={onDragEnd}>
              <ChecklistCard
                ref={checklistCardRef}
                checklist={checklist}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onTemplateApplied={() => {
                  mutate(['checklist-items', Number(checklistId)]);
                }}
              />
            </DragDropContext>
          </div>
        )}
      </div>
    </>
  );
}
