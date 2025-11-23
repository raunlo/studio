"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { LoginButton } from "./LoginButton";
import { UserInfo, UserInfoProps } from "./UserInfo";
import { LanguageSelector } from "./LanguageSelector";

const BrandIcon = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#2563EB"/>
    <path d="M16 24L22 30L32 20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface HeaderProps {
  user?: UserInfoProps;
  onLogin: () => void;
  onLogout: () => void;
}

export const Header = ({ user, onLogin, onLogout }: HeaderProps) => {
  const { t } = useTranslation();
  
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white/95 shadow-lg backdrop-blur-lg border-b border-gray-100 animate-fade-in relative">
      {/* Left side - Brand */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <BrandIcon />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <span className="text-2xl font-black text-gray-900 tracking-tight drop-shadow animate-slide-in">
          {t('appName') || 'Checklist'}
        </span>
      </div>

      {/* Right side - User actions */}
      <div className="flex items-center gap-4">
        <LanguageSelector />
        {user ? (
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl shadow-sm">
            <div className="group relative">
              <div className="transition-all duration-300 group-hover:scale-110">
                <UserInfo name={user.name} avatarUrl={user.avatarUrl} />
              </div>
              <div className="absolute hidden group-hover:flex flex-col items-center mt-2 right-0 z-10">
                <span className="bg-white/95 text-gray-900 px-3 py-2 rounded-lg shadow-lg border border-gray-200 animate-fade-in font-semibold text-sm">
                  👋 {t('auth.hello') || 'Hello'}, {user.name}!
                </span>
              </div>
            </div>
            <button
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all font-semibold text-sm"
              onClick={onLogout}
            >
              {t('auth.signOut') || 'Sign out'}
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl shadow-sm">
            <LoginButton onClick={onLogin} />
          </div>
        )}
      </div>
    </header>
  );
};
