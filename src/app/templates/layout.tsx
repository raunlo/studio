'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface TemplatesLayoutProps {
  children: ReactNode;
}

export default function TemplatesLayout({ children }: TemplatesLayoutProps) {
  const pathname = usePathname();
  const isCreatePage = pathname === '/templates/create';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile-first Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left side - Back button and title */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Link href={isCreatePage ? "/templates" : "/"}>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1 px-2 -ml-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">Tagasi</span>
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
                  {isCreatePage ? 'Loo uus template' : 'Template\'id'}
                </h1>
              </div>
            </div>

            {/* No button in header anymore - moved to page bottom */}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        {children}
      </main>
    </div>
  );
}
