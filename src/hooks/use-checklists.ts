"use client";

import useSWR from "swr";
import { useRef, useCallback } from "react";
import { AxiosError } from "axios";
import type { ChecklistResponse, ChecklistWithStats, CreateChecklistRequest } from "@/api/checklistServiceV1.schemas";
import {
  getAllChecklists,
  createChecklist as createChecklistAPI,
  deleteChecklistById,
  updateChecklistById,
} from "@/api/checklist/checklist";
import { createLogger } from "@/lib/logger";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

const logger = createLogger('UseChecklists');

// Request deduplication map
const inFlightRequests = new Map<string, Promise<unknown>>();

async function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)! as Promise<T>;
  }
  const promise = fn().finally(() => inFlightRequests.delete(key));
  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Retryable request wrapper
 * @param fn - Function to execute
 * @param maxRetries - Maximum number of retries (default: 1)
 * @returns Promise with retry logic
 */
async function retryableRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 1
): Promise<T> {
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

      // Log retry attempt
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

export function useChecklists(
  options: ChecklistsHookOptions = {}
): ChecklistsHookResult {
  const { refreshInterval = 10000 } = options;

  // Refs to track checklists and recent operations to prevent duplicates
  const checklistsRef = useRef<ChecklistWithStats[]>([]);
  const recentlyCreatedChecklistsRef = useRef<Set<number>>(new Set());
  const recentlyDeletedChecklistsRef = useRef<Set<number>>(new Set());
  const recentlyRenamedChecklistsRef = useRef<Map<number, string>>(new Map());

  // Ref to track rapid operations and debounce refetching
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: checklists, mutate: mutateChecklists, isLoading, error } = useSWR<ChecklistWithStats[]>(
    ['checklists'],
    async (): Promise<ChecklistWithStats[]> => {
      const res = await dedupeRequest<ChecklistWithStats[]>(
        'get-all-checklists',
        async () => {
          const response = await getAllChecklists();
          return response.checklists;
        }
      );
      return res;
    },
    {
      refreshInterval,
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  );

  // Keep ref in sync with SWR data
  useEffect(() => {
    checklistsRef.current = checklists ?? [];
  }, [checklists]);

  /**
   * Schedule a debounced refetch
   * Optionally update UI immediately, then refetch after 1500ms
   */
  const scheduleRefetch = useCallback((options: { updatedChecklists?: ChecklistWithStats[] } = {}) => {
    const { updatedChecklists } = options;

    logger.debug('scheduleRefetch called with options:', options);

    // Update the UI immediately if provided
    if (updatedChecklists) {
      mutateChecklists(updatedChecklists, { revalidate: false });
    }

    // Debounced API call
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    refetchTimeoutRef.current = setTimeout(() => {
      logger.debug('Calling API after debounce.');
      void (async () => {
        try {
          mutateChecklists(); // Fetch fresh data from API
        } catch (e) {
          logger.error('Error during API call:', e);
        }
      })();
    }, 1500); // 1500ms debounce
  }, [mutateChecklists]);

  /**
   * Create a new checklist with optimistic update
   */
  const createChecklist = useCallback(async (name: string): Promise<ChecklistResponse | void> => {
    if (!name.trim()) {
      logger.warn('Attempted to create checklist with empty name');
      return;
    }

    // Generate temporary negative ID
    const tempId = -Date.now() - Math.random() * 1000;

    // Create optimistic checklist
    const optimisticChecklist: ChecklistWithStats = {
      id: tempId,
      name: name.trim(),
      isOwner: true,
      isShared: false,
      stats: { totalItems: 0, completedItems: 0 },
    };

    // Optimistic update - add to list
    const updatedChecklists = [...checklistsRef.current, optimisticChecklist];
    mutateChecklists(updatedChecklists, { revalidate: false });

    try {
      // API call with retry wrapper
      const created = await retryableRequest<ChecklistResponse>(
        () => createChecklistAPI({ name: name.trim() }),
        1 // max 1 retry
      );

      logger.info('Checklist created successfully:', created);

      // Replace temp ID with real ID
      const finalChecklists = checklistsRef.current.map(c =>
        c.id === tempId ? created : c
      );

      // Track created checklist to prevent SSE duplication (for future SSE support)
      recentlyCreatedChecklistsRef.current.add(created.id);
      setTimeout(() => {
        recentlyCreatedChecklistsRef.current.delete(created.id);
      }, 5000);

      // Update UI with real data
      mutateChecklists(finalChecklists, { revalidate: false });

      // Debounced refetch to get authoritative state
      scheduleRefetch();

      return created;

    } catch (error) {
      logger.error('Failed to create checklist:', error);

      // Rollback optimistic update
      const rolledBack = checklistsRef.current.filter(c => c.id !== tempId);
      mutateChecklists(rolledBack, { revalidate: false });

      // Show error toast
      toast({
        title: 'Failed to create checklist',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });

      throw error;
    }
  }, [mutateChecklists, scheduleRefetch]);

  /**
   * Delete a checklist with optimistic update
   */
  const deleteChecklist = useCallback(async (checklistId: number): Promise<void> => {
    logger.info('Deleting checklist:', checklistId);

    // Store previous state for rollback
    const previousChecklists = [...checklistsRef.current];

    // Optimistic update - remove from list
    const updatedChecklists = checklistsRef.current.filter(c => c.id !== checklistId);
    mutateChecklists(updatedChecklists, { revalidate: false });

    try {
      // API call with retry wrapper
      await retryableRequest(
        () => deleteChecklistById(checklistId),
        1 // max 1 retry
      );

      logger.info('Checklist deleted successfully:', checklistId);

      // Track deleted checklist to prevent SSE duplication (for future SSE support)
      recentlyDeletedChecklistsRef.current.add(checklistId);
      setTimeout(() => {
        recentlyDeletedChecklistsRef.current.delete(checklistId);
      }, 5000);

      // Debounced refetch to sync authoritative state
      scheduleRefetch();

      // Show success toast
      toast({
        title: 'Checklist deleted',
      });

    } catch (error) {
      logger.error('Failed to delete checklist:', error);

      // Rollback optimistic update
      mutateChecklists(previousChecklists, { revalidate: false });

      // Show error toast
      toast({
        title: 'Failed to delete checklist',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });

      throw error;
    }
  }, [mutateChecklists, scheduleRefetch]);

  /**
   * Rename a checklist with optimistic update
   */
  const renameChecklist = useCallback(async (checklistId: number, newName: string): Promise<void> => {
    if (!newName.trim()) {
      logger.warn('Attempted to rename checklist with empty name');
      return;
    }

    logger.info('Renaming checklist:', checklistId, 'to:', newName);

    // Store previous state for rollback
    const previousChecklists = [...checklistsRef.current];

    // Optimistic update - rename in list
    const updatedChecklists = checklistsRef.current.map(c =>
      c.id === checklistId ? { ...c, name: newName.trim() } : c
    );
    mutateChecklists(updatedChecklists, { revalidate: false });

    try {
      // API call with retry wrapper
      await retryableRequest(
        () => updateChecklistById(checklistId, { name: newName.trim() }),
        1 // max 1 retry
      );

      logger.info('Checklist renamed successfully:', checklistId);

      // Track renamed checklist to prevent SSE duplication (for future SSE support)
      recentlyRenamedChecklistsRef.current.set(checklistId, newName.trim());
      setTimeout(() => {
        recentlyRenamedChecklistsRef.current.delete(checklistId);
      }, 5000);

      // Debounced refetch to sync authoritative state
      scheduleRefetch();

      // Show success toast
      toast({
        title: 'Checklist renamed',
      });

    } catch (error) {
      logger.error('Failed to rename checklist:', error);

      // Rollback optimistic update
      mutateChecklists(previousChecklists, { revalidate: false });

      // Show error toast
      toast({
        title: 'Failed to rename checklist',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });

      throw error;
    }
  }, [mutateChecklists, scheduleRefetch]);

  return {
    checklists,
    isLoading,
    error: error ?? null,
    createChecklist,
    deleteChecklist,
    renameChecklist,
  };
}
