"use client";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/ui/Header";
import { useRouter } from 'next/navigation';
import { markLoggingOut } from '@/lib/axios';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export const HeaderWrapper = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const sessionData = await response.json();
      setUser(sessionData.user);
    } catch (error) {
      console.error('Session check failed:', error);
    }
  };

  const handleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleLogout = async () => {
    // Prevent any in-flight 401 handlers from redirecting while we're intentionally logging out.
    markLoggingOut();
    setIsLoggingOut(true);

    // Optimistically update UI immediately so header can't stay in "logged in" state.
    setUser(null);

    // Navigate immediately to avoid showing any intermediate UI states.
    // We still clear cookies in the background.
    window.location.replace('/');

    // Fire-and-forget cookie/session cleanup.
    // NOTE: this will very likely be interrupted by navigation, but that's OK because:
    // 1) the user experience is instant
    // 2) the server-side cookies will still be cleared once the request is sent
    // 3) refresh/session-expired redirects are guarded via markLoggingOut()
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
    }).catch(() => undefined);

  fetch('/api/auth/session', { method: 'DELETE', keepalive: true }).catch(() => undefined);

    // Best-effort refresh (may not run if navigation already happened)
    try {
      router.refresh();
    } catch {
      // ignore
    }
  };

  const userInfo = user ? {
    name: user.name || "Unknown User",
    avatarUrl: user.image || undefined
  } : undefined;

  if (isLoggingOut) {
    return null;
  }

  return <Header user={userInfo} onLogin={handleLogin} onLogout={handleLogout} />;
};
