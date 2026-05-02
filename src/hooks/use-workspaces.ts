'use client';

import useSWR from 'swr';
import { useRef, useCallback, useEffect } from 'react';
import { AxiosError } from 'axios';
import type { WorkspaceResponse } from '@/api/checklistServiceV1.schemas';
import {
  getAllWorkspaces,
  createWorkspace as createWorkspaceAPI,
  deleteWorkspace as deleteWorkspaceAPI,
  updateWorkspace as updateWorkspaceAPI,
} from '@/api/workspace/workspace';
import { createLogger } from '@/lib/logger';
import { toast } from '@/hooks/use-toast';

const logger = createLogger('UseWorkspaces');

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

interface WorkspacesHookResult {
  workspaces: WorkspaceResponse[] | undefined;
  isLoading: boolean;
  error: Error | null;
  createWorkspace: (name: string, description?: string) => Promise<WorkspaceResponse | void>;
  deleteWorkspace: (workspaceId: number) => Promise<void>;
  renameWorkspace: (workspaceId: number, newName: string) => Promise<void>;
  mutateWorkspaces: () => void;
}

interface WorkspacesHookOptions {
  refreshInterval?: number;
}

export function useWorkspaces(options: WorkspacesHookOptions = {}): WorkspacesHookResult {
  const { refreshInterval = 10000 } = options;

  const workspacesRef = useRef<WorkspaceResponse[]>([]);
  const recentlyDeletedRef = useRef<Set<number>>(new Set());
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data: workspaces,
    mutate: mutateWorkspaces,
    isLoading,
    error,
  } = useSWR<WorkspaceResponse[]>(
    ['workspaces'],
    async (): Promise<WorkspaceResponse[]> => {
      const response = await getAllWorkspaces();
      return response.filter((w) => !recentlyDeletedRef.current.has(w.id));
    },
    {
      refreshInterval,
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    workspacesRef.current = workspaces ?? [];
  }, [workspaces]);

  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  const filterDeleted = useCallback((list: WorkspaceResponse[]): WorkspaceResponse[] => {
    return list.filter((w) => !recentlyDeletedRef.current.has(w.id));
  }, []);

  const scheduleRefetch = useCallback(() => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    refetchTimeoutRef.current = setTimeout(() => {
      logger.debug('Refetching workspaces after debounce');
      mutateWorkspaces();
    }, 1500);
  }, [mutateWorkspaces]);

  const createWorkspace = useCallback(
    async (name: string, description?: string): Promise<WorkspaceResponse | void> => {
      const trimmedName = name.trim();
      if (!trimmedName) return;

      const tempId = generateTempId();

      const optimisticWorkspace: WorkspaceResponse = {
        id: tempId,
        name: trimmedName,
        description: description ?? null,
        isOwner: true,
        isDefault: false,
        memberCount: 1,
      };

      mutateWorkspaces([...workspacesRef.current, optimisticWorkspace], { revalidate: false });

      try {
        const created = await retryableRequest(
          () => createWorkspaceAPI({ name: trimmedName, description }),
          1,
        );

        const finalWorkspaces = workspacesRef.current.map((w) =>
          w.id === tempId ? created : w,
        );
        mutateWorkspaces(finalWorkspaces, { revalidate: false });

        scheduleRefetch();
        return created;
      } catch (error) {
        logger.error('Failed to create workspace:', error);

        mutateWorkspaces(
          workspacesRef.current.filter((w) => w.id !== tempId),
          { revalidate: false },
        );

        toast({
          title: 'Failed to create workspace',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });

        throw error;
      }
    },
    [mutateWorkspaces, scheduleRefetch],
  );

  const deleteWorkspace = useCallback(
    async (workspaceId: number): Promise<void> => {
      recentlyDeletedRef.current.add(workspaceId);
      const previousWorkspaces = [...workspacesRef.current];

      mutateWorkspaces(filterDeleted(workspacesRef.current), { revalidate: false });

      try {
        await retryableRequest(() => deleteWorkspaceAPI(workspaceId), 1);

        setTimeout(() => {
          recentlyDeletedRef.current.delete(workspaceId);
        }, 10000);

        toast({ title: 'Workspace deleted' });
        scheduleRefetch();
      } catch (error) {
        logger.error('Failed to delete workspace:', error);

        recentlyDeletedRef.current.delete(workspaceId);
        mutateWorkspaces(previousWorkspaces, { revalidate: false });

        toast({
          title: 'Failed to delete workspace',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });

        throw error;
      }
    },
    [mutateWorkspaces, scheduleRefetch, filterDeleted],
  );

  const renameWorkspace = useCallback(
    async (workspaceId: number, newName: string): Promise<void> => {
      const trimmedName = newName.trim();
      if (!trimmedName) return;

      const previousWorkspaces = [...workspacesRef.current];

      mutateWorkspaces(
        workspacesRef.current.map((w) =>
          w.id === workspaceId ? { ...w, name: trimmedName } : w,
        ),
        { revalidate: false },
      );

      try {
        await retryableRequest(
          () => updateWorkspaceAPI(workspaceId, { name: trimmedName }),
          1,
        );

        toast({ title: 'Workspace renamed' });
        scheduleRefetch();
      } catch (error) {
        logger.error('Failed to rename workspace:', error);

        mutateWorkspaces(previousWorkspaces, { revalidate: false });

        toast({
          title: 'Failed to rename workspace',
          description: error instanceof Error ? error.message : 'Please try again',
          variant: 'destructive',
        });

        throw error;
      }
    },
    [mutateWorkspaces, scheduleRefetch],
  );

  return {
    workspaces,
    isLoading,
    error: error ?? null,
    createWorkspace,
    deleteWorkspace,
    renameWorkspace,
    mutateWorkspaces,
  };
}
