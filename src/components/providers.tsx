"use client";

import React, { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [i18nReady, setI18nReady] = useState(false);
  const [i18nError, setI18nError] = useState<Error | null>(null);

  useEffect(() => {
    import('../i18n')
      .then(() => setI18nReady(true))
      .catch((err) => {
        console.error('Failed to initialize i18n:', err);
        setI18nError(err);
      });
  }, []);

  if (i18nError) {
    return <div>Sorry, something went wrong initializing translations.</div>;
  }

  if (!i18nReady) {
    return null; // Don't show anything while loading
  }
  return <>{children}</>;
}
