'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { NEXT_PUBLIC_API_BASE_URL } from '@/lib/axios';

const GoogleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mr-2"
  >
    <g clipPath="url(#clip0_17_40)">
      <path
        d="M23.04 12.261c0-.81-.073-1.593-.209-2.348H12v4.448h6.24a5.34 5.34 0 01-2.316 3.51v2.908h3.744c2.19-2.02 3.432-5.002 3.432-8.518z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.963-1.073 7.95-2.91l-3.744-2.908c-1.04.7-2.37 1.12-4.206 1.12-3.23 0-5.97-2.18-6.95-5.11H1.197v3.073A11.997 11.997 0 0012 24z"
        fill="#34A853"
      />
      <path
        d="M5.05 14.202A7.19 7.19 0 014.1 12c0-.76.13-1.498.36-2.202V6.725H1.197A11.997 11.997 0 000 12c0 1.98.48 3.85 1.197 5.275l3.853-3.073z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.77c1.76 0 3.34.604 4.59 1.787l3.43-3.43C17.96 1.073 15.24 0 12 0A11.997 11.997 0 001.197 6.725l3.853 3.073C6.03 6.95 8.77 4.77 12 4.77z"
        fill="#EA4335"
      />
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
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const DocumentIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const UsersIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
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
      setErrorMessage(t('auth.sessionExpired'));
    } else if (error === 'oauth_error') {
      setErrorMessage(t('auth.authenticationFailed'));
    } else if (error) {
      setErrorMessage(t('auth.unknownError'));
    }

    if (error) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [t]);

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
  const isDevMode =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname.includes('.local.com') ||
      process.env.NODE_ENV === 'development');

  return (
    <div className="paper-texture flex min-h-dvh w-full items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-safe">
      {/* Animated decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-16 -top-16 h-64 w-64 animate-pulse rounded-full border border-primary/20"
          style={{ animationDuration: '4s' }}
        />
        <div
          className="absolute right-8 top-1/3 h-32 w-32 animate-pulse rounded-full border border-accent/20"
          style={{ animationDuration: '6s' }}
        />
        <div
          className="absolute -bottom-24 -right-24 h-80 w-80 animate-pulse rounded-full border border-primary/10"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute left-1/4 top-20 h-2 w-2 animate-ping rounded-full bg-primary/40"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute bottom-32 right-1/3 h-2 w-2 animate-ping rounded-full bg-accent/40"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-in">
        {/* Main card - enhanced */}
        <div className="overflow-hidden rounded-3xl border border-border/50 bg-card/95 shadow-2xl backdrop-blur-xl">
          {/* Header section - improved */}
          <div className="relative px-8 pb-6 pt-8 text-center">
            {/* Language selector */}
            <div className="absolute right-4 top-4">
              <LanguageSelector />
            </div>

            {/* Logo with glow effect */}
            <div className="relative mb-4 inline-flex items-center justify-center">
              <div
                className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-2xl"
                style={{ animationDuration: '3s' }}
              />
              <img
                src="/brand/dailychexly-mark.svg"
                alt="DailyChexly"
                width={56}
                height={56}
                className="relative z-10 h-14 w-14 select-none drop-shadow-lg"
                draggable={false}
              />
            </div>

            <h1 className="mb-2 font-headline text-3xl leading-tight tracking-tight text-foreground">
              {t('auth.welcome')}{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-primary text-transparent">
                {t('appName')}
              </span>
            </h1>
            <p className="text-sm font-medium text-muted-foreground">{t('tagline')}</p>
          </div>

          {/* Features section - clean mono-color design */}
          <div className="px-6 py-6">
            <div className="mb-6 grid grid-cols-3 gap-2">
              <div className="group flex cursor-default flex-col items-center justify-start rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent p-3 transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <ShoppingCartIcon />
                </div>
                <p className="text-center text-[11px] font-medium leading-snug text-foreground">
                  {t('auth.featureSell1')}
                </p>
              </div>

              <div className="group flex cursor-default flex-col items-center justify-start rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent p-3 transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <DocumentIcon />
                </div>
                <p className="text-center text-[11px] font-medium leading-snug text-foreground">
                  {t('auth.featureSell2')}
                </p>
              </div>

              <div className="group flex cursor-default flex-col items-center justify-start rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent p-3 transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <UsersIcon />
                </div>
                <p className="text-center text-[11px] font-medium leading-snug text-foreground">
                  {t('auth.featureSell3')}
                </p>
              </div>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                <p className="text-center text-xs font-medium text-destructive">{errorMessage}</p>
              </div>
            )}

            {/* CTA Button - Compact */}
            <button
              data-testid="google-login-button"
              className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-card transition-all duration-300 hover:bg-foreground/90 hover:shadow-lg active:scale-[0.98]"
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
                className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
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
                className="mt-3 w-full rounded-xl border border-dashed border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {t('auth.devLogin')}
              </button>
            )}

            {/* Terms agreement note */}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t('auth.termsAgreement', 'By signing in, you agree to our')}{' '}
              <a href="/terms" className="text-primary hover:underline">
                {t('footer.terms')}
              </a>{' '}
              {t('auth.and', 'and')}{' '}
              <a href="/privacy" className="text-primary hover:underline">
                {t('footer.privacy')}
              </a>
            </p>

            {/* Social proof - happy users */}
            <div className="mt-5 flex items-center justify-center gap-3 border-t border-border/50 pt-5">
              <div className="flex -space-x-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-[8px] font-bold text-white ring-2 ring-card">
                  A
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/70 text-[8px] font-bold text-white ring-2 ring-card">
                  M
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary/50 text-[8px] font-bold text-white ring-2 ring-card">
                  K
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{t('auth.happyUsers')}</span>
              </p>
            </div>

            {/* Privacy & Terms */}
            <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
              <a href="/privacy" className="transition-colors hover:text-foreground">
                Privacy Policy
              </a>
              <span className="text-muted-foreground/30">·</span>
              <a href="/terms" className="transition-colors hover:text-foreground">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
