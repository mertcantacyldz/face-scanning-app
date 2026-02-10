// lib/photo-storage.ts
// Kullanıcının analiz için kullandığı fotoğrafı cihazda kalıcı olarak saklar
// Privacy: Fotoğraf sadece cihazda kalır, sunucuya gönderilmez
// Multi-photo desteği: 3 fotoğraf için ayrı dosyalar

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Paths, File, Directory } from 'expo-file-system';

// Single photo (legacy)
const PHOTO_METADATA_KEY = '@faceloom:photo_metadata';
const PHOTO_FILENAME = 'analysis_photo.jpg';
const PHOTO_DIR_NAME = 'photos';

// Multi-photo
const MULTI_PHOTO_METADATA_KEY = '@faceloom:multi_photo_metadata';
const MULTI_PHOTO_FILENAMES = [
  'analysis_photo_0.jpg',
  'analysis_photo_1.jpg',
  'analysis_photo_2.jpg',
] as const;

export interface PhotoMetadata {
  uri: string;
  savedAt: string;
  faceAnalysisId?: string;
}

// Multi-photo types
export interface MultiPhotoItem {
  uri: string;
  index: 0 | 1 | 2;
}

export interface MultiPhotoMetadata {
  photos: MultiPhotoItem[];
  savedAt: string;
  faceAnalysisId: string;
  consistencyScore: number;
}

// Fotoğrafların kaydedileceği dizin
const getPhotoDirectory = (): Directory => {
  return new Directory(Paths.document, PHOTO_DIR_NAME);
};

// Fotoğraf File nesnesi
const getPhotoFile = (): File => {
  return new File(getPhotoDirectory(), PHOTO_FILENAME);
};

/**
 * Fotoğrafı kalıcı dizine kaydet
 */
export const saveAnalysisPhoto = async (
  sourceUri: string,
  faceAnalysisId?: string
): Promise<PhotoMetadata | null> => {
  try {
    const photoDir = getPhotoDirectory();
    const photoFile = getPhotoFile();

    // Dizin yoksa oluştur
    if (!photoDir.exists) {
      photoDir.create();
    }

    // Eski fotoğrafı sil (varsa)
    if (photoFile.exists) {
      photoFile.delete();
    }

    // Kaynak dosyadan kopyala
    const sourceFile = new File(sourceUri);
    sourceFile.copy(photoFile);

    // Metadata oluştur
    const metadata: PhotoMetadata = {
      uri: photoFile.uri,
      savedAt: new Date().toISOString(),
      faceAnalysisId,
    };

    // Metadata'yı AsyncStorage'a kaydet
    await AsyncStorage.setItem(PHOTO_METADATA_KEY, JSON.stringify(metadata));

    console.log('📸 [PHOTO-STORAGE] Fotoğraf kaydedildi:', {
      path: photoFile.uri,
      faceAnalysisId,
    });

    return metadata;
  } catch (error) {
    console.error('📸 [PHOTO-STORAGE] Kaydetme hatası:', error);
    return null;
  }
};

/**
 * Kaydedilmiş fotoğraf metadata'sını yükle
 */
export const loadAnalysisPhoto = async (): Promise<PhotoMetadata | null> => {
  try {
    // AsyncStorage'dan metadata'yı al
    const metadataStr = await AsyncStorage.getItem(PHOTO_METADATA_KEY);

    if (!metadataStr) {
      console.log('📸 [PHOTO-STORAGE] Kayıtlı metadata yok');
      return null;
    }

    const metadata: PhotoMetadata = JSON.parse(metadataStr);

    // Dosya hala mevcut mu kontrol et
    const file = new File(metadata.uri);

    if (!file.exists) {
      console.log('📸 [PHOTO-STORAGE] Dosya mevcut değil, metadata temizleniyor');
      await AsyncStorage.removeItem(PHOTO_METADATA_KEY);
      return null;
    }

    console.log('📸 [PHOTO-STORAGE] Fotoğraf yüklendi:', metadata.uri);
    return metadata;
  } catch (error) {
    console.error('📸 [PHOTO-STORAGE] Yükleme hatası:', error);
    return null;
  }
};

/**
 * Kaydedilmiş fotoğrafı sil
 */
export const deleteAnalysisPhoto = async (): Promise<boolean> => {
  try {
    const metadataStr = await AsyncStorage.getItem(PHOTO_METADATA_KEY);

    if (metadataStr) {
      const metadata: PhotoMetadata = JSON.parse(metadataStr);
      const file = new File(metadata.uri);

      if (file.exists) {
        file.delete();
      }
    }

    await AsyncStorage.removeItem(PHOTO_METADATA_KEY);
    console.log('📸 [PHOTO-STORAGE] Fotoğraf silindi');
    return true;
  } catch (error) {
    console.error('📸 [PHOTO-STORAGE] Silme hatası:', error);
    return false;
  }
};

/**
 * Kayıtlı fotoğraf var mı kontrol et
 */
export const hasAnalysisPhoto = async (): Promise<boolean> => {
  const metadata = await loadAnalysisPhoto();
  return metadata !== null;
};

