import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from "@/components/providers";
import { HeaderWrapper } from "@/components/ui/HeaderWrapper";

export const metadata: Metadata = {
  title: 'DailyChexly',
  description: 'DailyChexly – keep your lists always at hand.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full flex flex-col overflow-x-hidden">
        <Providers>
          <HeaderWrapper />
          <main className="flex-1 flex flex-col w-full overflow-y-auto">
            {children}
          </main>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
