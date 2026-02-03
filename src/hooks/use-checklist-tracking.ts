"use client";

import { useRef, useEffect, useCallback } from "react";
import { getClientId } from "@/lib/axios";

/**
 * Hook to manage tracking refs for checklist operations.
 * Handles cleanup on unmount to prevent memory leaks.
 */
export function useChecklistTracking() {
  // Refs to track items and recent operations to prevent duplicates
  const recentlyAddedItemsRef = useRef<Set<number>>(new Set());
  const recentlyReorderedItemsRef = useRef<Set<string>>(new Set());
  const recentlyDeletedItemsRef = useRef<Set<number>>(new Set());
  const recentlyToggledItemsRef = useRef<Set<number>>(new Set());
  const highlightTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const cleanupTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientIdRef = useRef<string>('');

  // Initialize client ID lazily to avoid SSR issues
  if (typeof window !== 'undefined' && !clientIdRef.current) {
    clientIdRef.current = getClientId();
  }

  // Track a timeout for cleanup
  const trackTimeout = useCallback((timeout: NodeJS.Timeout) => {
    cleanupTimeoutsRef.current.add(timeout);
    return timeout;
  }, []);

  // Remove a timeout from tracking
  const untrackTimeout = useCallback((timeout: NodeJS.Timeout) => {
    cleanupTimeoutsRef.current.delete(timeout);
  }, []);

  // Create a tracked timeout that auto-removes itself
  const createTrackedTimeout = useCallback((fn: () => void, delay: number): NodeJS.Timeout => {
    const timeout = setTimeout(() => {
      fn();
      cleanupTimeoutsRef.current.delete(timeout);
    }, delay);
    cleanupTimeoutsRef.current.add(timeout);
    return timeout;
  }, []);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear refetch timeout
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
      // Clear all highlight timeouts
      highlightTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      highlightTimeoutsRef.current.clear();
      // Clear all cleanup timeouts
      cleanupTimeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      cleanupTimeoutsRef.current.clear();
      // Clear tracking sets
      recentlyAddedItemsRef.current.clear();
      recentlyDeletedItemsRef.current.clear();
      recentlyReorderedItemsRef.current.clear();
      recentlyToggledItemsRef.current.clear();
    };
  }, []);

  return {
    recentlyAddedItemsRef,
    recentlyReorderedItemsRef,
    recentlyDeletedItemsRef,
    recentlyToggledItemsRef,
    highlightTimeoutsRef,
    cleanupTimeoutsRef,
    refetchTimeoutRef,
    clientIdRef,
    trackTimeout,
    untrackTimeout,
    createTrackedTimeout,
  };
}

export type ChecklistTracking = ReturnType<typeof useChecklistTracking>;
