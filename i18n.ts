import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Platform } from 'react-native';
import bn from './assets/locales/bn.json';
import de from './assets/locales/de.json';
import en from './assets/locales/en.json';
import es from './assets/locales/es.json';
import fr from './assets/locales/fr.json';
import hi from './assets/locales/hi.json';
import mr from './assets/locales/mr.json';
import pa from './assets/locales/pa.json';
import ta from './assets/locales/ta.json';
import te from './assets/locales/te.json';

const resources = {
    en,
    hi,
    pa,
    es,
    fr,
    de,
    bn,
    ta,
    te,
    mr
};

const LANGUAGE_KEY = 'app_language';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,

  detect: async (callback: (lang: string) => void) => {
  try {
    // 🔥 SSR SAFE CHECK (most important line)
    if (typeof window === 'undefined') {
      return callback('en');
    }

    if (Platform.OS === 'web') {
      const savedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage) return callback(savedLanguage);

      const browserLang = window.navigator.language?.split('-')[0];
      return callback(browserLang || 'en');
    }

    // 📱 Mobile (Android / iOS)
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage) return callback(savedLanguage);

    const locales = Localization.getLocales();
    const deviceLanguage =
      locales && locales.length > 0
        ? locales[0].languageCode
        : 'en';

    callback(deviceLanguage || 'en');
  } catch (error) {
    console.log('Error detecting language:', error);
    callback('en');
  }
},

cacheUserLanguage: async (language: string) => {
  try {
    // 🔥 SSR SAFE CHECK
    if (typeof window === 'undefined') return;

    if (Platform.OS === 'web') {
      window.localStorage.setItem(LANGUAGE_KEY, language);
    } else {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    }
  } catch (error) {
    console.log('Error caching language:', error);
  }
},
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

export default i18n;
