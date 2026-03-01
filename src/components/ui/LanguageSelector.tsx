'use client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const LanguageSelectorComponent = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Add null safety check AFTER all hooks are called
  if (!i18n) {
    return null;
  }

  const languages = [
    { code: 'et', name: 'Eesti' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
  ];

  const changeLanguage = (lng: string) => {
    if (i18n && i18n.changeLanguage) {
      i18n.changeLanguage(lng);
      // Also set cookie for middleware on next request
      document.cookie = `i18nextLng=${lng};path=/;max-age=31536000;SameSite=Lax`;
      setIsOpen(false);
    }
  };

  const currentLanguageCode = i18n?.language || 'en';
  const currentLanguage =
    languages.find((lang) => lang.code === currentLanguageCode) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card/90 px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-card"
      >
        <span>{currentLanguage.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown menu */}
          <div className="absolute right-0 z-20 mt-2 w-32 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  currentLanguageCode === lang.code
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const LanguageSelector = React.memo(LanguageSelectorComponent);
