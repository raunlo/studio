"use client";

// Initialize i18n immediately when this module is imported
// This ensures it's ready before any components that use useTranslation()
import('../i18n').catch((err) => {
  console.error('Failed to initialize i18n:', err);
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
