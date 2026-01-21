// contexts/DeviceContext.tsx
/**
 * DeviceContext - Centralized Device ID Management
 *
 * Purpose:
 * - Get device ID once at app start
 * - Expose via context to avoid multiple async calls
 * - Prevent race conditions from multiple components calling getOrCreateDeviceId()
 */

import { getOrCreateDeviceId, getStorageSource } from '@/lib/device-id-with-fallback';
import React, { createContext, useContext, useEffect, useState } from 'react';

type StorageSource = 'secure-store' | 'async-storage' | 'temp';

interface DeviceContextValue {
  deviceId: string | null;
  isLoading: boolean;
  storageSource: StorageSource | null;
}

const DeviceContext = createContext<DeviceContextValue>({
  deviceId: null,
  isLoading: true,
  storageSource: null,
});

interface DeviceProviderProps {
  children: React.ReactNode;
}

export function DeviceProvider({ children }: DeviceProviderProps) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageSource, setStorageSource] = useState<StorageSource | null>(null);

  useEffect(() => {
    const initializeDeviceId = async () => {
      try {
        console.log('📱 DeviceContext: Initializing device ID...');

        const id = await getOrCreateDeviceId();
        const source = await getStorageSource();

        setDeviceId(id);
        setStorageSource(source);

        console.log('📱 DeviceContext: Device ID ready:', id);
        console.log('📱 DeviceContext: Storage source:', source);
      } catch (error) {
        console.error('📱 DeviceContext: Error getting device ID:', error);
        // Even on error, set loading to false
      } finally {
        setIsLoading(false);
      }
    };

    initializeDeviceId();
  }, []);

  return (
    <DeviceContext.Provider value={{ deviceId, isLoading, storageSource }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within DeviceProvider');
  }
  return context;
}

export default DeviceContext;
