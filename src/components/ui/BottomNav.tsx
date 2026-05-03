'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ListChecks, FileText, Users2 } from 'lucide-react';

const tabs = [
  { href: '/checklist', labelKey: 'nav.checklists', fallback: 'Lists', icon: ListChecks },
  { href: '/templates', labelKey: 'nav.templates', fallback: 'Templates', icon: FileText },
  { href: '/workspaces', labelKey: 'nav.workspaces', fallback: 'Circles', icon: Users2 },
];

interface BottomNavProps {
  isAuthenticated: boolean;
}

export function BottomNav({ isAuthenticated }: BottomNavProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  // Hide bottom nav when a specific checklist is open
  const checklistDetailPattern = /^\/checklist\/[^/]+/;
  if (checklistDetailPattern.test(pathname)) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {tabs.map(({ href, labelKey, fallback, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span>{t(labelKey, fallback)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
