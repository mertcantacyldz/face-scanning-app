// lib/photo-storage.ts
// Kullanıcının analiz için kullandığı fotoğrafı cihazda kalıcı olarak saklar
// Privacy: Fotoğraf sadece cihazda kalır, sunucuya gönderilmez

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Paths, File, Directory } from 'expo-file-system';

const PHOTO_METADATA_KEY = '@faceloom:photo_metadata';
const PHOTO_FILENAME = 'analysis_photo.jpg';
const PHOTO_DIR_NAME = 'photos';

export interface PhotoMetadata {
  uri: string;
  savedAt: string;
  faceAnalysisId?: string;
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
