import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import ptBRTranslation from './locales/pt-BR/translation.json';

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      'pt-BR': {
        translation: ptBRTranslation
      }
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      order: ['path', 'localStorage', 'navigator', 'htmlTag'],
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
      checkWhitelist: true
    },
    // Force English as default language if none is set
    lng: 'en'
  });

export default i18n;