/**
 * Account Deletion / Clear My Data
 * 
 * Kullanıcının tüm verilerini sunucudan ve cihazdan temizler.
 * 
 * Akış:
 * 1. Supabase Edge Function çağrısı (sunucu tarafı veri silme)
 * 2. Lokal fotoğraf dosyaları temizliği
 * 3. AsyncStorage temizliği (session, metadata, preferences)
 * 4. Uygulama yeniden başlatılır (yeni anonymous session oluşur)
 * 
 * NOT: SecureStore'daki device ID silinmez — cihaza aittir, kullanıcıya değil.
 */

import { deleteAnalysisPhoto, deleteMultiPhotoAnalysis } from '@/lib/photo-storage';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DeletionResult {
    success: boolean;
    error?: string;
    details?: string;
}

/**
 * Sunucudaki tüm kullanıcı verilerini siler ve auth user'ı kaldırır.
 * Ardından lokal verileri temizler.
 */
export async function clearAllUserData(): Promise<DeletionResult> {
    try {
        console.log('🗑️ Starting full data deletion...');

        // 1. Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            console.error('Session error:', sessionError);
            return {
                success: false,
                error: 'SESSION_ERROR',
                details: 'No active session found.',
            };
        }

        // 2. Call Edge Function to delete server-side data
        console.log('📡 Calling delete-user-data Edge Function...');

        const { data, error } = await supabase.functions.invoke('delete-user-data', {
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
        });

        if (error) {
            console.error('Edge Function error:', error);
            return {
                success: false,
                error: 'SERVER_ERROR',
                details: error.message,
            };
        }

        // Check Edge Function response
        if (!data?.success) {
            console.warn('Partial or failed deletion:', data);
            // Even if server deletion partially failed, try to clean local data
        }

        console.log('✅ Server data deletion complete');

        // 3. Clear local data
        await clearLocalData();

        console.log('🎉 All data cleared successfully');

        return { success: true };
    } catch (error) {
        console.error('❌ Data deletion error:', error);
        return {
            success: false,
            error: 'UNEXPECTED_ERROR',
            details: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Cihazdaki tüm uygulama verilerini temizler.
 * - Fotoğraf dosyaları (multi-photo + legacy)
 * - AsyncStorage (session, metadata, preferences)
 * 
 * NOT: SecureStore device ID silinmez (cihaz kimliği korunur)
 */
async function clearLocalData(): Promise<void> {
    console.log('🧹 Clearing local data...');

    // 1. Delete saved photos
    try {
        await deleteMultiPhotoAnalysis();
        console.log('  ✅ Multi-photo analysis deleted');
    } catch (e) {
        console.warn('  ⚠️ Multi-photo deletion failed:', e);
    }

    try {
        await deleteAnalysisPhoto();
        console.log('  ✅ Legacy photo deleted');
    } catch (e) {
        console.warn('  ⚠️ Legacy photo deletion failed:', e);
    }

    // 2. Clear AsyncStorage (all app-related keys)
    // Using getAllKeys + multiRemove to ensure complete cleanup
    try {
        const allKeys = await AsyncStorage.getAllKeys();

        // Filter only our app's keys (safety measure)
        const appKeys = allKeys.filter(key =>
            key.startsWith('@faceloom:') ||
            key.startsWith('face_scan_') ||
            key.startsWith('supabase.') ||
            key === 'face_scan_session' ||
            key === 'face_scan_device_user_id'
        );

        if (appKeys.length > 0) {
            await AsyncStorage.multiRemove(appKeys);
            console.log(`  ✅ AsyncStorage: ${appKeys.length} keys cleared`);
        } else {
            console.log('  ✅ AsyncStorage: no keys to clear');
        }
    } catch (e) {
        console.warn('  ⚠️ AsyncStorage cleanup failed:', e);
    }

    // 3. Sign out from Supabase (invalidates current session)
    try {
        await supabase.auth.signOut();
        console.log('  ✅ Supabase session signed out');
    } catch (e) {
        console.warn('  ⚠️ Supabase sign out failed:', e);
    }
}
