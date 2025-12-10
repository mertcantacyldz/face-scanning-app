/**
 * Device ID Management with AsyncStorage Fallback
 * Handles device identification using SecureStore (iOS Keychain / Android KeyStore)
 * Falls back to AsyncStorage if SecureStore fails (e.g., in Expo Go)
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'face_scan_device_id';
const DEVICE_ID_SOURCE_KEY = 'face_scan_device_id_source'; // Track which storage was used

type StorageSource = 'secure-store' | 'async-storage' | 'temp';

/**
 * Get or create a unique device ID
 * Strategy:
 * 1. Try SecureStore first (most secure, persists across reinstalls on some platforms)
 * 2. Fall back to AsyncStorage (less secure, but works reliably in Expo Go)
 * 3. Fall back to temp ID if both fail (changes every app launch)
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    // 1. Check SecureStore first
    console.log('🔍 Checking SecureStore for existing device ID...');
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY).catch(err => {
      console.warn('⚠️ SecureStore read error:', err.message);
      return null;
    });

    if (deviceId) {
      console.log('✅ Device ID retrieved from SecureStore:', deviceId);
      await saveStorageSource('secure-store');
      return deviceId;
    }

    console.log('❌ No device ID in SecureStore');

    // 2. Check AsyncStorage (fallback)
    console.log('🔍 Checking AsyncStorage for existing device ID...');
    deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (deviceId) {
      console.log('✅ Device ID retrieved from AsyncStorage (fallback):', deviceId);

      // Try to upgrade to SecureStore
      const upgraded = await tryUpgradeToSecureStore(deviceId);
      if (upgraded) {
        console.log('⬆️ Device ID upgraded to SecureStore');
      }

      return deviceId;
    }

    console.log('❌ No device ID in AsyncStorage');

    // 3. Create new UUID
    deviceId = generateUUID();
    console.log('🆕 New device ID generated:', deviceId);

    // 4. Save to both storages (SecureStore + AsyncStorage)
    const saveResults = await Promise.allSettled([
      SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId).then(() => {
        console.log('✅ Device ID saved to SecureStore');
        return 'secure-store' as StorageSource;
      }),
      AsyncStorage.setItem(DEVICE_ID_KEY, deviceId).then(() => {
        console.log('✅ Device ID saved to AsyncStorage');
        return 'async-storage' as StorageSource;
      })
    ]);

    // Determine which storage succeeded
    const secureStoreResult = saveResults[0];
    const asyncStorageResult = saveResults[1];

    if (secureStoreResult.status === 'fulfilled') {
      await saveStorageSource('secure-store');
      console.log('💾 Primary storage: SecureStore');
    } else if (asyncStorageResult.status === 'fulfilled') {
      await saveStorageSource('async-storage');
      console.log('💾 Primary storage: AsyncStorage (SecureStore failed)');
      console.warn('⚠️ SecureStore error:', secureStoreResult.reason?.message);
    } else {
      await saveStorageSource('temp');
      console.error('❌ Both storages failed!');
      throw new Error('All storage methods failed');
    }

    // 5. Verify at least one storage worked
    const verifySecure = await SecureStore.getItemAsync(DEVICE_ID_KEY).catch(() => null);
    const verifyAsync = await AsyncStorage.getItem(DEVICE_ID_KEY).catch(() => null);

    if (verifySecure === deviceId) {
      console.log('✅ Device ID verified in SecureStore');
    } else if (verifyAsync === deviceId) {
      console.log('✅ Device ID verified in AsyncStorage');
    } else {
      console.warn('⚠️ Device ID verification failed in both storages!');
    }

    return deviceId;
  } catch (error) {
    console.error('❌ Device ID error:', error);
    console.error('Error type:', error instanceof Error ? error.message : String(error));

    // Last resort: memory-only ID (changes every app launch)
    const tempId = `temp-${generateUUID()}`;
    console.warn('⚠️ Using temporary device ID (will change on restart):', tempId);
    await saveStorageSource('temp');
    return tempId;
  }
}

/**
 * Try to upgrade AsyncStorage device ID to SecureStore
 */
