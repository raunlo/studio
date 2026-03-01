'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { LoginPage } from '@/components/LoginPage';
import { NEXT_PUBLIC_API_BASE_URL } from '@/lib/axios';

export default function Home() {
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // If we're showing an error, don't check auth (prevents loop)
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setIsChecking(false);
      return;
    }

    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Call backend directly to include session cookie
      const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/session`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.authenticated) {
        // Already authenticated, check for returnUrl parameter
        const params = new URLSearchParams(window.location.search);
        const returnUrl = params.get('returnUrl');

        if (returnUrl) {
          // Decode and redirect to the return URL
          router.replace(decodeURIComponent(returnUrl));
        } else {
          // Default redirect to checklist
          router.replace('/checklist');
        }
        // Don't set isChecking to false - keep showing loading while redirecting
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
    // Only show login page if not authenticated
    setIsChecking(false);
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">{t('main.loading')}</p>
        </div>
      </div>
    );
  }

  return <LoginPage />;
}
