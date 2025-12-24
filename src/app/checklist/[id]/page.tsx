"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { HeaderWrapper } from "@/components/ui/HeaderWrapper";
import { ChecklistCard } from "@/components/checklist-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useGetChecklistById } from "@/api/checklist/checklist";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { ChecklistCardHandle } from "@/components/shared/types";

export default function ChecklistDetailPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const checklistId = params.id as string;
  const checklistCardRef = useRef<ChecklistCardHandle>(null);

  const { data: checklist, isLoading, error } = useGetChecklistById(Number(checklistId));

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.user) {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderWrapper />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/checklist')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('detail.back')}
          </Button>
        </div>

        {/* Checklist content */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}

        {error && (
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
        )}

        {checklist && (
          <div className="space-y-6">
            <DragDropContext onDragEnd={onDragEnd}>
              <ChecklistCard ref={checklistCardRef} checklist={checklist} />
            </DragDropContext>
          </div>
        )}
      </main>
    </div>
  );
}