async function tryUpgradeToSecureStore(deviceId: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    await saveStorageSource('secure-store');
    return true;
  } catch (error) {
    console.warn('⚠️ Could not upgrade to SecureStore:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Save which storage method is being used (for diagnostics)
 */
async function saveStorageSource(source: StorageSource): Promise<void> {
  try {
    await AsyncStorage.setItem(DEVICE_ID_SOURCE_KEY, source);
  } catch (error) {
    // Non-critical, just for diagnostics
  }
}

/**
 * Get which storage method is currently being used
 */
export async function getStorageSource(): Promise<StorageSource> {
  try {
    const source = await AsyncStorage.getItem(DEVICE_ID_SOURCE_KEY);
    return (source as StorageSource) || 'temp';
  } catch (error) {
    return 'temp';
  }
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get device information (optional, for analytics/debugging)
 */
export async function getDeviceInfo() {
  const storageSource = await getStorageSource();

  return {
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    platform: Platform.OS,
    isDevice: Device.isDevice,
    storageSource, // Which storage is being used for device ID
  };
}

/**
 * Clear device ID from all storages (for testing purposes)
 * WARNING: This will require user to re-authenticate
 */
export async function clearDeviceId(): Promise<void> {
  try {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(DEVICE_ID_KEY),
      AsyncStorage.removeItem(DEVICE_ID_KEY),
      AsyncStorage.removeItem(DEVICE_ID_SOURCE_KEY)
    ]);
    console.log('✅ Device ID cleared from all storages');
  } catch (error) {
    console.error('Error clearing device ID:', error);
  }
}

/**
 * Diagnostic function to test device ID persistence
 */
export async function testDeviceId(): Promise<void> {
  console.log('═══════════════════════════════════════');
  console.log('     DEVICE ID DIAGNOSTIC TEST');
  console.log('═══════════════════════════════════════');

  // Get current device ID
  const deviceId = await getOrCreateDeviceId();
  console.log('📱 Current Device ID:', deviceId);

  // Check both storages directly
  const secureStoreValue = await SecureStore.getItemAsync(DEVICE_ID_KEY).catch(err => {
    console.log('❌ SecureStore read error:', err.message);
    return null;
  });
  const asyncStorageValue = await AsyncStorage.getItem(DEVICE_ID_KEY);
  const storageSource = await getStorageSource();

  console.log('');
  console.log('📦 Storage Status:');
  console.log('  - SecureStore:', secureStoreValue ? '✅ ' + secureStoreValue : '❌ Empty');
  console.log('  - AsyncStorage:', asyncStorageValue ? '✅ ' + asyncStorageValue : '❌ Empty');
  console.log('  - Primary Source:', storageSource);

  // Get device info
  const info = await getDeviceInfo();
  console.log('');
  console.log('🔧 Device Info:');
  console.log('  - Platform:', info.platform);
  console.log('  - OS:', info.osName, info.osVersion);
  console.log('  - Device:', info.modelName);
  console.log('  - Is Physical Device:', info.isDevice);

  console.log('═══════════════════════════════════════');
  console.log('');

  // Recommendations
  if (storageSource === 'temp') {
    console.warn('⚠️ WARNING: Using temporary device ID!');
    console.warn('   This will change on every app restart.');
    console.warn('   Recommendation: Use development build instead of Expo Go.');
  } else if (storageSource === 'async-storage') {
    console.warn('⚠️ INFO: Using AsyncStorage (SecureStore failed).');
    console.warn('   Device ID will persist, but less secure.');
    console.warn('   This is normal in Expo Go, will use SecureStore in production.');
  } else {
    console.log('✅ SUCCESS: Using SecureStore (most secure).');
  }
}
