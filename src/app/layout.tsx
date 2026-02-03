import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from "@/components/providers";
import { HeaderWrapper } from "@/components/ui/HeaderWrapper";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

export const metadata: Metadata = {
  title: 'DailyChexly',
  description: 'DailyChexly – keep your lists always at hand.',
  manifest: '/manifest.json',
  themeColor: '#3D9A8B',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DailyChexly',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-background">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-dvh bg-background">
        <Providers>
          <HeaderWrapper />
          <main className="min-h-dvh bg-background">
            {children}
          </main>
        </Providers>
        <Toaster />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
