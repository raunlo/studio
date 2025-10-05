"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto max-w-2xl p-2 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-semibold">CL</div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold">Checklist</div>
              <div className="text-xs text-muted-foreground">Organize your tasks</div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Browse templates: visible on all sizes (mobile shows icon+text) */}
          <Link href="/templates" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <BookOpen className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sirvi template'e</span>
            <span className="sm:hidden">Template'id</span>
          </Link>

         
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
