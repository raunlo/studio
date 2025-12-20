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
  useTranslation();
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
  }, []);

  const handleGoogleLogin = () => {
    setErrorMessage(null);
    onLogin?.();
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 animate-fade-in relative overflow-hidden">
      <div className="absolute top-6 right-6 z-20">
        <LanguageSelector />
      </div>

      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-32 h-32 bg-indigo-200 rounded-full opacity-15 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-blue-300 rounded-full opacity-25 animate-ping"></div>
      </div>

      <div className="bg-white/95 p-12 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col items-center backdrop-blur-lg border border-gray-100 animate-slide-in relative z-10">
        <div className="mb-6 animate-fade-in relative">
          <div className="relative">
            <img
              src="/brand/dailychexly-mark.svg"
              alt="DailyChexly"
              width={64}
              height={64}
              className="drop-shadow-lg select-none"
              draggable={false}
            />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-3 text-gray-900 tracking-tight">
            Tere tulemast <span className="text-blue-600">DailyChexly</span>!
          </h1>
          <p className="text-xl text-gray-700 mb-4 font-medium">🧾 Hoia oma nimekirjad alati käepärast</p>
          <p className="text-lg text-gray-600 leading-relaxed">
            Liitu <span className="font-bold text-blue-600">tuhandete kasutajatega</span>, kes hoiavad oma ostunimekirju, raamatuid ja muid asju nutikalt meeles
          </p>
        </div>

        <div className="w-full space-y-3 mb-6">
          <div className="flex items-center gap-4 w-full px-6 py-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black">🛒</div>
            <span className="text-gray-900 font-bold">Ostunimekirjad ja toidumenüüd</span>
          </div>
          <div className="flex items-center gap-4 w-full px-6 py-4 rounded-2xl bg-blue-50/80 border border-blue-100 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black">📚</div>
            <span className="text-gray-900 font-bold">Raamatud ja filmid mida tahad</span>
          </div>
          <div className="flex items-center gap-4 w-full px-6 py-4 rounded-2xl bg-purple-50/80 border border-purple-100 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-black">✅</div>
            <span className="text-gray-900 font-bold">Märgi ostetud/loetud/vaadatud</span>
          </div>
        </div>

        {errorMessage && (
          <div className="w-full mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium text-center">⚠️ {errorMessage}</p>
          </div>
        )}

        <div className="w-full">
          <button
            className="group relative flex items-center justify-center w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 font-bold text-lg overflow-hidden"
            onClick={handleGoogleLogin}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <GoogleIcon />
            <span className="relative z-10">Hakka nimekirju pidama TASUTA!</span>
            <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-xl">→</span>
            </div>
          </button>

          <p className="text-center text-sm text-gray-500 mt-3">🛒 Lihtsalt üks klikk ja alusta kohe!</p>
        </div>

        <div className="mt-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-gray-700 font-bold">
            <span className="inline-flex items-center">
              <span className="w-4 h-4 rounded-full bg-blue-500"></span>
              <span className="-ml-1.5 w-4 h-4 rounded-full bg-green-500"></span>
              <span className="-ml-1.5 w-4 h-4 rounded-full bg-purple-500"></span>
              <span className="-ml-1.5 w-4 h-4 rounded-full bg-pink-500"></span>
            </span>
            <span>1000+ rahul kasutajat</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Liitu meie kasvava kogukonnaga juba täna! 🌟</p>
        </div>
      </div>
    </div>
  );
};
