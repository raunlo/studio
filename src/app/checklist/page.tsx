"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeaderWrapper } from "@/components/ui/HeaderWrapper";
import { ChecklistOverview } from "@/components/checklist-overview";

export default function ChecklistPage() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.user) {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderWrapper />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <ChecklistOverview />
      </main>
    </div>
  );
}
