import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import et from './locales/et.json';
import es from './locales/es.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      et: { translation: et },
      es: { translation: es },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Check cookie first (set by middleware), then localStorage
      order: ['cookie', 'localStorage'],
      caches: ['cookie', 'localStorage'],
      lookupCookie: 'i18nextLng',
      lookupLocalStorage: 'i18nextLng',
    },
    supportedLngs: ['en', 'et', 'es'],
    nonExplicitSupportedLngs: true,
  });

export default i18n;
