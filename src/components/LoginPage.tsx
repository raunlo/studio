"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { NEXT_PUBLIC_API_BASE_URL } from "@/lib/axios";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <g clipPath="url(#clip0_17_40)">
      <path d="M23.04 12.261c0-.81-.073-1.593-.209-2.348H12v4.448h6.24a5.34 5.34 0 01-2.316 3.51v2.908h3.744c2.19-2.02 3.432-5.002 3.432-8.518z" fill="#4285F4" />
      <path d="M12 24c3.24 0 5.963-1.073 7.95-2.91l-3.744-2.908c-1.04.7-2.37 1.12-4.206 1.12-3.23 0-5.97-2.18-6.95-5.11H1.197v3.073A11.997 11.997 0 0012 24z" fill="#34A853" />
      <path d="M5.05 14.202A7.19 7.19 0 014.1 12c0-.76.13-1.498.36-2.202V6.725H1.197A11.997 11.997 0 000 12c0 1.98.48 3.85 1.197 5.275l3.853-3.073z" fill="#FBBC05" />
      <path d="M12 4.77c1.76 0 3.34.604 4.59 1.787l3.43-3.43C17.96 1.073 15.24 0 12 0A11.997 11.997 0 001.197 6.725l3.853 3.073C6.03 6.95 8.77 4.77 12 4.77z" fill="#EA4335" />
    </g>
    <defs>
      <clipPath id="clip0_17_40">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// Feature icons optimized for general list management
const ShoppingCartIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const UsersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export interface LoginPageProps {
  onLogin?: () => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error === 'session_expired') {
      setErrorMessage('Your session has expired. Please sign in again.');
    } else if (error === 'oauth_error') {
      setErrorMessage('Authentication failed. Please try again.');
    } else if (error) {
      setErrorMessage('An error occurred. Please try signing in again.');
    }

    if (error) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow || '';
    };
  }, []);

  const handleGoogleLogin = () => {
    setErrorMessage(null);
    onLogin?.();
    window.location.href = `${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/google/login`;
  };

  const handleDevLogin = () => {
    setErrorMessage(null);
    onLogin?.();
    window.location.href = `${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/dev/login`;
  };

  // Check if dev mode is enabled (localhost or DEV_AUTH_BYPASS env)
  const isDevMode = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('.local.com') ||
    process.env.NODE_ENV === 'development'
  );

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 paper-texture overflow-hidden p-4 pb-safe">
      {/* Animated decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -left-16 w-64 h-64 border border-primary/20 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 right-8 w-32 h-32 border border-accent/20 rounded-full animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 border border-primary/10 rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 right-1/3 w-2 h-2 bg-accent/40 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-in">
        {/* Main card - enhanced */}
        <div className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
          {/* Header section - improved */}
          <div className="px-8 pt-8 pb-6 text-center relative">
            {/* Language selector */}
            <div className="absolute top-4 right-4">
              <LanguageSelector />
            </div>
            
            {/* Logo with glow effect */}
            <div className="inline-flex items-center justify-center mb-4 relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
              <img
                src="/brand/dailychexly-mark.svg"
                alt="DailyChexly"
                width={56}
                height={56}
                className="w-14 h-14 select-none relative z-10 drop-shadow-lg"
                draggable={false}
              />
            </div>

            <h1 className="text-3xl font-headline text-foreground mb-2 tracking-tight leading-tight">
              {t('auth.welcome')} <span className="text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{t('appName')}</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              {t('tagline')}
            </p>
          </div>

          {/* Features section - clean mono-color design */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="group flex flex-col items-center justify-start p-3 rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-md cursor-default">
                <div className="w-10 h-10 mb-2 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCartIcon />
                </div>
                <p className="text-[11px] font-medium text-foreground text-center leading-snug">{t('auth.featureSell1')}</p>
              </div>

              <div className="group flex flex-col items-center justify-start p-3 rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-md cursor-default">
                <div className="w-10 h-10 mb-2 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                  <DocumentIcon />
                </div>
                <p className="text-[11px] font-medium text-foreground text-center leading-snug">{t('auth.featureSell2')}</p>
              </div>

              <div className="group flex flex-col items-center justify-start p-3 rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-md cursor-default">
                <div className="w-10 h-10 mb-2 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                  <UsersIcon />
                </div>
                <p className="text-[11px] font-medium text-foreground text-center leading-snug">{t('auth.featureSell3')}</p>
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="mb-5 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-xs font-medium text-center">{errorMessage}</p>
              </div>
            )}

            {/* CTA Button - Compact */}
            <button
              data-testid="google-login-button"
              className="group relative flex items-center justify-center w-full px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden bg-foreground text-card hover:shadow-lg hover:bg-foreground/90 active:scale-[0.98]"
              onClick={handleGoogleLogin}
            >
              <GoogleIcon />
              <span>{t('auth.startFree')}</span>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="ml-2 group-hover:translate-x-1 transition-transform duration-300"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            {/* Dev login - only in development */}
            {isDevMode && (
              <button
                data-testid="dev-login-button"
                onClick={handleDevLogin}
                className="mt-3 w-full px-5 py-2.5 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                Dev Login (Skip Auth)
              </button>
            )}

            {/* Terms agreement note */}
            <p className="text-center text-xs text-muted-foreground mt-3">
              {t('auth.termsAgreement', 'By signing in, you agree to our')}{' '}
              <a href="/terms" className="text-primary hover:underline">{t('footer.terms')}</a>
              {' '}{t('auth.and', 'and')}{' '}
              <a href="/privacy" className="text-primary hover:underline">{t('footer.privacy')}</a>
            </p>

            {/* Social proof - happy users */}
            <div className="flex items-center justify-center gap-3 mt-5 pt-5 border-t border-border/50">
              <div className="flex -space-x-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-card">A</div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-card">M</div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/80 to-primary/50 flex items-center justify-center text-[8px] font-bold text-white ring-2 ring-card">K</div>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{t('auth.happyUsers')}</span>
              </p>
            </div>

            {/* Privacy & Terms */}
            <div className="flex items-center justify-center gap-3 mt-3 text-[11px] text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <span className="text-muted-foreground/30">·</span>
              <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
