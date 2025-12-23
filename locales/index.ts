import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { languageStorage, type SupportedLanguage } from '@/lib/language-storage';

// Import all translation files
import enCommon from './en/common.json';
import enAuth from './en/auth.json';
import enTabs from './en/tabs.json';
import enProfile from './en/profile.json';
import enAnalysis from './en/analysis.json';
import enProgress from './en/progress.json';
import enHome from './en/home.json';
import enPremium from './en/premium.json';
import enExercises from './en/exercises.json';
import enErrors from './en/errors.json';

import trCommon from './tr/common.json';
import trAuth from './tr/auth.json';
import trTabs from './tr/tabs.json';
import trProfile from './tr/profile.json';
import trAnalysis from './tr/analysis.json';
import trProgress from './tr/progress.json';
import trHome from './tr/home.json';
import trPremium from './tr/premium.json';
import trExercises from './tr/exercises.json';
import trErrors from './tr/errors.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    tabs: enTabs,
    profile: enProfile,
    analysis: enAnalysis,
    progress: enProgress,
    home: enHome,
    premium: enPremium,
    exercises: enExercises,
    errors: enErrors,
  },
  tr: {
    common: trCommon,
    auth: trAuth,
    tabs: trTabs,
    profile: trProfile,
    analysis: trAnalysis,
    progress: trProgress,
    home: trHome,
    premium: trPremium,
    exercises: trExercises,
    errors: trErrors,
  },
};

// Determine initial language
async function getInitialLanguage(): Promise<SupportedLanguage> {
  // 1. Check saved preference
  const savedLang = await languageStorage.get();
  if (savedLang) return savedLang;

  // 2. Check device language
  const deviceLang = Localization.getLocales()[0]?.languageCode;
  if (deviceLang === 'tr' || deviceLang === 'en') {
    return deviceLang as SupportedLanguage;
  }

  // 3. Default to English (user preference)
  return 'en';
}

// Initialize i18next
export async function initializeI18n() {
  const initialLanguage = await getInitialLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      defaultNS: 'common',
      ns: ['common', 'auth', 'tabs', 'profile', 'analysis', 'progress', 'home', 'premium', 'exercises', 'errors'],
      interpolation: {
        escapeValue: false, // React already escapes
      },
      react: {
        useSuspense: false, // Important for React Native
      },
    });

  return i18n;
}

export default i18n;
