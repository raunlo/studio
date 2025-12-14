import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useMemo } from 'react';

// Stable translation hook that prevents hooks order issues
export function useStableTranslation() {
  const { t, ready, i18n } = useI18nTranslation();
  
  // Memoize translation function to prevent re-renders
  const stableT = useMemo(() => {
    return (key: string, fallback?: string) => {
      if (!ready) {
        return fallback || key;
      }
      return t(key);
    };
  }, [t, ready]);
  
  return {
    t: stableT,
    ready,
    i18n,
    changeLanguage: i18n.changeLanguage
  };
}

// Alternative: Simple translation function without hooks
export function getTranslation(key: string, fallback?: string): string {
  try {
    // Try to get translation without using hooks
    const i18n = require('react-i18next').default;
    if (i18n.isInitialized) {
      return i18n.t(key);
    }
    return fallback || key;
  } catch {
    return fallback || key;
  }
}
