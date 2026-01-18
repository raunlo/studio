"use client";
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
  const currentLanguage = languages.find(lang => lang.code === currentLanguageCode) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-card/90 hover:bg-card border border-border rounded-lg shadow-sm transition-all text-sm font-medium text-foreground"
      >
        <span>{currentLanguage.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-32 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  currentLanguageCode === lang.code
                    ? 'bg-primary/10 text-primary font-medium'
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
