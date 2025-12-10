// Simple storage adapter for Supabase auth
// Wraps AsyncStorage with error handling to prevent hanging

import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMEOUT_MS = 2000; // 2 second timeout for storage operations

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Storage operation timeout')), timeoutMs)
    ),
  ]);
}

export const simpleStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await withTimeout(AsyncStorage.getItem(key), TIMEOUT_MS);
      return value;
    } catch (error) {
      console.warn(`Storage getItem timeout for key: ${key}`);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await withTimeout(AsyncStorage.setItem(key, value), TIMEOUT_MS);
    } catch (error) {
      console.warn(`Storage setItem timeout for key: ${key}`);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await withTimeout(AsyncStorage.removeItem(key), TIMEOUT_MS);
    } catch (error) {
      console.warn(`Storage removeItem timeout for key: ${key}`);
    }
  },
};
