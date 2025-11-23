"use client";
import React, { useState, useEffect } from 'react';
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
      setIsOpen(false);
    }
  };

  // Get browser language and find the best match
  const getBrowserLanguage = () => {
    if (typeof window === 'undefined') return 'en';
    
    const browserLang = navigator.language.toLowerCase();
    const browserLangCode = browserLang.split('-')[0]; // Get 'en' from 'en-US'
    
    // Check if we support the exact language code
    const supportedCodes = languages.map(lang => lang.code);
    if (supportedCodes.includes(browserLangCode)) {
      return browserLangCode;
    }
    
    // Default to English if not supported
    return 'en';
  };

  // Auto-set browser language on first load if no language is set
  useEffect(() => {
    if (i18n && !localStorage.getItem('i18nextLng')) {
      const browserLang = getBrowserLanguage();
      if (browserLang !== i18n.language) {
        i18n.changeLanguage(browserLang);
      }
    }
  }, [i18n]);

  const currentLanguageCode = i18n?.language || getBrowserLanguage();
  const currentLanguage = languages.find(lang => lang.code === currentLanguageCode) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/90 hover:bg-white border border-gray-200 rounded-lg shadow-sm transition-all text-sm font-medium text-gray-700 hover:text-gray-900"
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
          <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  currentLanguageCode === lang.code
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
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
