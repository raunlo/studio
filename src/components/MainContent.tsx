'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChecklistManager } from '@/components/checklist-manager';
import { HeaderWrapper } from '@/components/ui/HeaderWrapper';
import Link from 'next/link';

export const MainContent = () => {
  const { t, ready } = useTranslation();

  return (
    <>
      <HeaderWrapper />
      <div className="flex min-h-screen flex-col">
        <main className="min-h-screen flex-grow overflow-x-hidden bg-background font-body text-foreground">
          <div className="container mx-auto max-w-2xl p-2 sm:p-6 md:p-8">
            <header className="mb-8 text-center md:mb-12">
              <h1 className="font-headline text-4xl font-bold text-foreground md:text-5xl">
                {ready ? t('main.title') : 'Checklist'}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                {ready
                  ? t('main.subtitle')
                  : 'Organize checklist here using drag and drop to order your items.'}
              </p>
            </header>
            <ChecklistManager />
          </div>
        </main>
        <footer className="mt-auto w-full border-t border-border bg-background">
          <div className="container mx-auto flex max-w-2xl items-center justify-center p-4 text-sm text-muted-foreground">
            <div className="flex gap-4">
              <Link href="/terms" className="transition-colors hover:text-foreground">
                {ready ? t('footer.terms') : 'Terms of Service'}
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                {ready ? t('footer.privacy') : 'Privacy Policy'}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};
