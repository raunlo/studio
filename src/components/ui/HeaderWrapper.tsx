"use client";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/ui/Header";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export const HeaderWrapper = () => {
  const [user, setUser] = useState<User | null>(null);

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
    try {
      // Call backend logout endpoint to clear cookies
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
      
      // Clear session
      await fetch('/api/auth/session', { method: 'DELETE' });
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout fails
      window.location.href = '/login';
    }
  };

  const userInfo = user ? {
    name: user.name || "Unknown User",
    avatarUrl: user.image || undefined
  } : undefined;

  return <Header user={userInfo} onLogin={handleLogin} onLogout={handleLogout} />;
};
