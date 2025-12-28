"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
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

    // Clear the error parameter from URL to prevent it from persisting
    if (error) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  // Lock body scroll while the login modal/page is visible to prevent background scroll
  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    return () => {
      // Restore previous overflow
      document.body.style.overflow = previousOverflow || '';
    };
  }, []);

  const handleGoogleLogin = () => {
    setErrorMessage(null);
    onLogin?.();
    
    // Check if there's a returnUrl parameter to pass along
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl');
    
    if (returnUrl) {
      // Pass returnUrl to the OAuth flow
      window.location.href = `/api/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`;
    } else {
      window.location.href = '/api/auth/google';
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 animate-fade-in overflow-hidden z-[100] p-4">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-32 h-32 bg-indigo-200 rounded-full opacity-15 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-300 rounded-full opacity-25 animate-ping"></div>
      </div>

      <div className="bg-white/95 px-5 py-6 lg:px-8 lg:py-9 2xl:px-12 2xl:py-12 rounded-3xl shadow-2xl w-full max-w-md lg:max-w-lg 2xl:max-w-xl flex flex-col items-center backdrop-blur-lg border border-gray-100 animate-slide-in relative z-10">
        {/* Language selector in top right corner of modal */}
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>

        <div className="mb-4 lg:mb-5 2xl:mb-6 animate-fade-in relative">
          <div className="relative">
            <img
              src="/brand/dailychexly-mark.svg"
              alt="DailyChexly"
              width={56}
              height={56}
              className="w-14 h-14 lg:w-16 lg:h-16 2xl:w-20 2xl:h-20 drop-shadow-lg select-none"
              draggable={false}
            />
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 lg:w-3.5 lg:h-3.5 2xl:w-4 2xl:h-4 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="text-center mb-5 lg:mb-6 2xl:mb-7">
          <h1 className="text-xl lg:text-3xl 2xl:text-4xl font-black mb-1 lg:mb-2 2xl:mb-3 text-gray-900 tracking-tight leading-tight">
            {t('auth.welcome')} <span className="text-blue-600">{t('appName')}</span>!
          </h1>
          <p className="text-sm lg:text-base 2xl:text-lg text-gray-700 mb-1 lg:mb-1.5 2xl:mb-2 font-medium">🧾 {t('auth.keepLists')}</p>
          <p className="text-xs lg:text-sm 2xl:text-base text-gray-600 leading-snug">
            {t('auth.joinUsers')} <span className="font-bold text-blue-600">{t('auth.thousands')}</span>, {t('tagline')}
          </p>
        </div>

        <div className="w-full space-y-2 lg:space-y-2.5 2xl:space-y-3 mb-5 lg:mb-6 2xl:mb-7">
          <div className="flex items-center gap-2.5 lg:gap-3 2xl:gap-4 w-full px-3 py-2.5 lg:px-4 lg:py-3 2xl:px-5 2xl:py-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm hover:shadow-md transition-all">
            <div className="text-xl lg:text-2xl 2xl:text-3xl flex-shrink-0">🛒</div>
            <span className="text-sm lg:text-base 2xl:text-lg text-gray-900 font-bold">{t('auth.shoppingLists')}</span>
          </div>
          <div className="flex items-center gap-2.5 lg:gap-3 2xl:gap-4 w-full px-3 py-2.5 lg:px-4 lg:py-3 2xl:px-5 2xl:py-4 rounded-xl bg-amber-50 border border-amber-200 shadow-sm hover:shadow-md transition-all">
            <div className="text-xl lg:text-2xl 2xl:text-3xl flex-shrink-0">📚</div>
            <span className="text-sm lg:text-base 2xl:text-lg text-gray-900 font-bold">{t('auth.booksMovies')}</span>
          </div>
          <div className="flex items-center gap-2.5 lg:gap-3 2xl:gap-4 w-full px-3 py-2.5 lg:px-4 lg:py-3 2xl:px-5 2xl:py-4 rounded-xl bg-purple-50 border border-purple-200 shadow-sm hover:shadow-md transition-all">
            <div className="text-xl lg:text-2xl 2xl:text-3xl flex-shrink-0">✅</div>
            <span className="text-sm lg:text-base 2xl:text-lg text-gray-900 font-bold">{t('auth.markCompleted')}</span>
          </div>
        </div>

        {errorMessage && (
          <div className="w-full mb-4 lg:mb-5 2xl:mb-6 p-3 lg:p-3.5 2xl:p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm lg:text-sm 2xl:text-base font-medium text-center">⚠️ {errorMessage}</p>
          </div>
        )}

        <div className="w-full">
          <button
            className="group relative flex items-center justify-center w-full px-6 py-3 lg:px-7 lg:py-3.5 2xl:px-8 2xl:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 font-bold text-base lg:text-base 2xl:text-lg overflow-hidden"
            onClick={handleGoogleLogin}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <GoogleIcon />
            <span className="relative z-10">{t('auth.startFree')}</span>
            <div className="absolute right-4 lg:right-5 2xl:right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-lg lg:text-lg 2xl:text-xl">→</span>
            </div>
          </button>

          <p className="text-center text-xs lg:text-xs 2xl:text-sm text-gray-500 mt-2">{t('auth.oneClick')}</p>
        </div>

        <div className="mt-4 lg:mt-5 2xl:mt-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2.5 lg:gap-3 2xl:gap-4 px-3 py-2 lg:px-4 lg:py-2.5 2xl:px-5 2xl:py-3 bg-gradient-to-r from-emerald-50 via-amber-50 to-purple-50 rounded-full border border-gray-200 shadow-sm">
            <span className="inline-flex items-center">
              <span className="w-7 h-7 lg:w-8 lg:h-8 2xl:w-10 2xl:h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[10px] lg:text-[11px] 2xl:text-xs font-bold shadow-md">JK</span>
              <span className="-ml-1.5 lg:-ml-1.5 2xl:-ml-2 w-7 h-7 lg:w-8 lg:h-8 2xl:w-10 2xl:h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-[10px] lg:text-[11px] 2xl:text-xs font-bold shadow-md">TM</span>
              <span className="-ml-1.5 lg:-ml-1.5 2xl:-ml-2 w-7 h-7 lg:w-8 lg:h-8 2xl:w-10 2xl:h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[10px] lg:text-[11px] 2xl:text-xs font-bold shadow-md">LR</span>
              <span className="-ml-1.5 lg:-ml-1.5 2xl:-ml-2 w-7 h-7 lg:w-8 lg:h-8 2xl:w-10 2xl:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] lg:text-[11px] 2xl:text-xs font-bold shadow-md">+1K</span>
            </span>
            <div className="text-left">
              <p className="text-sm lg:text-sm 2xl:text-base font-bold text-gray-900">{t('auth.happyUsers')}</p>
              <p className="text-xs lg:text-xs 2xl:text-sm text-gray-600">{t('auth.joinCommunity')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
