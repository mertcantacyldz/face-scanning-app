import {
  calculateAllRegionalMetrics
} from '@/lib/analysis/metric-calculator';
import { Point3D } from '@/lib/geometry';
import { mediaPipeHTML } from '@/lib/mediapipe-html';
import {
  averageLandmarks,
  calculateConsistency,
  normalizeLandmarks,
  type ConsistencyResult,
  type NormalizedLandmarks
} from '@/lib/normalization';
import {
  deleteAnalysisPhoto,
  deleteMultiPhotoAnalysis,
  loadAnyAnalysisPhoto,
  saveAnalysisPhoto,
  saveMultipleAnalysisPhotos,
  type MultiPhotoMetadata
} from '@/lib/photo-storage';
import { supabase } from '@/lib/supabase';
import { Camera } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

// Multi-photo state interface
export interface MultiPhotoState {
  uri: string | null;
  landmarks: FaceLandmarks | null;
  normalizedLandmarks: NormalizedLandmarks | null;
  meshImageUri: string | null;
  validation: {
    isValid: boolean;
    quality: 'excellent' | 'good' | 'warning' | 'poor';
    message: string;
    confidence: number;
  } | null;
}

export interface FaceLandmarks {
  landmarks: { x: number, y: number, z: number, index: number }[];
  totalPoints: number;
  confidence: number;
  faceBox: { x: number, y: number, width: number, height: number };
  faceRegions: {
    faceOval: { x: number, y: number, z: number, index: number }[];
    forehead: { x: number, y: number, z: number, index: number }[];
    leftEyebrow: { x: number, y: number, z: number, index: number }[];
    rightEyebrow: { x: number, y: number, z: number, index: number }[];
    leftEye: { x: number, y: number, z: number, index: number }[];
    rightEye: { x: number, y: number, z: number, index: number }[];
    nose: { x: number, y: number, z: number, index: number }[];
    noseBridge: { x: number, y: number, z: number, index: number }[];
    noseTip: { x: number, y: number, z: number, index: number }[];
    noseWings: { x: number, y: number, z: number, index: number }[];
    lips: { x: number, y: number, z: number, index: number }[];
    upperLip: { x: number, y: number, z: number, index: number }[];
    lowerLip: { x: number, y: number, z: number, index: number }[];
    mouthOutline: { x: number, y: number, z: number, index: number }[];
    jawline: { x: number, y: number, z: number, index: number }[];
  };
  regionDetails: {
    totalRegions: number;
    regionNames: string[];
    pointCounts: {
      [key: string]: number;
    };
  };
  imageSize: {
    width: number;
    height: number;
  };
  timestamp: number;
}

// Mesh validation fonksiyonu
const validateMesh = (faceData: any, t: any) => {
  console.log('🔍 [VALIDATE_MESH] ========== BAŞLADI ==========');
  console.log('🔍 [VALIDATE_MESH] faceData keys:', Object.keys(faceData || {}));

  const landmarks = faceData.landmarks;

  // 1. Yeterli landmark var mı? (468 temel + 10 iris = 478, veya sadece 468)
  console.log('🔍 [VALIDATE_MESH] Step 1: Landmark kontrolü');
  console.log('🔍 [VALIDATE_MESH] landmarks var mı?:', !!landmarks);
  console.log('🔍 [VALIDATE_MESH] landmarks.length:', landmarks?.length);

  // MediaPipe 468 (temel) veya 478 (refineLandmarks ile iris dahil) döndürebilir
  const validLandmarkCounts = [468, 478];
  if (!landmarks || !validLandmarkCounts.includes(landmarks.length)) {
    console.log('❌ [VALIDATE_MESH] FAIL: Geçerli landmark sayısı yok! Return poor');
    return {
      isValid: false,
      quality: 'poor' as const,
      message: t('validation.messages.notEnoughPoints', { count: landmarks?.length || 0 }),
      confidence: 0
    };
  }
  console.log('✅ [VALIDATE_MESH] Step 1 PASSED:', landmarks.length, 'landmark var');

  // 2. Kritik landmark'lar geçerli koordinatlarda mı?
  console.log('🔍 [VALIDATE_MESH] Step 2: Kritik nokta kontrolü');
  const criticalIndices = [
    // Sol göz
    159, 145, 133,
    // Sağ göz
    386, 374, 263,
    // Burun ucu
    1, 2,
    // Ağız köşeleri
    61, 291,
    // Çene ucu
    152,
    // Alın merkezi
    10
  ];

  for (const idx of criticalIndices) {
    const point = landmarks[idx];
    const width = faceData.imageSize?.width || 1024;
    const height = faceData.imageSize?.height || 1024;

    // Koordinatlar fotoğraf içinde mi?
    if (!point || point.x < 0 || point.x > width || point.y < 0 || point.y > height) {
      console.log(`❌ [VALIDATE_MESH] FAIL: Kritik nokta ${idx} geçersiz!`, {
        point,
        x: point?.x,
        y: point?.y,
        bounds: { width, height }
      });
      return {
        isValid: false,
        quality: 'poor' as const,
        message: t('validation.messages.criticalPointsMissing'),
        confidence: 0
      };
    }
  }
  console.log('✅ [VALIDATE_MESH] Step 2 PASSED: Tüm kritik noktalar geçerli');

  // ✅ 3. YENİ: Confidence-based quality assessment
  console.log('🔍 [VALIDATE_MESH] Step 3: Confidence kontrolü');
  console.log('🔍 [VALIDATE_MESH] faceData.confidence:', faceData.confidence);
  console.log('🔍 [VALIDATE_MESH] faceData.totalPoints:', faceData.totalPoints);

  // Confidence değeri faceData objesinin içinde (landmarks array'inde DEĞİL!)
  const confidence = faceData.confidence || 0.99;
  const confidencePercent = Math.round(confidence * 100);

  console.log('🔍 [VALIDATE_MESH] Kullanılan confidence:', confidence);
  console.log('🔍 [VALIDATE_MESH] confidencePercent:', confidencePercent);

  // DEBUG: Kalite detaylarını logla
  if (faceData.confidenceDetails) {
    const details = faceData.confidenceDetails;
    console.log('📊 [QUALITY DEBUG]', {
      total: details.totalScore,
      yaw: details.yaw?.score,
      pitch: details.pitch?.score,
      eyeSym: details.eyeSymmetry?.score,
      size: details.size?.score,
      depthG: details.depthGlobal?.score,
      depthL: details.depthLocal?.score
    });
  }

  let result;
  if (confidence >= 0.92) {
    console.log('✅ [VALIDATE_MESH] Quality: EXCELLENT');
    result = {
      isValid: true,
      quality: 'excellent' as const,
      message: t('validation.messages.excellent'),
      confidence: confidencePercent
    };
  } else if (confidence >= 0.82) {
    console.log('✅ [VALIDATE_MESH] Quality: GOOD');
    result = {
      isValid: true,
      quality: 'good' as const,
      message: t('validation.messages.good'),
      confidence: confidencePercent
    };
  } else {
    // ⚠️ Detaylı hata mesajı belirle
    let message = t('validation.messages.good'); // Fallback
    const details = faceData.confidenceDetails;

    if (details) {
      if (details.yaw.score < 0.8) message = t('validation.messages.yawWarning');
      else if (details.pitch.score < 0.8) message = t('validation.messages.pitchWarning');
      else if (details.roll.score < 0.8) message = t('validation.messages.rollWarning');
      else if (details.size.score < 0.7) {
        message = details.size.value < 0.12
          ? t('validation.messages.tooFar')
          : t('validation.messages.tooClose');
      }
    }

    if (confidence >= 0.70) {
      console.log('⚠️ [VALIDATE_MESH] Result: WARNING (Quality usable but flawed)');
      result = {
        isValid: true,
        quality: 'warning' as const,
        message: message,
        confidence: confidencePercent
      };
    } else {
      console.log('❌ [VALIDATE_MESH] Result: POOR (Quality very low)');
      result = {
        isValid: true,
        quality: 'poor' as const,
        message: message,
        confidence: confidencePercent
      };
    }
  }

  console.log('🎯 [VALIDATE_MESH] FINAL DECISION:', result);

  console.log('🔍 [VALIDATE_MESH] SONUÇ:', result);
  console.log('🔍 [VALIDATE_MESH] ========== BİTTİ ==========');
  return result;
};

