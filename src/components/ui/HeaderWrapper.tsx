"use client";
import React, { useEffect, useState } from "react";
import { Header } from "@/components/ui/Header";
import { markLoggingOut, NEXT_PUBLIC_API_BASE_URL, getCsrfToken } from '@/lib/axios';

// User interface with profile info from backend
interface User {
  authenticated: boolean;
  name?: string;
  email?: string;
  needsAgeVerify?: boolean;
}

export const HeaderWrapper = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Call backend directly to include session cookie
      const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/session`, {
        credentials: 'include',
      });
      const sessionData = await response.json();
      // Store authentication + user profile data
      if (sessionData.authenticated) {
        const userData: User = {
          authenticated: true,
          name: sessionData.user?.name,
          email: sessionData.user?.email,
          needsAgeVerify: sessionData.user?.needsAgeVerify,
        };
        setUser(userData);

        // Check if age verification is pending from login
        const pendingVerification = sessionStorage.getItem('pending_age_verification');
        if (pendingVerification === 'true' && sessionData.user?.needsAgeVerify) {
          // Call verify endpoint
          try {
            await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/user/verify-age`, {
              method: 'POST',
              credentials: 'include',
            });
            // Remove pending flag
            sessionStorage.removeItem('pending_age_verification');
            // Refresh session to get updated status
            await checkSession();
          } catch (error) {
            console.error('Age verification failed:', error);
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
    }
  };

  const handleLogin = () => {
    window.location.href = `${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/google/login`;
  };

  const handleLogout = async () => {
    // Prevent any in-flight 401 handlers from redirecting while we're intentionally logging out.
    markLoggingOut();

    const logoutUrl = `${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/logout`;
    const csrfToken = getCsrfToken();

    try {
      // Call logout endpoint with CSRF token
      await fetch(logoutUrl, {
        method: 'POST',
        credentials: 'include',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      });
    } catch (error) {
      console.error('[Logout] Request failed:', error);
    }

    // Navigate to home page after logout completes
    window.location.replace('/');
  };

  if (isLoggingOut || !user) {
    return null;
  }

  return <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />;
};
