import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = '@face_app:language';

export type SupportedLanguage = 'en' | 'tr';

export const languageStorage = {
  async get(): Promise<SupportedLanguage | null> {
    try {
      const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
      return lang as SupportedLanguage | null;
    } catch (error) {
      console.error('Failed to load language preference:', error);
      return null;
    }
  },

  async set(language: SupportedLanguage): Promise<void> {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LANGUAGE_KEY);
    } catch (error) {
      console.error('Failed to clear language preference:', error);
    }
  },
};