// ============================================
// MULTI-PHOTO FUNCTIONS
// ============================================

/**
 * Multi-photo dosya nesnesi
 */
const getMultiPhotoFile = (index: 0 | 1 | 2): File => {
  return new File(getPhotoDirectory(), MULTI_PHOTO_FILENAMES[index]);
};

/**
 * 2-3 fotoğrafı kalıcı dizine kaydet
 */
export const saveMultipleAnalysisPhotos = async (
  sourceUris: string[],
  faceAnalysisId: string,
  consistencyScore: number
): Promise<MultiPhotoMetadata | null> => {
  try {
    if (sourceUris.length < 2 || sourceUris.length > 3) {
      console.error('📸 [MULTI-PHOTO] 2-3 fotoğraf gerekli, gelen:', sourceUris.length);
      return null;
    }

    const photoDir = getPhotoDirectory();

    // Dizin yoksa oluştur
    if (!photoDir.exists) {
      photoDir.create();
    }

    // Eski multi-photo dosyalarını sil
    for (let i = 0; i < 3; i++) {
      const file = getMultiPhotoFile(i as 0 | 1 | 2);
      if (file.exists) {
        file.delete();
      }
    }

    // Her fotoğrafı kopyala (2 veya 3)
    const photos: MultiPhotoItem[] = [];
    for (let i = 0; i < sourceUris.length; i++) {
      const index = i as 0 | 1 | 2;
      const targetFile = getMultiPhotoFile(index);
      const sourceFile = new File(sourceUris[i]);
      sourceFile.copy(targetFile);

      photos.push({
        uri: targetFile.uri,
        index,
      });
    }

    // Metadata oluştur
    const metadata: MultiPhotoMetadata = {
      photos,
      savedAt: new Date().toISOString(),
      faceAnalysisId,
      consistencyScore,
    };

    // Metadata'yı AsyncStorage'a kaydet
    await AsyncStorage.setItem(MULTI_PHOTO_METADATA_KEY, JSON.stringify(metadata));

    console.log(`📸 [MULTI-PHOTO] ${photos.length} fotoğraf kaydedildi:`, {
      faceAnalysisId,
      consistencyScore,
    });

    return metadata;
  } catch (error) {
    console.error('📸 [MULTI-PHOTO] Kaydetme hatası:', error);
    return null;
  }
};

/**
 * Multi-photo metadata'sını yükle
 */
export const loadMultiPhotoAnalysis = async (): Promise<MultiPhotoMetadata | null> => {
  try {
    const metadataStr = await AsyncStorage.getItem(MULTI_PHOTO_METADATA_KEY);

    if (!metadataStr) {
      console.log('📸 [MULTI-PHOTO] Kayıtlı metadata yok');
      return null;
    }

    const metadata: MultiPhotoMetadata = JSON.parse(metadataStr);

    // Tüm dosyalar mevcut mu kontrol et
    for (const photo of metadata.photos) {
      const file = new File(photo.uri);
      if (!file.exists) {
        console.log('📸 [MULTI-PHOTO] Dosya eksik, metadata temizleniyor:', photo.uri);
        await AsyncStorage.removeItem(MULTI_PHOTO_METADATA_KEY);
        return null;
      }
    }

    console.log(`📸 [MULTI-PHOTO] ${metadata.photos.length} fotoğraf yüklendi`);
    return metadata;
  } catch (error) {
    console.error('📸 [MULTI-PHOTO] Yükleme hatası:', error);
    return null;
  }
};

/**
 * Multi-photo dosyalarını sil
 */
export const deleteMultiPhotoAnalysis = async (): Promise<boolean> => {
  try {
    // Dosyaları sil
    for (let i = 0; i < 3; i++) {
      const file = getMultiPhotoFile(i as 0 | 1 | 2);
      if (file.exists) {
        file.delete();
      }
    }

    // Metadata'yı sil
    await AsyncStorage.removeItem(MULTI_PHOTO_METADATA_KEY);
    console.log('📸 [MULTI-PHOTO] Tüm fotoğraflar silindi');
    return true;
  } catch (error) {
    console.error('📸 [MULTI-PHOTO] Silme hatası:', error);
    return false;
  }
};

/**
 * Multi-photo kayıtlı mı kontrol et
 */
export const hasMultiPhotoAnalysis = async (): Promise<boolean> => {
  const metadata = await loadMultiPhotoAnalysis();
  return metadata !== null;
};

/**
 * Hem legacy hem multi-photo kontrol et
 * Multi-photo varsa onu döndür, yoksa legacy'yi dene
 */
export const loadAnyAnalysisPhoto = async (): Promise<{
  type: 'multi' | 'single' | 'none';
  multiPhoto?: MultiPhotoMetadata;
  singlePhoto?: PhotoMetadata;
}> => {
  // Önce multi-photo dene
  const multiPhoto = await loadMultiPhotoAnalysis();
  if (multiPhoto) {
    return { type: 'multi', multiPhoto };
  }

  // Legacy single photo dene
  const singlePhoto = await loadAnalysisPhoto();
  if (singlePhoto) {
    return { type: 'single', singlePhoto };
  }

  return { type: 'none' };
};