export function useFaceMesh() {
  const { t } = useTranslation(['home', 'common']);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [faceLandmarks, setFaceLandmarks] = useState<FaceLandmarks | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [mediaPipeReady, setMediaPipeReady] = useState(false);
  const [meshImageUri, setMeshImageUri] = useState<string | null>(null);
  const [showMeshPreview, setShowMeshPreview] = useState(false);
  const [meshValidation, setMeshValidation] = useState<{
    isValid: boolean;
    quality: 'excellent' | 'good' | 'warning' | 'poor';
    message: string;
    confidence: number;
  }>({
    isValid: true,
    quality: 'excellent',
    message: '',
    confidence: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Saved photo state (kalıcı fotoğraf - legacy single photo)
  const [savedPhotoUri, setSavedPhotoUri] = useState<string | null>(null);
  const [savedPhotoDate, setSavedPhotoDate] = useState<string | null>(null);
  const [savedPhotoAnalysisId, setSavedPhotoAnalysisId] = useState<string | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);

  // Multi-photo state
  const [isMultiPhotoMode, setIsMultiPhotoMode] = useState(true); // Default: multi-photo mode
  const [multiPhotos, setMultiPhotos] = useState<MultiPhotoState[]>([
    { uri: null, landmarks: null, normalizedLandmarks: null, meshImageUri: null, validation: null },
    { uri: null, landmarks: null, normalizedLandmarks: null, meshImageUri: null, validation: null },
    { uri: null, landmarks: null, normalizedLandmarks: null, meshImageUri: null, validation: null },
  ]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<0 | 1 | 2>(0);
  const [multiPhotoProcessingStatus, setMultiPhotoProcessingStatus] = useState<
    'idle' | 'processing' | 'averaging' | 'complete'
  >('idle');
  const [consistencyScore, setConsistencyScore] = useState<number | null>(null);
  const [consistencyResult, setConsistencyResult] = useState<ConsistencyResult | null>(null);
  const [savedMultiPhotos, setSavedMultiPhotos] = useState<MultiPhotoMetadata | null>(null);

  // Queue for processing multiple photos
  const processingQueueRef = useRef<string[]>([]);
  const currentProcessingIndexRef = useRef<number>(-1);
  const lastProcessingIndexRef = useRef<number>(-1); // <--- Yeni: Son işlenen index
  // ✅ Promise resolver: landmarks gelince processMultiPhoto'yu resolve eder
  const landmarksResolverRef = useRef<(() => void) | null>(null);
  // ✅ Ref: isMultiPhotoMode'un güncel değeri (state async olduğu için ref kullanıyoruz)
  const isMultiPhotoModeRef = useRef<boolean>(true);
  // ✅ Ref: multiPhotos'un güncel değeri (finalize'da state yerine ref kullanacağız)
  const multiPhotosRef = useRef<MultiPhotoState[]>([
    { uri: null, landmarks: null, normalizedLandmarks: null, meshImageUri: null, validation: null },
    { uri: null, landmarks: null, normalizedLandmarks: null, meshImageUri: null, validation: null },
    { uri: null, landmarks: null, normalizedLandmarks: null, meshImageUri: null, validation: null },
  ]);

  const webViewRef = useRef<WebView>(null);
  const processingRef = useRef<boolean>(false); // ✅ Yeni: Senkron işlem kilidi

  // Mount'ta kayıtlı fotoğrafı yükle (multi-photo veya legacy)
  useEffect(() => {
    const loadSavedPhoto = async () => {
      try {
        const result = await loadAnyAnalysisPhoto();

        if (result.type === 'multi' && result.multiPhoto) {
          // Multi-photo kayıtlı
          setSavedMultiPhotos(result.multiPhoto);
          setSavedPhotoAnalysisId(result.multiPhoto.faceAnalysisId);
          setConsistencyScore(result.multiPhoto.consistencyScore);
          console.log('📸 [useFaceMesh] Multi-photo yüklendi:', result.multiPhoto.photos.length);
        } else if (result.type === 'single' && result.singlePhoto) {
          // Legacy single photo - eskiden SAKLANIYORDU, şimdi sadece LOG
          console.log('🗑️ [MIGRATION] Eski format fotoğraf bulundu:', result.singlePhoto.uri);
          console.log('ℹ️ [MIGRATION] Not: Eski fotoğrafları görüntüleyebilirsiniz ama yeni tarama yapınca kaybolacak');

          // Eski fotoğrafı göster (backward compatibility)
          setSavedPhotoUri(result.singlePhoto.uri);
          setSavedPhotoDate(result.singlePhoto.savedAt);
          setSavedPhotoAnalysisId(result.singlePhoto.faceAnalysisId || null);

          // NOT: Kullanıcı "Yeni Tarama" yapınca startNewAnalysis() bu state'leri temizleyecek
        }
      } catch (error) {
        console.error('📸 [useFaceMesh] Fotoğraf yükleme hatası:', error);
      } finally {
        setIsLoadingPhoto(false);
      }
    };

    loadSavedPhoto();
  }, []);

  // WebView mesajlarını dinle
  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const processingId = data.processingId;

      console.log('📥 [WEBVIEW MESAJI]', {
        type: data.type,
        id: processingId,
        timestamp: Date.now()
      });

      switch (data.type) {
        case 'READY':
          setMediaPipeReady(true);
          break;

        case 'LANDMARKS':
          console.log(`🎯 [LANDMARKS GELDİ] ID: ${processingId}`, {
            noktaSayisi: data.data.totalPoints,
            imageSize: data.data.imageSize,
            rawConfidence: data.data.confidence
          });

          // 📊 KALİTE LOGU (Terminalde görülmesi için)
          if (data.data.confidenceDetails) {
            const det = data.data.confidenceDetails;
            console.log('📊 [Puan Dökümü (Quality Details)]', {
              finalScore: (det.totalScore * 100).toFixed(1) + '%',
              yaw: det.yaw?.value?.toFixed(1) + '° (Hizalama: ' + (det.yaw?.score * 100).toFixed(0) + '%)',
              pitch: det.pitch?.value?.toFixed(1) + '° (Hizalama: ' + (det.pitch?.score * 100).toFixed(0) + '%)',
              roll: det.roll?.value?.toFixed(1) + '° (Hizalama: ' + (det.roll?.score * 100).toFixed(0) + '%)',
              size: (det.size?.value * 100).toFixed(1) + ' (Hizalama: ' + (det.size?.score * 100).toFixed(0) + '%)'
            });
          }

          // Eğer bu bir multi-photo ise, direkt ID'yi kullan
          const landmarksIdx = processingId !== null ? parseInt(processingId) : -1;

          if (landmarksIdx >= 0 && landmarksIdx < 3) {
            lastProcessingIndexRef.current = landmarksIdx;
            updateMultiPhotoWithLandmarks(
              landmarksIdx as 0 | 1 | 2,
              data.data,
              null, // mesh henüz gelmedi
              validateMesh(data.data, t)
            );

            // Eğer bu beklediğimiz mevcut index ise resolve et
            if (landmarksResolverRef.current && currentProcessingIndexRef.current === landmarksIdx) {
              processingRef.current = false; // ✅ Kilidi aç
              landmarksResolverRef.current();
              landmarksResolverRef.current = null;
            }
          } else {
            // Single photo modu
            setFaceLandmarks(data.data);
            setMeshValidation(validateMesh(data.data, t));
            setIsAnalyzing(false);
            setIsProcessing(false);
            processingRef.current = false; // Kilidi aç
          }
          break;

        case 'MESH_IMAGE':
          console.log(`🖼️ [MESH GÖRÜNTÜSÜ GELDİ] ID: ${processingId}`);

          const meshIdx = processingId !== null ? parseInt(processingId) : -1;

          if (meshIdx >= 0 && meshIdx < 3) {
            setMultiPhotos(prev => {
              const updated = [...prev];
              updated[meshIdx] = { ...updated[meshIdx], meshImageUri: data.data.meshImage };
              return updated;
            });
            multiPhotosRef.current[meshIdx].meshImageUri = data.data.meshImage;
          } else {
            // Single photo modu
            setMeshImageUri(data.data.meshImage);
            setShowMeshPreview(true);
          }
          break;

        case 'NO_FACE':
          console.log(`❌ [YÜZ BULUNAMADI] ID: ${processingId}`);
          processingRef.current = false; // Kilidi aç

          const noFaceIdx = processingId !== null ? parseInt(processingId) : -1;

          if (noFaceIdx >= 0 && noFaceIdx < 3) {
            // Multi-photo hata kaydı
            setMultiPhotos(prev => {
              const updated = [...prev];
              updated[noFaceIdx] = {
                ...updated[noFaceIdx],
                validation: {
                  isValid: false,
                  quality: 'poor',
                  message: t('alerts.noFace.message'),
                  confidence: 0
                }
              };
              return updated;
            });

            if (landmarksResolverRef.current && currentProcessingIndexRef.current === noFaceIdx) {
              const errorRejecter = landmarksResolverRef.current as any;
              errorRejecter.reject?.(new Error('Yüz bulunamadı'));
              landmarksResolverRef.current = null;
            }
          } else {
            // Single photo
            setIsAnalyzing(false);
            setIsProcessing(false);
            setSelectedImage(null);
            Alert.alert(t('alerts.noFace.title'), t('alerts.noFace.message'));
          }
          break;

        case 'ERROR':
          console.log(`❌ [WEBVIEW HATASI] ID: ${processingId}`, data.error);
          processingRef.current = false; // Kilidi aç

          const errIdx = processingId !== null ? parseInt(processingId) : -1;

          if (errIdx >= 0 && errIdx < 3) {
            // Multi-photo hata kaydı
            setMultiPhotos(prev => {
              const updated = [...prev];
              updated[errIdx] = {
                ...updated[errIdx],
                validation: {
                  isValid: false,
                  quality: 'poor',
                  message: data.error || 'İşlem hatası',
                  confidence: 0
                }
              };
              return updated;
            });

            if (landmarksResolverRef.current && currentProcessingIndexRef.current === errIdx) {
              const errorRejecter = landmarksResolverRef.current as any;
              errorRejecter.reject?.(new Error(data.error));
              landmarksResolverRef.current = null;
            }
          }

          setIsAnalyzing(false);
          setIsProcessing(false);
          Alert.alert(t('alerts.processingError.title'), data.error);
          break;
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [handleWebViewMessage] Parse hatası:', error);
      }
    }
  };

  // Veritabanına kaydet - returns the saved record ID
  const saveAnalysisToDatabase = async (
    landmarksData: FaceLandmarks,
    metrics: Record<string, any> | null = null
  ): Promise<string | null> => {
    try {
      // DEBUG-MIRROR: DB'ye kaydedilmeden önce kontrol
      console.log('💾 [DEBUG-MIRROR] DB\'YE KAYDEDİLİYOR:', {
        P4_noseTip_x: landmarksData.landmarks[4]?.x.toFixed(2),
        P33_rightEyeOuter_x: landmarksData.landmarks[33]?.x.toFixed(2),
        P263_leftEyeOuter_x: landmarksData.landmarks[263]?.x.toFixed(2),
        mirrorCheck: landmarksData.landmarks[263]?.x > landmarksData.landmarks[33]?.x ? 'NORMAL' : 'MIRRORED',
        timestamp: landmarksData.timestamp
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('face_analysis')
        .insert([
          {
            user_id: user.id,
            landmarks: null, // KVKK Uyumu: Ham landmarkları kaydetmiyoruz
            metrics: metrics, // Önceden hesaplanmış metrikler
            analysis_data: {
              totalPoints: landmarksData.totalPoints,
              confidence: landmarksData.confidence,
              faceBox: landmarksData.faceBox,
              regionDetails: landmarksData.regionDetails,
              imageSize: landmarksData.imageSize,
              timestamp: landmarksData.timestamp
            }
          }
        ])
        .select('id')
        .single();

      if (error) {
        if (__DEV__) {
          console.error('Kayıt hatası:', error);
        }
        return null;
      }

      console.log('✅ [DEBUG-MIRROR] DB\'YE KAYDEDİLDİ, ID:', data?.id);
      return data?.id || null;
    } catch (error) {
      if (__DEV__) {
        console.error('Kayıt işlemi hatası:', error);
      }
      return null;
    }
  };

  // Mesh onay handler
  const handleConfirmMesh = async () => {
    if (__DEV__) {
      console.log('[Mesh] handleConfirmMesh çağrıldı:', {
        showMeshPreview,
        hasFaceLandmarks: !!faceLandmarks,
      });
    }
    setShowMeshPreview(false);

    if (faceLandmarks) {
      // KVKK: Kayıt öncesi tüm metrikleri yerelde hesapla
      const metrics = await calculateAllRegionalMetrics(
        faceLandmarks.landmarks.map((l, i) => ({ x: l.x, y: l.y, z: l.z, index: l.index ?? i }))
      );

      const savedId = await saveAnalysisToDatabase(faceLandmarks, metrics);

      if (savedId) {
        // Fotoğrafı kalıcı olarak kaydet
        if (selectedImage) {
          const photoMetadata = await saveAnalysisPhoto(selectedImage, savedId);
          if (photoMetadata) {
            setSavedPhotoUri(photoMetadata.uri);
            setSavedPhotoDate(photoMetadata.savedAt);
            setSavedPhotoAnalysisId(savedId);
            console.log('📸 [handleConfirmMesh] Fotoğraf kaydedildi');
          }
        }

        Alert.alert(
          t('alerts.analysisSuccess.title'),
          t('alerts.analysisSuccess.message', { count: faceLandmarks.totalPoints }),
          [
            {
              text: t('buttons.done', { ns: 'common' }),
              // Pass the saved ID to analysis page to ensure it loads the correct data
              onPress: () => router.push({ pathname: '/analysis', params: { faceAnalysisId: savedId } })
            }
          ]
        );
      } else {
        Alert.alert(
          t('alerts.saveError.title'),
          t('alerts.saveError.message'),
          [{ text: t('buttons.done', { ns: 'common' }) }]
        );
      }
    }
  };

  // Tekrar çek handler
  const handleRetake = () => {
    setShowMeshPreview(false);
    setMeshImageUri(null);
    setFaceLandmarks(null);
    setSelectedImage(null);

    // MediaPipe force reset
    webViewRef.current?.injectJavaScript(`
      if (typeof window.forceReset === 'function') {
        window.forceReset();
      }
      true;
    `);

    // Direkt foto seçme modalını aç (AI Rehberi atlayarak)
    setShowImagePicker(true);
  };

  // Kamera iznini kontrol et
  const checkCameraPermission = async () => {
    // Önce mevcut durumu kontrol et
    const { status: currentStatus, canAskAgain } = await Camera.getCameraPermissionsAsync();

    // Eğer henüz sorulmadıysa (undetermined), kullanıcıya neden istediğimizi açıklayalım
    if (currentStatus === 'undetermined') {
      await new Promise<void>((resolve) => {
        Alert.alert(
          t('permissions.title', { ns: 'common' }),
          t('permissions.cameraRationale', { ns: 'common', defaultValue: 'Yüz analizi yapabilmek için kameranıza erişmemiz gerekiyor.' }),
          [{ text: t('buttons.continue', { ns: 'common' }), onPress: () => resolve() }]
        );
      });
    }

    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('permissions.title', { ns: 'common' }),
        t('permissions.camera', { ns: 'common' }),
        [
          { text: t('buttons.cancel', { ns: 'common' }), style: 'cancel' },
          { text: t('permissions.openSettings', { ns: 'common' }), onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }
    return true;
  };

  // Galeri iznini kontrol et
  const checkGalleryPermission = async () => {
    // Önce mevcut durumu kontrol et
    const { status: currentStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();

    // Eğer henüz sorulmadıysa (undetermined), kullanıcıya neden istediğimizi açıklayalım
    if (currentStatus === 'undetermined') {
      await new Promise<void>((resolve) => {
        Alert.alert(
          t('permissions.title', { ns: 'common' }),
          t('permissions.galleryRationale', { ns: 'common', defaultValue: 'Galerinizden fotoğraf seçebilmek için fotoğraf kütüphanenize erişmemiz gerekiyor.' }),
          [{ text: t('buttons.continue', { ns: 'common' }), onPress: () => resolve() }]
        );
      });
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('permissions.title', { ns: 'common' }),
        t('permissions.gallery', { ns: 'common' }),
        [
          { text: t('buttons.cancel', { ns: 'common' }), style: 'cancel' },
          { text: t('permissions.openSettings', { ns: 'common' }), onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }
    return true;
  };

  // Kameradan fotoğraf çek
  const takePhoto = async () => {
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) return;

    try {
      console.log('📷 [FOTOĞRAF ÇEKİLİYOR]', { timestamp: Date.now() });

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📷 [FOTOĞRAF ÇEKİLDİ]', {
          uri: result.assets[0].uri,
          timestamp: Date.now()
        });

        setShowImagePicker(false);
        await processImageWithMediaPipe(result.assets[0].uri);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Camera] Kamera hatası:', error);
      }
      Alert.alert(t('states.error', { ns: 'common' }), t('alerts.processingError.message'));
    }
  };

  // Galeriden fotoğraf seç
  const pickImage = async () => {
    const hasPermission = await checkGalleryPermission();
    if (!hasPermission) return;

    try {
      console.log('🖼️ [GALERİ AÇILIYOR]', { timestamp: Date.now() });

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('🖼️ [RESİM SEÇİLDİ]', {
          uri: result.assets[0].uri,
          timestamp: Date.now()
        });

        setShowImagePicker(false);
        await processImageWithMediaPipe(result.assets[0].uri);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Gallery] Galeri hatası:', error);
      }
      Alert.alert(t('states.error', { ns: 'common' }), t('alerts.processingError.message'));
    }
  };

  // ImageURI'yi base64 yapıp MediaPipe'a gönder
  const processImageWithMediaPipe = async (imageUri: string, processingId: number | null = null) => {
    if (!mediaPipeReady) {
      Alert.alert(t('alerts.mediaPipeNotReady.title'), t('alerts.mediaPipeNotReady.message'));
      return;
    }
    if (processingRef.current) {
      console.warn('⚠️ [KUYRUK] Zaten işleniyor, atlıyorum');
      return;
    }

    console.log(`🧹 [STATE TEMİZLENİYOR] ID: ${processingId}`);
    processingRef.current = true; // ✅ Kilidi hemen tak

    // ÖNCELİKLE tüm eski state'i temizle
    setFaceLandmarks(null);
    setMeshImageUri(null);
    setMeshValidation({ isValid: true, quality: 'excellent', message: '', confidence: 0 });
    setShowMeshPreview(false);

    // SONRA yeni state'i ayarla
    setSelectedImage(imageUri);
    setIsAnalyzing(true);
    setIsProcessing(true);

    try {
      console.log(`🔒 [KUYRUK] İşlem kilitlendi ID: ${processingId}`);

      // ✅ ORANLI KÜÇÜLTME (800px max side) - Drift ve Çökme Çözümü
      const manipulatedImage = await (async () => {
        const context = ImageManipulator.manipulate(imageUri);
        // Sadece width verince Expo aspect ratio'yu korur
        context.resize({ width: 800 });
        const image = await context.renderAsync();
        const result = await image.saveAsync({
          format: SaveFormat.JPEG,
          compress: 0.8,
          base64: true
        });
        return result;
      })();

      console.log('✅ [RESİM İŞLENDİ]', {
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        id: processingId
      });

      // WebView'e base64 image gönder ve canvas'ı temizle
      const injectedJS = `
        (function() {
          if (window.processImage && typeof window.processImage === 'function') {
            window.processImage({
              image: '${manipulatedImage.base64}',
              id: ${processingId !== null ? processingId : 'null'}
            });
          } else {
            console.error('[WEBVIEW] MediaPipe function not found');
          }
        })();
        true;
      `;

      webViewRef.current?.injectJavaScript(injectedJS);

    } catch (error) {
      console.error('[MediaPipe] process hatası:', error);
      processingRef.current = false; // Hata durumunda kilidi aç
      setIsAnalyzing(false);
      setIsProcessing(false);
      Alert.alert(t('alerts.processingError.title'), t('alerts.processingError.message'));
    }
  };

  // Yeni analiz başlat
  const startNewAnalysis = (mode: 'single' | 'multi' = 'single') => {
    if (__DEV__) {
      console.log('[Flow] startNewAnalysis çağrıldı:', {
        mode,
        hasSelectedImage: !!selectedImage,
        hasFaceLandmarks: !!faceLandmarks,
      });
    }

    // ✅ CRITICAL FIX: Set multi-photo mode based on user selection
    setIsMultiPhotoMode(mode === 'multi');
    console.log(`🎯 [MODE] isMultiPhotoMode set to: ${mode === 'multi'}`);

    // State'leri temizle
    setSelectedImage(null);
    setFaceLandmarks(null);
    setMeshImageUri(null);
    setMeshValidation({ isValid: true, quality: 'excellent', message: '', confidence: 0 });

    if (mode === 'multi') {
      resetMultiPhotoState();
    }

    // Safety reset
    processingRef.current = false;
  };
  // ✅ Modal açma işini index.tsx yapacak - buradan kaldırıldı (setShowImagePicker silindi)

  // Kayıtlı fotoğrafı temizle (yeni fotoğraf seçmek için)
  const clearSavedPhoto = async () => {
    try {
      await deleteAnalysisPhoto();
      setSavedPhotoUri(null);
      setSavedPhotoDate(null);
      setSavedPhotoAnalysisId(null);
      console.log('📸 [clearSavedPhoto] Kayıtlı fotoğraf temizlendi');
    } catch (error) {
      console.error('📸 [clearSavedPhoto] Hata:', error);
    }
  };

  // ============================================
  // MULTI-PHOTO FUNCTIONS
  // ============================================

  // Reset multi-photo state
  const resetMultiPhotoState = useCallback(() => {
    setMultiPhotos([
      { uri: null, landmarks: null, normalizedLandmarks: null, meshImageUri: null, validation: null },
      { uri: null, landmarks: null, normalizedLandmarks: null, meshImageUri: null, validation: null },
      { uri: null, landmarks: null, normalizedLandmarks: null, meshImageUri: null, validation: null },
    ]);
    setCurrentPhotoIndex(0);
    setMultiPhotoProcessingStatus('idle');
    setConsistencyScore(null);
    setConsistencyResult(null);
    processingQueueRef.current = [];
    currentProcessingIndexRef.current = -1;
    landmarksResolverRef.current = null;
    multiPhotosRef.current = [
      { uri: null, landmarks: null, normalizedLandmarks: null, meshImageUri: null, validation: null },
      { uri: null, landmarks: null, normalizedLandmarks: null, meshImageUri: null, validation: null },
      { uri: null, landmarks: null, normalizedLandmarks: null, meshImageUri: null, validation: null },
    ];
  }, []);

  // Process a single photo for multi-photo flow
  // ✅ LANDMARKS mesajı gelene kadar bekler (race condition düzeltildi)
  const processMultiPhoto = useCallback(async (
    photoUri: string,
    index: 0 | 1 | 2
  ): Promise<void> => {
    currentProcessingIndexRef.current = index;
    console.log(`📸 [MULTI-PHOTO] Fotoğraf ${index + 1} işleniyor...`);

    return new Promise((resolve, reject) => {
      // Timeout guard (15 saniye - WebView + MediaPipe süresi)
      const timeout = setTimeout(() => {
        currentProcessingIndexRef.current = -1;
        landmarksResolverRef.current = null;
        processingRef.current = false; // ✅ Kilidi aç (timeout durumunda)
        console.error(`⚠️ [MULTI-PHOTO] Fotoğraf ${index + 1} timeout (15s)`);
        reject(new Error(`Fotoğraf ${index + 1} timeout`));
      }, 15000);

      // Store URI in processing queue
      processingQueueRef.current[index] = photoUri;
      setCurrentPhotoIndex(index);
      setMultiPhotoProcessingStatus('processing');

      // ✅ Resolver/Rejecter'ı kaydet - handleWebViewMessage LANDMARKS veya NO_FACE gelince çağıracak
      landmarksResolverRef.current = (() => {
        clearTimeout(timeout);
        console.log(`✅ [MULTI-PHOTO] Fotoğraf ${index + 1} landmarks alındı, resolve ediliyor`);
        resolve();
      }) as any;

      // ✅ Add reject function to resolver for NO_FACE case
      (landmarksResolverRef.current as any).reject = (error: Error) => {
        clearTimeout(timeout);
        console.log(`❌ [MULTI-PHOTO] Fotoğraf ${index + 1} reject ediliyor:`, error.message);
        reject(error);
      };

      // WebView'a image gönder (LANDMARKS mesajını tetikler)
      processImageWithMediaPipe(photoUri, index)
        .catch((err) => {
          clearTimeout(timeout);
          currentProcessingIndexRef.current = -1;
          landmarksResolverRef.current = null;
          reject(err);
        });
    });
  }, [processImageWithMediaPipe]);

  // Update multi-photo state when landmarks arrive
  const updateMultiPhotoWithLandmarks = useCallback((
    index: number,
    landmarks: FaceLandmarks,
    meshUri: string | null,
    validation: MultiPhotoState['validation']
  ) => {
    try {
      // ✅ DOĞRU: Tek fotoğrafsa normalize ETME (ref kullan, state async olabilir)
      let normalized: NormalizedLandmarks | null = null;

      if (isMultiPhotoModeRef.current) {
        // 2-3 fotoğraf → normalize et
        normalized = normalizeLandmarks(
          landmarks.landmarks.map(l => ({ ...l })) as Point3D[]
        );
        console.log(`🔄 [NORMALIZATION] Fotoğraf ${index + 1} normalize edildi`);
      } else {
        // 1 fotoğraf → normalize ETME
        console.log(`✅ [SINGLE-PHOTO] Fotoğraf ${index + 1} - normalizasyon atlandı`);
      }

      const photoData = {
        uri: processingQueueRef.current[index] || null,
        landmarks,
        normalizedLandmarks: normalized,
        meshImageUri: meshUri,
        validation,
      };

      // ✅ Ref'i hemen güncelle (sync - finalize'da kullanılacak)
      multiPhotosRef.current[index] = photoData;

      // State'i de güncelle (UI render için)
      setMultiPhotos(prev => {
        const updated = [...prev];
        updated[index] = photoData;
        return updated;
      });

      console.log(`📸 [MULTI-PHOTO] Fotoğraf ${index + 1} state'e kaydedildi`, {
        hasLandmarks: !!landmarks,
        hasNormalized: !!normalized,
        validation: validation?.quality,
      });
    } catch (error) {
      console.error(`❌ [MULTI-PHOTO] Fotoğraf ${index + 1} işleme hatası:`, error);
    }
  }, []);  // ref kullanıldığı için dependency gerekmiyor

  // Process 1-3 photos sequentially
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const processAllMultiPhotos = useCallback(async (photoUris: string[]): Promise<void> => {
    // Validate photo count (1-3 allowed)
    if (photoUris.length < 1 || photoUris.length > 3) {
      Alert.alert('Hata', 'Lütfen 1-3 arasında fotoğraf seçin');
      return;
    }

    console.log(`📸 [MULTI-PHOTO] ${photoUris.length} fotoğraf işlenecek`);

    // Dynamically set mode based on photo count
    const mode = photoUris.length >= 2 ? 'multi' : 'single';
    const isMulti = mode === 'multi';
    setIsMultiPhotoMode(isMulti);
    isMultiPhotoModeRef.current = isMulti;  // ✅ Ref'i hemen güncelle (state async)
    console.log(`🎯 [MODE] Fotoğraf sayısına göre mod: ${mode}`);

    resetMultiPhotoState();
    setMultiPhotoProcessingStatus('processing');

    try {
      // Process photos sequentially (1, 2, or 3 photos)
      for (let i = 0; i < photoUris.length; i++) {
        console.log(`📸 [MULTI-PHOTO] Fotoğraf ${i + 1}/${photoUris.length} işleniyor...`);
        await processMultiPhoto(photoUris[i], i as 0 | 1 | 2);
        // Wait a bit for WebView to process
        await new Promise(resolve => setTimeout(resolve, 500));

        // Log completion status
        console.log(`✅ [MULTI-PHOTO] Fotoğraf ${i + 1}/${photoUris.length} tamamlandı:`, {
          hasLandmarks: multiPhotos[i].landmarks !== null,
          hasNormalized: multiPhotos[i].normalizedLandmarks !== null,
          validation: multiPhotos[i].validation?.quality,
        });
      }

      console.log(`📸 [MULTI-PHOTO] Tüm fotoğraflar işlendi (${photoUris.length} adet)`);

      // ✅ Processing complete - modal stays open for user to click "Analiz Et"
      setMultiPhotoProcessingStatus('idle');

    } catch (error) {
      // ✅ Better error messages
      const errorMessage = (error as Error).message;
      const isNoFaceError = errorMessage.includes('Yüz bulunamadı');

      if (!isNoFaceError) {
        console.error('📸 [MULTI-PHOTO] İşlem hatası:', error);
        Alert.alert('Hata', 'Fotoğraflar işlenirken bir hata oluştu: ' + errorMessage);
      }

      setMultiPhotoProcessingStatus('idle');
      setIsProcessing(false);
      setIsAnalyzing(false);
      processingRef.current = false;
    }
  }, [resetMultiPhotoState, processMultiPhoto, setIsMultiPhotoMode]);

  // Finalize multi-photo analysis (average landmarks and save)
  const finalizeMultiPhotoAnalysis = useCallback(async (): Promise<void> => {
    // ✅ DOĞRU: Ref kullan (state async olabilir, ref her zaman güncel)
    const photosWithLandmarks = multiPhotosRef.current.filter(p => p.landmarks !== null);
    const photoCount = photosWithLandmarks.length;

    if (photoCount === 0) {
      throw new Error('Hiç landmark bulunamadı');
    }

    console.log(`🔍 [FINALIZE] ${photoCount} fotoğraf ile finalize başlıyor`);

    setMultiPhotoProcessingStatus('averaging');

    try {
      // Handle single photo case (no normalization/averaging needed)
      if (photoCount === 1) {
        console.log('✅ [SINGLE-PHOTO] Tek fotoğraf - normalizasyon atlanıyor');

        const photo = photosWithLandmarks[0];
        if (!photo.landmarks) {
          throw new Error('Landmarks eksik');
        }

        // ✅ DOĞRU: Raw landmarks kullan
        const singlePhotoLandmarks: FaceLandmarks = {
          landmarks: photo.landmarks.landmarks,
          totalPoints: photo.landmarks.landmarks.length,
          confidence: photo.landmarks.confidence || 0,
          faceBox: photo.landmarks.faceBox,
          faceRegions: photo.landmarks.faceRegions,
          regionDetails: photo.landmarks.regionDetails,
          imageSize: photo.landmarks.imageSize,
          timestamp: Date.now(),
        };

        // KVKK: Kayıt öncesi tüm metrikleri (çekicilik dahil) hesapla
        const metrics = await calculateAllRegionalMetrics(
          singlePhotoLandmarks.landmarks.map((l, i) => ({ x: l.x, y: l.y, z: l.z, index: l.index ?? i }))
        );

        // Save to database
        const faceAnalysisId = await saveAnalysisToDatabase(singlePhotoLandmarks, metrics);

        console.log('💾 [SINGLE-PHOTO] Database kayıt ID:', faceAnalysisId);

        // Save photo to local storage
        if (photo.uri) {
          await saveAnalysisPhoto(photo.uri, faceAnalysisId ?? undefined);
          setSavedPhotoUri(photo.uri);
          setSavedPhotoDate(new Date().toISOString());
        }

        // ✅ FIX: Eski multi-photo verisini AsyncStorage'dan da sil
        // Yoksa loadAnyAnalysisPhoto() eski multi-photo'yu bulup onu döndürüyor
        await deleteMultiPhotoAnalysis();
        console.log('🗑️ [SINGLE-PHOTO] Eski multi-photo verisi silindi');

        // Update state
        setSavedPhotoAnalysisId(faceAnalysisId);
        setSavedMultiPhotos(null); // Clear multi-photo state so we show single-photo card

        // Clear active analysis state so AnalysisLayout doesn't show
        setSelectedImage(null);
        setMeshImageUri(null);

        // ✅ Navigate to home instead of /analysis
        setMultiPhotoProcessingStatus('complete');
        router.push('/');
        return;
      }

      // Handle multi-photo case (2-3 photos)
      console.log('🔄 [MULTI-PHOTO] 2-3 fotoğraf - normalizasyon + ortalama');

      // ✅ DOĞRU: Sadece normalized olanları al
      const validNormalizedPhotos = photosWithLandmarks.filter(
        p => p.normalizedLandmarks !== null
      );

      if (validNormalizedPhotos.length < 2) {
        throw new Error('En az 2 normalize edilmiş fotoğraf gerekli');
      }

      const normalizedSets = validNormalizedPhotos
        .map(p => p.normalizedLandmarks)
        .filter((n): n is NormalizedLandmarks => n !== null);

      console.log(`📊 [MULTI-PHOTO] ${photoCount} fotoğraf ortalaması alınıyor...`);

      const averaged = averageLandmarks(normalizedSets);
      const consistency = calculateConsistency(averaged, normalizedSets, 'tr');

      setConsistencyScore(averaged.consistencyScore);
      setConsistencyResult(consistency);

      console.log('📊 [MULTI-PHOTO] Ortalama alındı:', {
        photoCount,
        consistencyScore: averaged.consistencyScore,
        level: consistency.level,
      });

      console.log('📊 [MULTI-PHOTO] Ortalama sonuçları:', {
        totalLandmarks: averaged.landmarks.length,
        consistencyScore: averaged.consistencyScore,
        consistencyLevel: consistency.level,
        recommendation: consistency.recommendation,
        problematicRegions: consistency.details.inconsistentRegions,
      });

      // Log first 5 landmark averaging verification
      for (let i = 0; i < Math.min(5, normalizedSets.length); i++) {
        const logData: any = {
          photo1: `(${normalizedSets[0].landmarks[i].x.toFixed(1)}, ${normalizedSets[0].landmarks[i].y.toFixed(1)})`,
          averaged: `(${averaged.landmarks[i].x.toFixed(1)}, ${averaged.landmarks[i].y.toFixed(1)})`,
        };

        if (normalizedSets[1]) {
          logData.photo2 = `(${normalizedSets[1].landmarks[i].x.toFixed(1)}, ${normalizedSets[1].landmarks[i].y.toFixed(1)})`;
        }
        if (normalizedSets[2]) {
          logData.photo3 = `(${normalizedSets[2].landmarks[i].x.toFixed(1)}, ${normalizedSets[2].landmarks[i].y.toFixed(1)})`;
        }

        console.log(`🔢 [MULTI-PHOTO] Landmark ${i} averaging check:`, logData);
      }

      // ============================================
      // 🔍 DIAGNOSTIC SUMMARY - ROOT CAUSE ANALYSIS
      // ============================================
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║  🔍 CONSISTENCY DIAGNOSTIC SUMMARY    ║');
      console.log('╚════════════════════════════════════════╝\n');

      // Extract metrics for diagnosis
      const scales = normalizedSets.map(s => s.transformParams.scale);
      const rotations = normalizedSets.map(s => s.transformParams.rotationAngle * 180 / Math.PI);
      const faceSizes = normalizedSets.map(s => s.originalFaceWidth);

      const scaleRange = Math.max(...scales) - Math.min(...scales);
      const rotationRange = Math.max(...rotations) - Math.min(...rotations);
      const maxSizeDiff = Math.max(...faceSizes) - Math.min(...faceSizes);
      const sizeDiffPercent = (maxSizeDiff / Math.min(...faceSizes)) * 100;

      console.log('📊 Final Results:', {
        consistencyScore: `${averaged.consistencyScore.toFixed(1)}/100`,
        level: consistency.level,
        recommendation: consistency.recommendation,
      });

      console.log('\n🔎 Potential Issues Detected:');

      const issues: string[] = [];

      // Check 1: Scale variance (camera distance)
      if (scaleRange > 0.5) {
        issues.push('⚠️ HIGH SCALE VARIANCE - Photos taken from different distances');
        console.log('  ⚠️ Scale Factor Range: ' + scaleRange.toFixed(4) + ' (threshold: 0.5)');
        console.log('    → Photos were taken from VERY DIFFERENT camera distances');
        console.log('    → Recommendation: Retake photos from same distance');
      } else if (scaleRange > 0.2) {
        issues.push('⚡ Moderate scale variance detected');
        console.log('  ⚡ Scale Factor Range: ' + scaleRange.toFixed(4) + ' (acceptable but not ideal)');
      } else {
        console.log('  ✅ Scale Consistency: GOOD (' + scaleRange.toFixed(4) + ')');
      }

      // Check 2: Rotation variance (head pose)
      if (rotationRange > 15) {
        issues.push('⚠️ HEAD POSE TOO DIFFERENT - Face angles vary significantly');
        console.log('  ⚠️ Rotation Range: ' + rotationRange.toFixed(2) + '° (threshold: 15°)');
        console.log('    → Photos have DIFFERENT head angles');
        console.log('    → Recommendation: Keep head straight in all photos');
      } else if (rotationRange > 7) {
        issues.push('⚡ Moderate rotation variance detected');
        console.log('  ⚡ Rotation Range: ' + rotationRange.toFixed(2) + '° (acceptable but not ideal)');
      } else {
        console.log('  ✅ Pose Consistency: GOOD (' + rotationRange.toFixed(2) + '°)');
      }

      // Check 3: Face size difference (raw)
      if (sizeDiffPercent > 30) {
        issues.push('⚠️ LARGE FACE SIZE DIFFERENCE - Head appears different sizes');
        console.log('  ⚠️ Face Size Difference: ' + sizeDiffPercent.toFixed(1) + '% (threshold: 30%)');
        console.log('    → Eye distances: ' + faceSizes.map(s => s.toFixed(1) + 'px').join(', '));
        console.log('    → Recommendation: Maintain same distance from camera');
      } else if (sizeDiffPercent > 15) {
        issues.push('⚡ Moderate face size difference');
        console.log('  ⚡ Face Size Difference: ' + sizeDiffPercent.toFixed(1) + '% (acceptable but not ideal)');
      } else {
        console.log('  ✅ Face Size Consistency: GOOD (' + sizeDiffPercent.toFixed(1) + '%)');
      }

      // Check 4: Landmark variance
      if (averaged.varianceDetails.avgVariance > 100) {
        issues.push('⚠️ HIGH LANDMARK VARIANCE - Facial features not aligning well');
        console.log('  ⚠️ Average Variance: ' + averaged.varianceDetails.avgVariance.toFixed(2) + 'px²');
      } else if (averaged.varianceDetails.avgVariance > 50) {
        console.log('  ⚡ Moderate Variance: ' + averaged.varianceDetails.avgVariance.toFixed(2) + 'px²');
      } else {
        console.log('  ✅ Landmark Variance: GOOD (' + averaged.varianceDetails.avgVariance.toFixed(2) + 'px²)');
      }

      // Summary
      if (issues.length > 0) {
        console.log('\n❌ ROOT CAUSE(S):');
        issues.forEach(issue => console.log('  ' + issue));
        console.log('\n💡 RECOMMENDATION:');
        if (scaleRange > 0.5 || sizeDiffPercent > 30) {
          console.log('  📸 Take all photos from the SAME DISTANCE from camera');
          console.log('  📸 Keep your face the SAME SIZE in all photos');
        }
        if (rotationRange > 15) {
          console.log('  📸 Keep your head at the SAME ANGLE in all photos');
          console.log('  📸 Look straight at camera in all photos');
        }
        if (averaged.varianceDetails.avgVariance > 100) {
          console.log('  📸 Ensure good lighting and clear face visibility');
          console.log('  📸 Avoid different facial expressions');
        }
      } else {
        console.log('\n✅ NO MAJOR ISSUES DETECTED');
        console.log('  All metrics are within acceptable ranges');
        if (averaged.consistencyScore < 90) {
          console.log('  Note: Score is still below 90, which may indicate minor variations');
        }
      }

      console.log('\n╔════════════════════════════════════════╗');
      console.log('║  END DIAGNOSTIC SUMMARY                ║');
      console.log('╚════════════════════════════════════════╝\n');

      const averagedFaceLandmarks: FaceLandmarks = {
        landmarks: averaged.landmarks.map((l, i) => ({
          x: l.x,
          y: l.y,
          z: l.z,
          index: i,
        })),
        totalPoints: averaged.landmarks.length,
        confidence: averaged.consistencyScore / 100,
        faceBox: multiPhotosRef.current[0].landmarks?.faceBox || { x: 0, y: 0, width: 1024, height: 1024 },
        faceRegions: multiPhotosRef.current[0].landmarks?.faceRegions || {} as FaceLandmarks['faceRegions'],
        regionDetails: multiPhotosRef.current[0].landmarks?.regionDetails || { totalRegions: 0, regionNames: [], pointCounts: {} },
        imageSize: { width: 1024, height: 1024 },
        timestamp: Date.now(),
      };

      // Log database save preparation
      console.log('💾 [MULTI-PHOTO] Database kaydı başlıyor:', {
        landmarkCount: averagedFaceLandmarks.landmarks.length,
        analysisDataKeys: Object.keys(averagedFaceLandmarks),
        multiPhotoMetadata: {
          photoCount,
          consistencyScore: averaged.consistencyScore,
          consistencyLevel: consistency.level,
        },
      });

      // Save to database with multi-photo metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Hata', 'Kullanıcı bulunamadı');
        return;
      }

      // Ortalama landmarklar üzerinden tüm metrikleri hesapla
      const metrics = await calculateAllRegionalMetrics(averagedFaceLandmarks.landmarks);

      const { data, error } = await supabase
        .from('face_analysis')
        .insert([
          {
            user_id: user.id,
            landmarks: null, // KVKK Uyumu
            metrics: metrics, // Hesaplanan metrikler
            analysis_data: {
              totalPoints: averagedFaceLandmarks.totalPoints,
              confidence: averagedFaceLandmarks.confidence,
              faceBox: averagedFaceLandmarks.faceBox,
              regionDetails: averagedFaceLandmarks.regionDetails,
              imageSize: averagedFaceLandmarks.imageSize,
              timestamp: averagedFaceLandmarks.timestamp,
              multiPhotoSource: {
                photoCount,
                consistencyScore: averaged.consistencyScore,
                consistencyLevel: consistency.level,
                processedAt: new Date().toISOString(),
              },
            },
          },
        ])
        .select('id')
        .single();

      if (error) {
        console.error('📸 [MULTI-PHOTO] DB kayıt hatası:', error);
        Alert.alert('Hata', 'Analiz kaydedilemedi');
        return;
      }

      const savedId = data?.id;
      if (!savedId) {
        Alert.alert('Hata', 'Kayıt ID alınamadı');
        return;
      }

      // Save photos to storage
      const photoUris = multiPhotosRef.current.map(p => p.uri).filter((u): u is string => u !== null);
      const savedMetadata = await saveMultipleAnalysisPhotos(
        photoUris,
        savedId,
        averaged.consistencyScore
      );

      if (savedMetadata) {
        setSavedMultiPhotos(savedMetadata);
        setSavedPhotoAnalysisId(savedId);
        setSavedPhotoUri(null); // Clear single-photo state so we show multi-photo card
      }

      // Clear active analysis state so AnalysisLayout doesn't show
      setSelectedImage(null);
      setMeshImageUri(null);

      setMultiPhotoProcessingStatus('complete');

      // Final summary report
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 [MULTI-PHOTO] FINAL SUMMARY REPORT');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('📸 Photo Processing:');
      console.log(`  ✓ Total photos: ${photoCount}`);
      console.log(`  ✓ All processed successfully`);
      console.log('');
      console.log('🔄 Normalization Summary:');
      const avgRotation = (normalizedSets.reduce((sum, s) =>
        sum + s.transformParams.rotationAngle, 0) / normalizedSets.length * 180 / Math.PI).toFixed(2);
      const avgScale = (normalizedSets.reduce((sum, s) =>
        sum + s.transformParams.scale, 0) / normalizedSets.length).toFixed(4);
      console.log(`  • Average rotation: ${avgRotation}°`);
      console.log(`  • Average scale: ${avgScale}`);
      console.log(`  • Pose similarity: ${consistency.details.similarPose ? '✅ Good' : '⚠️ Different'}`);
      console.log('');
      console.log('📊 Averaging Results:');
      console.log(`  • Consistency score: ${averaged.consistencyScore.toFixed(1)}/100`);
      console.log(`  • Consistency level: ${consistency.level}`);
      console.log(`  • Average variance: ${averaged.varianceDetails.avgVariance.toFixed(2)}px²`);
      console.log(`  • Problematic landmarks: ${averaged.varianceDetails.problematicIndices.length}/468`);
      console.log('');
      console.log('🎯 Quality Assessment:');
      console.log(`  • Same person check: ${consistency.details.samePerson ? '✅ Pass' : '❌ Fail'}`);
      console.log(`  • Similar pose check: ${consistency.details.similarPose ? '✅ Pass' : '⚠️ Warning'}`);
      console.log(`  • Inconsistent regions: ${consistency.details.inconsistentRegions.length > 0 ? consistency.details.inconsistentRegions.join(', ') : 'None'}`);
      console.log('');
      console.log('💾 Data Storage:');
      console.log(`  • Face analysis ID: ${savedId.substring(0, 8)}...`);
      console.log(`  • Landmark count: ${averagedFaceLandmarks.landmarks.length}`);
      console.log(`  • Storage type: Multi-photo (${photoCount} images)`);
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      // ✅ Navigate to home page instead of /analysis

    } catch (error) {
      console.error('📸 [MULTI-PHOTO] Finalize hatası:', error);
      Alert.alert('Hata', 'Analiz tamamlanırken bir hata oluştu');
      setMultiPhotoProcessingStatus('idle');
      setIsProcessing(false);
      setIsAnalyzing(false);
      processingRef.current = false;
    }
  }, []);  // ref kullanıldığı için dependency gerekmiyor

  // Remove a single photo from multi-photo state
  const removeMultiPhoto = useCallback((index: number) => {
    const emptyState: MultiPhotoState = {
      uri: null, landmarks: null, normalizedLandmarks: null,
      meshImageUri: null, validation: null,
    };

    // Ref güncelle (sync)
    multiPhotosRef.current[index] = emptyState;

    // State güncelle (UI render)
    setMultiPhotos(prev => {
      const updated = [...prev];
      updated[index] = emptyState;
      return updated;
    });

    console.log(`📸 [REMOVE] Fotoğraf ${index + 1} silindi`);
  }, []);

  // Clear multi-photo data
  const clearMultiPhotoData = useCallback(async () => {
    try {
      await deleteMultiPhotoAnalysis();
      resetMultiPhotoState();
      setSavedMultiPhotos(null);
      setSavedPhotoAnalysisId(null);
      setConsistencyScore(null);
      console.log('📸 [MULTI-PHOTO] Tüm veriler temizlendi');
    } catch (error) {
      console.error('📸 [MULTI-PHOTO] Temizleme hatası:', error);
    }
  }, [resetMultiPhotoState]);

  // Pick multiple images from gallery
  const pickMultipleImages = useCallback(async (): Promise<string[] | null> => {
    const hasPermission = await checkGalleryPermission();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 3,
        quality: 0.9,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uris = result.assets.slice(0, 3).map(a => a.uri);
        console.log('📸 [MULTI-PHOTO] Galeriden seçildi:', uris.length);
        return uris;
      }
      return null;
    } catch (error) {
      console.error('📸 [MULTI-PHOTO] Galeri hatası:', error);
      Alert.alert('Hata', 'Fotoğraflar seçilemedi');
      return null;
    }
  }, []);

  return {
    // State
    mediaPipeReady,
    selectedImage,
    faceLandmarks,
    meshImageUri,
    meshValidation,
    isAnalyzing,
    showImagePicker,
    showMeshPreview,
    // Saved photo state (legacy single photo)
    savedPhotoUri,
    savedPhotoDate,
    savedPhotoAnalysisId,
    isLoadingPhoto,
    // Multi-photo state
    isMultiPhotoMode,
    setIsMultiPhotoMode,
    multiPhotos,
    currentPhotoIndex,
    multiPhotoProcessingStatus,
    consistencyScore,
    consistencyResult,
    savedMultiPhotos,
    // Refs
    webViewRef,
    // Handlers
    handleWebViewMessage,
    processImageWithMediaPipe,
    handleConfirmMesh,
    handleRetake,
    startNewAnalysis,
    takePhoto,
    pickImage,
    setShowImagePicker,
    clearSavedPhoto,
    // Multi-photo handlers
    resetMultiPhotoState,
    removeMultiPhoto,
    processAllMultiPhotos,
    finalizeMultiPhotoAnalysis,
    clearMultiPhotoData,
    pickMultipleImages,
    updateMultiPhotoWithLandmarks,
    // Constants
    mediaPipeHTML,
    isProcessing, // UI indication
    processingRef, // Debug/Internal
  };
}

