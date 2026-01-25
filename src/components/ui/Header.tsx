"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { LanguageSelector } from "./LanguageSelector";

interface HeaderProps {
  user?: {
    authenticated: boolean;
    name?: string;
    email?: string;
  };
  onLogin: () => void;
  onLogout: () => void;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const Header = ({ user, onLogin, onLogout }: HeaderProps) => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 animate-fade-in">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 max-w-7xl mx-auto">
        {/* Brand */}
        <Link
          href="/checklist"
          className="flex items-center gap-2.5 sm:gap-3 group"
        >
          <div className="relative flex-shrink-0">
            <img
              src="/brand/dailychexly-mark.svg"
              alt="DailyChexly"
              width={40}
              height={40}
              className="h-9 w-9 sm:h-10 sm:w-10 select-none transition-transform group-hover:scale-105"
              draggable={false}
            />
          </div>
          <span className="text-xl sm:text-2xl font-headline text-foreground tracking-tight">
            DailyChexly
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden sm:flex items-center gap-4" suppressHydrationWarning>
          <LanguageSelector />

          {user && (
            <div className="flex items-center gap-3 pl-4 border-l border-border/50">
              {/* User initials avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
                <span className="text-sm font-medium text-primary-foreground">
                  {getInitials(user.name)}
                </span>
              </div>

              {/* User name */}
              {user.name && (
                <span className="text-sm font-medium text-foreground hidden lg:block">
                  {user.name}
                </span>
              )}

              {/* Sign out button */}
              <button
                className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                onClick={onLogout}
                title={t('auth.signOut') || 'Sign out'}
              >
                {t('auth.signOut') || 'Sign out'}
              </button>
            </div>
          )}
        </div>

        {/* Mobile navigation */}
        {user && (
          <div className="flex sm:hidden items-center gap-2" suppressHydrationWarning>
            <LanguageSelector />

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                  />
                )}
              </svg>
            </button>

            {/* Mobile dropdown */}
            {isMobileMenuOpen && (
              <div className="absolute top-full right-0 left-0 mt-px bg-card border-b border-border shadow-lg animate-fade-in">
                <div className="p-4 max-w-7xl mx-auto">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
                    {/* User initials avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
                      <span className="text-lg font-medium text-primary-foreground">
                        {getInitials(user.name)}
                      </span>
                    </div>
                    <div>
                      {user.name && (
                        <p className="font-medium text-foreground">{user.name}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {user.email || t('auth.signedIn') || 'Signed in'}
                      </p>
                    </div>
                  </div>

                  <button
                    className="w-full px-4 py-3 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                  >
                    {t('auth.signOut') || 'Sign out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
