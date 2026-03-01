'use client';
import React, { useEffect, useState } from 'react';
import { HeaderWrapper } from '@/components/ui/HeaderWrapper';
import { LoginPage } from '@/components/LoginPage';
import { NEXT_PUBLIC_API_BASE_URL } from '@/lib/axios';

// Simplified - no PII needed
interface Session {
  authenticated: boolean;
}

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();

    // Also check session when page becomes visible (e.g., after redirect from OAuth callback)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkSession = async () => {
    try {
      // Call backend session endpoint
      // Backend handles session validation and token refresh automatically
      const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/session`, {
        method: 'GET',
        credentials: 'include', // Include session cookie
      });

      if (response.ok) {
        const sessionData = await response.json();
        console.log('Session check result:', sessionData);
        setSession({ authenticated: sessionData.authenticated || false });
      } else {
        // Session is invalid or expired
        setSession({ authenticated: false });
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setSession({ authenticated: false });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.authenticated) {
    return <LoginPage />;
  }

  return (
    <>
      <HeaderWrapper />
      <main className="flex w-full flex-1 flex-col items-center justify-center">{children}</main>
    </>
  );
};
