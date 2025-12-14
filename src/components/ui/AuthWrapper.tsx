"use client";
import React, { useEffect, useState } from "react";
import { HeaderWrapper } from "@/components/ui/HeaderWrapper";
import LoginPage from "@/app/login/page";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Session {
  user: User | null;
  expires?: string;
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
      const response = await fetch('/api/auth/session');
      const sessionData = await response.json();
      console.log('Session check result:', sessionData);
      
      // If session needs token refresh, try to refresh the token
      if (sessionData.needsTokenRefresh) {
        console.log('Token needs refresh, attempting refresh...');
        try {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });
          if (refreshResponse.ok) {
            // Refresh successful, re-check session
            const refreshedResponse = await fetch('/api/auth/session');
            const refreshedSession = await refreshedResponse.json();
            setSession(refreshedSession);
          } else {
            // Refresh failed, user needs to re-authenticate
            setSession({ user: null });
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          setSession({ user: null });
        }
      } else {
        setSession(sessionData);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setSession({ user: null });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    return <LoginPage onLogin={() => {}} />;
  }

  return (
    <>
      <HeaderWrapper />
      <main className="flex-1 flex flex-col justify-center items-center w-full">
        {children}
      </main>
    </>
  );
};
