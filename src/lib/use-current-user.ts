'use client';
import { useState, useEffect } from 'react';
import { NEXT_PUBLIC_API_BASE_URL, getCsrfToken, markLoggingOut } from '@/lib/axios';

interface CurrentUser {
  authenticated: boolean;
  name?: string;
  email?: string;
}

let cachedUser: CurrentUser | null = null;
let fetchPromise: Promise<CurrentUser | null> | null = null;

async function fetchUser(): Promise<CurrentUser | null> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/session`, { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
      cachedUser = data.authenticated ? { authenticated: true, name: data.user?.name, email: data.user?.email } : null;
      fetchPromise = null;
      return cachedUser;
    })
    .catch(() => { fetchPromise = null; return null; });
  return fetchPromise;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(cachedUser);

  useEffect(() => {
    if (!cachedUser) {
      fetchUser().then(setUser);
    }
  }, []);

  const logout = async () => {
    markLoggingOut();
    const csrfToken = getCsrfToken();
    try {
      await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      });
    } catch {}
    cachedUser = null;
    window.location.replace('/');
  };

  return { user, logout };
}
