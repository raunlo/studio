"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginPage } from "@/components/LoginPage";

export default function Home() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If we're showing an error, don't check auth (prevents loop)
    const params = new URLSearchParams(window.location.search);
    if (params.get('error')) {
      setIsChecking(false);
      setIsAuthenticated(false);
      return;
    }
    
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.user) {
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
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return <LoginPage />;
}
