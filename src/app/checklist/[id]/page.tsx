"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChecklistCard } from "@/components/checklist-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useGetChecklistById } from "@/api/checklist/checklist";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { ChecklistCardHandle } from "@/components/shared/types";
import { AxiosError } from "axios";
import { NEXT_PUBLIC_API_BASE_URL } from "@/lib/axios";
import { ChecklistFilterBar, FilterType } from "@/components/checklist-filter-bar";

export default function ChecklistDetailPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
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

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination || source.droppableId !== destination.droppableId) return;

    if (checklistCardRef.current) {
      await checklistCardRef.current.handleReorder(source.index, destination.index);
    }
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-background w-full">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full sm:max-w-2xl">
        {/* Header with back button - Mobile optimized */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/checklist')}
            className="gap-2 h-11 px-3 sm:px-4 touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('detail.back')}
          </Button>
        </div>

        {/* Checklist content */}
        {(isLoading || (!checklist && !error)) && (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}

        {error && (() => {
          // Check if it's an auth error (will redirect via useEffect above)
          const isAuthError = error instanceof AxiosError &&
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
            <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg border-destructive">
              <h3 className="text-xl font-semibold text-destructive">{t('detail.error')}</h3>
              <p className="text-muted-foreground mt-2">
                {t('detail.errorDescription')}
              </p>
              <Button
                onClick={() => router.push('/checklist')}
                className="mt-4"
              >
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
              />
            </DragDropContext>
          </div>
        )}
      </div>
    </div>
  );
}
