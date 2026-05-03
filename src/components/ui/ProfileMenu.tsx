'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '@/lib/use-current-user';

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].charAt(0).toUpperCase()
    : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const LANGUAGES = [
  { code: 'et', label: 'Eesti' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

export function ProfileMenu() {
  const { user, logout } = useCurrentUser();
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowLang(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user?.authenticated) return null;

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[1];

  const changeLang = (code: string) => {
    i18n.changeLanguage(code);
    document.cookie = `i18nextLng=${code};path=/;max-age=31536000;SameSite=Lax`;
    setShowLang(false);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => { setOpen(v => !v); setShowLang(false); }}
        className={`flex h-[38px] w-[38px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 font-headline text-sm font-semibold text-primary-foreground transition-all ${open ? 'ring-2 ring-primary/20 border-2 border-primary' : 'border-2 border-border'}`}
      >
        {getInitials(user.name)}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-elevated)] animate-slide-in">
          {/* User info */}
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{user.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
          </div>

          {/* Language */}
          {!showLang ? (
            <button
              onClick={() => setShowLang(true)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Language
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{currentLang.label}</span>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/60"><polyline points="9 18 15 12 9 6"/></svg>
              </span>
            </button>
          ) : (
            <div>
              <button
                onClick={() => setShowLang(false)}
                className="flex w-full items-center gap-2 border-b border-border px-4 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back
              </button>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => changeLang(l.code)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {l.label}
                  {l.code === i18n.language && (
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="h-px bg-border" />

          {/* Logout */}
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/6 transition-colors"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
