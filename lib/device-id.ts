/**
 * Device ID Management
 * Handles device identification using SecureStore (iOS Keychain / Android KeyStore)
 */

import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'face_scan_device_id';

/**
 * Get or create a unique device ID
 * Uses SecureStore to persist across app reinstalls (on some platforms)
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    // 1. Check if device ID already exists
    console.log('🔍 Checking for existing device ID...');
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (deviceId) {
      console.log('✅ Device ID retrieved from SecureStore:', deviceId);
      return deviceId;
    }

    console.log('❌ No existing device ID found');

    // 2. Create new UUID
    deviceId = generateUUID();
    console.log('🆕 New device ID generated:', deviceId);

    // 3. Save to SecureStore (iOS Keychain / Android KeyStore)
    console.log('💾 Saving device ID to SecureStore...');
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    console.log('✅ Device ID saved successfully');

    // 4. Verify it was saved
    const verifyId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (verifyId === deviceId) {
      console.log('✅ Device ID verified in SecureStore');
    } else {
      console.warn('⚠️ Device ID verification failed! Saved:', deviceId, 'Retrieved:', verifyId);
    }

    return deviceId;
  } catch (error) {
    console.error('❌ Device ID error:', error);
    console.error('Error type:', error instanceof Error ? error.message : String(error));

    // Fallback: memory-only ID (changes every app launch)
    const tempId = `temp-${generateUUID()}`;
    console.warn('⚠️ Using temporary device ID (will change on restart):', tempId);
    return tempId;
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
  return {
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    platform: Platform.OS,
    isDevice: Device.isDevice,
  };
}

/**
 * Clear device ID (for testing purposes)
 * WARNING: This will require user to re-authenticate
 */
export async function clearDeviceId(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
    console.log('Device ID cleared');
  } catch (error) {
    console.error('Error clearing device ID:', error);
  }
}
