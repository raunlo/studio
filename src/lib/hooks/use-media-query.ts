'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect media query matches
 * Server-safe implementation that defaults to false during SSR
 *
 * @param query - Media query string (e.g., "(max-width: 768px)")
 * @returns boolean indicating if the media query matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create listener for changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Use addEventListener if available (modern browsers)
    // Fallback to addListener for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      // @ts-ignore - Fallback for older browsers
      mediaQuery.addListener(listener);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener);
      } else {
        // @ts-ignore - Fallback for older browsers
        mediaQuery.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Convenience hook to detect mobile devices
 * @returns true if screen width is less than 768px
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}
