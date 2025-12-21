"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserInfo, UserInfoProps } from "./UserInfo";
import { LanguageSelector } from "./LanguageSelector";

interface HeaderProps {
  user?: UserInfoProps;
  onLogin: () => void;
  onLogout: () => void;
}

export const Header = ({ user, onLogin, onLogout }: HeaderProps) => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-white/95 shadow-lg backdrop-blur-lg border-b border-gray-100 animate-fade-in">
      {/* Left side - Brand */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <div className="relative flex-shrink-0">
          <img
            src="/brand/dailychexly-mark.svg"
            alt="DailyChexly"
            width={40}
            height={40}
            className="h-8 w-8 sm:h-10 sm:w-10 select-none"
            draggable={false}
          />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <span className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight whitespace-nowrap">
          DailyChexly
        </span>
      </div>

      {/* Right side - Desktop view */}
      <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
        <LanguageSelector />
        {user ? (
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl shadow-sm">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
              )}
            </div>
            
            {/* Name */}
            <span className="text-base font-semibold text-gray-900 whitespace-nowrap">
              {user.name.split(' ')[0]}
            </span>
            
            {/* Logout button */}
            <button
              className="ml-1 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all font-semibold text-sm whitespace-nowrap"
              onClick={onLogout}
              title={t('auth.signOut') || 'Sign out'}
            >
              {t('auth.signOut') || 'Sign out'}
            </button>
          </div>
        ) : null}
      </div>

      {/* Right side - Mobile view */}
      <div className="flex sm:hidden items-center gap-2">
        <LanguageSelector />
        {user && (
          <>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Mobile dropdown menu */}
            {isMobileMenuOpen && (
              <div className="absolute top-full right-0 mt-2 mr-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[60] animate-fade-in">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3 mb-4">
                    {user.avatarUrl && (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                      />
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">
                        {user.name.split(' ')[0]}
                      </div>
                      <div className="text-xs text-gray-600">
                        {user.name}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-semibold text-sm"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onLogout();
                    }}
                  >
                    {t('auth.signOut') || 'Logi välja'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};