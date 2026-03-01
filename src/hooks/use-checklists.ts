'use client';

import useSWR from 'swr';
import { useRef, useCallback, useEffect } from 'react';
import { AxiosError } from 'axios';
import type { ChecklistResponse, ChecklistWithStats } from '@/api/checklistServiceV1.schemas';
import {
  getAllChecklists,
  createChecklist as createChecklistAPI,
  deleteChecklistById,
  updateChecklistById,
} from '@/api/checklist/checklist';
import { createLogger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

const logger = createLogger('UseChecklists');

// Counter for generating unique temporary IDs
let tempIdCounter = 0;

function generateTempId(): number {
  return -++tempIdCounter;
}

async function retryableRequest<T>(fn: () => Promise<T>, maxRetries: number = 1): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (400-499) except 401 (handled by axios)
      if (error instanceof AxiosError && error.response) {
        const status = error.response.status;
        if (status >= 400 && status < 500 && status !== 401) {
          throw error;
        }
      }

      if (attempt < maxRetries) {
        logger.debug(`Request failed, retrying (attempt ${attempt + 1}/${maxRetries})...`);
      }
    }
  }

  throw lastError;
}

interface ChecklistsHookResult {
  checklists: ChecklistWithStats[] | undefined;
  isLoading: boolean;
  error: Error | null;
  createChecklist: (name: string) => Promise<ChecklistResponse | void>;
  deleteChecklist: (checklistId: number) => Promise<void>;
  renameChecklist: (checklistId: number, newName: string) => Promise<void>;
}

interface ChecklistsHookOptions {
  refreshInterval?: number; // Default: 10000 (10 seconds for multi-user sync)
}

export function useChecklists(options: ChecklistsHookOptions = {}): ChecklistsHookResult {
  const { refreshInterval = 10000 } = options;

  // Refs to track checklists and recent deletions to prevent UI flickering
  const checklistsRef = useRef<ChecklistWithStats[]>([]);
  const recentlyDeletedRef = useRef<Set<number>>(new Set());
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data: checklists,
    mutate: mutateChecklists,
    isLoading,
    error,
  } = useSWR<ChecklistWithStats[]>(
    ['checklists'],
    async (): Promise<ChecklistWithStats[]> => {
      const response = await getAllChecklists();
      // Filter out recently deleted checklists to prevent flickering
      return response.checklists.filter(
        (checklist) => !recentlyDeletedRef.current.has(checklist.id),
      );
    },
    {
      refreshInterval,
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  );

  // Keep ref in sync with SWR data
  useEffect(() => {
    checklistsRef.current = checklists ?? [];
  }, [checklists]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  // Helper to filter out recently deleted checklists from any list
  const filterDeleted = useCallback((list: ChecklistWithStats[]): ChecklistWithStats[] => {
    return list.filter((c) => !recentlyDeletedRef.current.has(c.id));
  }, []);

  /**
   * Schedule a debounced refetch after 1500ms
   */
  const scheduleRefetch = useCallback(() => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    refetchTimeoutRef.current = setTimeout(() => {
      logger.debug('Refetching checklists after debounce');
      mutateChecklists();
    }, 1500);
  }, [mutateChecklists]);

  /**
   * Create a new checklist with optimistic update
   */
  const createChecklist = useCallback(
    async (name: string): Promise<ChecklistResponse | void> => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        logger.warn('Attempted to create checklist with empty name');
        return;
      }

      const tempId = generateTempId();

      // Create optimistic checklist
      const optimisticChecklist: ChecklistWithStats = {
        id: tempId,
        name: trimmedName,
        isOwner: true,
        isShared: false,
        stats: { totalItems: 0, completedItems: 0 },
      };

      // Optimistic update - add to list
      mutateChecklists([...checklistsRef.current, optimisticChecklist], { revalidate: false });

      try {
        const created = await retryableRequest(() => createChecklistAPI({ name: trimmedName }), 1);

        logger.info('Checklist created successfully:', created);

        // Replace temp ID with real ID
        const finalChecklists = checklistsRef.current.map((c) => (c.id === tempId ? created : c));
        mutateChecklists(finalChecklists, { revalidate: false });

        scheduleRefetch();
        return created;
      } catch (error) {
        logger.error('Failed to create checklist:', error);

        // Rollback optimistic update
        mutateChecklists(
          checklistsRef.current.filter((c) => c.id !== tempId),
          { revalidate: false },
        );

        toast({
          title: 'Failed to create checklist',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });

        throw error;
      }
    },
    [mutateChecklists, scheduleRefetch],
  );

  /**
   * Delete a checklist with optimistic update
   */
  const deleteChecklist = useCallback(
    async (checklistId: number): Promise<void> => {
      logger.info('Deleting checklist:', checklistId);

      // Track deleted checklist immediately to prevent flickering
      recentlyDeletedRef.current.add(checklistId);

      // Store previous state for rollback
      const previousChecklists = [...checklistsRef.current];

      // Optimistic update - remove from list
      mutateChecklists(filterDeleted(checklistsRef.current), { revalidate: false });

      try {
        await retryableRequest(() => deleteChecklistById(checklistId), 1);

        logger.info('Checklist deleted successfully:', checklistId);

        // Clean up tracking after 10 seconds
        setTimeout(() => {
          recentlyDeletedRef.current.delete(checklistId);
        }, 10000);

        toast({ title: 'Checklist deleted' });
        scheduleRefetch();
      } catch (error) {
        logger.error('Failed to delete checklist:', error);

        // Remove from deleted tracking so it can reappear
        recentlyDeletedRef.current.delete(checklistId);

        // Rollback optimistic update
        mutateChecklists(previousChecklists, { revalidate: false });

        toast({
          title: 'Failed to delete checklist',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });

        throw error;
      }
    },
    [mutateChecklists, scheduleRefetch, filterDeleted],
  );

  /**
   * Rename a checklist with optimistic update
   */
  const renameChecklist = useCallback(
    async (checklistId: number, newName: string): Promise<void> => {
      const trimmedName = newName.trim();
      if (!trimmedName) {
        logger.warn('Attempted to rename checklist with empty name');
        return;
      }

      logger.info('Renaming checklist:', checklistId, 'to:', trimmedName);

      // Store previous state for rollback
      const previousChecklists = [...checklistsRef.current];

      // Optimistic update - rename in list
      mutateChecklists(
        checklistsRef.current.map((c) => (c.id === checklistId ? { ...c, name: trimmedName } : c)),
        { revalidate: false },
      );

      try {
        await retryableRequest(() => updateChecklistById(checklistId, { name: trimmedName }), 1);

        logger.info('Checklist renamed successfully:', checklistId);

        toast({ title: 'Checklist renamed' });
        scheduleRefetch();
      } catch (error) {
        logger.error('Failed to rename checklist:', error);

        // Rollback optimistic update
        mutateChecklists(previousChecklists, { revalidate: false });

        toast({
          title: 'Failed to rename checklist',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });

        throw error;
      }
    },
    [mutateChecklists, scheduleRefetch],
  );

  return {
    checklists,
    isLoading,
    error: error ?? null,
    createChecklist,
    deleteChecklist,
    renameChecklist,
  };
}
