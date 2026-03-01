'use client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { LanguageSelector } from './LanguageSelector';

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
    <header className="sticky top-0 z-50 animate-fade-in border-b border-border/50 bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        {/* Brand */}
        <Link href="/checklist" className="group flex items-center gap-2.5 sm:gap-3">
          <div className="relative flex-shrink-0">
            <img
              src="/brand/dailychexly-mark.svg"
              alt="DailyChexly"
              width={40}
              height={40}
              className="h-9 w-9 select-none transition-transform group-hover:scale-105 sm:h-10 sm:w-10"
              draggable={false}
            />
          </div>
          <span className="font-headline text-xl tracking-tight text-foreground sm:text-2xl">
            DailyChexly
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-4 sm:flex" suppressHydrationWarning>
          <LanguageSelector />

          {user && (
            <div className="flex items-center gap-3 border-l border-border/50 pl-4">
              {/* User initials avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-sm">
                <span className="text-sm font-medium text-primary-foreground">
                  {getInitials(user.name)}
                </span>
              </div>

              {/* User name */}
              {user.name && (
                <span className="hidden text-sm font-medium text-foreground lg:block">
                  {user.name}
                </span>
              )}

              {/* Sign out button */}
              <button
                className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
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
          <div className="flex items-center gap-2 sm:hidden" suppressHydrationWarning>
            <LanguageSelector />

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-muted"
              aria-label="Menu"
            >
              <svg
                className="h-6 w-6 text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
              <div className="absolute left-0 right-0 top-full mt-px animate-fade-in border-b border-border bg-card shadow-lg">
                <div className="mx-auto max-w-7xl p-4">
                  <div className="mb-4 flex items-center gap-3 border-b border-border/50 pb-4">
                    {/* User initials avatar */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-sm">
                      <span className="text-lg font-medium text-primary-foreground">
                        {getInitials(user.name)}
                      </span>
                    </div>
                    <div>
                      {user.name && <p className="font-medium text-foreground">{user.name}</p>}
                      <p className="text-sm text-muted-foreground">
                        {user.email || t('auth.signedIn') || 'Signed in'}
                      </p>
                    </div>
                  </div>

                  <button
                    className="w-full rounded-lg bg-muted px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
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
