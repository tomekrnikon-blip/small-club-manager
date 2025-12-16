import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import pl from '@/locales/pl.json';
import en from '@/locales/en.json';
import de from '@/locales/de.json';

const LANGUAGE_KEY = 'app_language';

export const languages = [
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
] as const;

export type LanguageCode = typeof languages[number]['code'];

const resources = {
  pl: { translation: pl },
  en: { translation: en },
  de: { translation: de },
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pl', // Default language
    fallbackLng: 'pl',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Load saved language preference
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && ['pl', 'en', 'de'].includes(savedLanguage)) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Failed to load saved language:', error);
  }
};

// Change language and save preference
export const changeLanguage = async (languageCode: LanguageCode) => {
  try {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

// Get current language
export const getCurrentLanguage = (): LanguageCode => {
  return i18n.language as LanguageCode;
};

export default i18n;
