'use client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListChecks, FileText, Users2 } from 'lucide-react';
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

const navLinks = [
  { href: '/checklist', labelKey: 'nav.checklists', fallback: 'Checklists', icon: ListChecks },
  { href: '/templates', labelKey: 'nav.templates', fallback: 'Templates', icon: FileText },
  { href: '/workspaces', labelKey: 'nav.workspaces', fallback: 'Circles', icon: Users2 },
];

export const Header = ({ user, onLogin, onLogout }: HeaderProps) => {
  const { t } = useTranslation();
  const pathname = usePathname();
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
          {user && (
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t(link.labelKey, link.fallback)}
                  </Link>
                );
              })}
            </nav>
          )}

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

        {/* Mobile: language + avatar button with logout dropdown */}
        {user && (
          <div className="flex items-center gap-2 md:hidden" suppressHydrationWarning>
            <LanguageSelector />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-sm"
              aria-label="Account"
            >
              <span className="text-sm font-medium text-primary-foreground">
                {getInitials(user.name)}
              </span>
            </button>

            {/* Mobile dropdown — only logout, no nav links */}
            {isMobileMenuOpen && (
              <div className="absolute left-0 right-0 top-full mt-px animate-fade-in border-b border-border bg-card shadow-lg">
                <div className="mx-auto max-w-7xl p-4">
                  <div className="mb-4 flex items-center gap-3 border-b border-border/50 pb-4">
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
