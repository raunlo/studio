'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChecklistOverview } from '@/components/checklist-overview';
import { NEXT_PUBLIC_API_BASE_URL } from '@/lib/axios';

export default function ChecklistPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Call backend directly (not through Next.js proxy) to include session cookie
      const response = await fetch(`${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/session`, {
        credentials: 'include', // Important: send cookies cross-origin
      });
      const data = await response.json();

      if (data.authenticated) {
        setIsAuthenticated(true);
      } else {
        // Not authenticated, redirect to login
        router.replace('/');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.replace('/');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <ChecklistOverview />
      </div>
    </div>
  );
}
