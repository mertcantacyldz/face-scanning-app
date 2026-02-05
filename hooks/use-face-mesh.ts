import { mediaPipeHTML } from '@/lib/mediapipe-html';
import { loadAnalysisPhoto, saveAnalysisPhoto, deleteAnalysisPhoto, PhotoMetadata } from '@/lib/photo-storage';
import { supabase } from '@/lib/supabase';
import { Camera } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

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
const validateMesh = (faceData: any) => {
  const landmarks = faceData.landmarks;

  // 1. 468 landmark var mı?
  if (!landmarks || landmarks.length !== 468) {
    return {
      isValid: false,
      quality: 'poor' as const,
      message: '468 nokta tespit edilemedi. Lütfen daha net bir fotoğraf çekin.',
      confidence: 0
    };
  }

  // 2. Kritik landmark'lar geçerli koordinatlarda mı?
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
    // Koordinatlar fotoğraf içinde mi? (1024x1024 piksel)
    if (!point || point.x < 0 || point.x > 1024 || point.y < 0 || point.y > 1024) {
      return {
        isValid: false,
        quality: 'poor' as const,
        message: 'Bazı önemli yüz noktaları tespit edilemedi. Yüzünüzün tamamı görünür olmalı.',
        confidence: 0
      };
    }
  }

  // ✅ 3. YENİ: Confidence-based quality assessment
  // Confidence değeri faceData objesinin içinde (landmarks array'inde DEĞİL!)
  const confidence = faceData.confidence || 0.99;
  const confidencePercent = Math.round(confidence * 100);

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

  if (confidence >= 0.94) { // 0.95 -> 0.94 (Hafif esnetme)
    // Optimal yüz boyutu
    return {
      isValid: true,
      quality: 'excellent' as const,
      message: 'Mükemmel kalite!',
      confidence: confidencePercent
    };
  } else if (confidence >= 0.80) {
    // Kabul edilebilir boyut
    return {
      isValid: true,
      quality: 'good' as const,
      message: 'İyi kalite',
      confidence: confidencePercent
    };
  } else if (confidence >= 0.70) { // 0.73 -> 0.70 (Hafif esnetme)
    // Yüz çok büyük (75%)
    return {
      isValid: true,
      quality: 'warning' as const,
      message: 'Yüz çok yakın - Kamerayı biraz uzaklaştırın',
      confidence: confidencePercent
    };
  } else {
    // Yüz çok küçük (70%)
    return {
      isValid: true,
      quality: 'poor' as const,
      message: 'Yüz küçük - Kamerayı yaklaştırın veya yüzünüzü merkezleyin',
      confidence: confidencePercent
    };
  }
};

export function useFaceMesh() {
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

  // Saved photo state (kalıcı fotoğraf)
  const [savedPhotoUri, setSavedPhotoUri] = useState<string | null>(null);
  const [savedPhotoDate, setSavedPhotoDate] = useState<string | null>(null);
  const [savedPhotoAnalysisId, setSavedPhotoAnalysisId] = useState<string | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);

  const webViewRef = useRef<WebView>(null);

  // Mount'ta kayıtlı fotoğrafı yükle
  useEffect(() => {
    const loadSavedPhoto = async () => {
      try {
        const metadata = await loadAnalysisPhoto();
        if (metadata) {
          setSavedPhotoUri(metadata.uri);
          setSavedPhotoDate(metadata.savedAt);
          setSavedPhotoAnalysisId(metadata.faceAnalysisId || null);
          console.log('📸 [useFaceMesh] Kayıtlı fotoğraf yüklendi:', metadata.uri);
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

      console.log('📥 [WEBVIEW MESAJI]', {
        type: data.type,
        timestamp: Date.now()
      });

      switch (data.type) {
        case 'READY':
          if (__DEV__) {
            console.log('[WebView] READY mesajı alındı');
          }
          setMediaPipeReady(true);
          break;

        case 'LANDMARKS':
          console.log('🎯 [LANDMARKS GELDİ]', {
            noktaSayisi: data.data.totalPoints,
            guvenilirlik: data.data.confidence,
            timestamp: data.data.timestamp,
            hangiResim: selectedImage?.substring(0, 50)
          });

          // DEBUG-MIRROR: Ayna kontrolü için kritik landmark'lar
          console.log('🎯 [DEBUG-MIRROR] LANDMARKS ALINDI - AYNA KONTROLÜ:', {
            P4_noseTip_x: data.data.landmarks[4]?.x.toFixed(2),
            P33_rightEyeOuter_x: data.data.landmarks[33]?.x.toFixed(2),
            P263_leftEyeOuter_x: data.data.landmarks[263]?.x.toFixed(2),
            // Aynalama kontrolü: Normal durumda P263 > P33 (sol göz sağda)
            mirrorCheck: data.data.landmarks[263]?.x > data.data.landmarks[33]?.x ? 'NORMAL' : 'MIRRORED',
            faceCenter: ((data.data.landmarks[33]?.x + data.data.landmarks[263]?.x) / 2).toFixed(2),
            tipDeviation: (data.data.landmarks[4]?.x - (data.data.landmarks[33]?.x + data.data.landmarks[263]?.x) / 2).toFixed(2),
            imageTimestamp: Date.now()
          });

          setFaceLandmarks(data.data);

          // Mesh validation yap - TÜM data.data objesini gönder (confidence içeriyor)
          const validation = validateMesh(data.data);
          setMeshValidation(validation);

          setIsAnalyzing(false);
          setIsProcessing(false);
          console.log('🔓 [KUYRUK] İşlem kilidi açıldı (LANDMARKS)');
          break;

        case 'MESH_IMAGE':
          console.log('🖼️ [MESH GÖRÜNTÜSÜ GELDİ]', {
            meshUzunluk: data.data.meshImage?.length,
            timestamp: Date.now(),
            hangiResim: selectedImage?.substring(0, 50)
          });

          setMeshImageUri(data.data.meshImage);
          setShowMeshPreview(true);
          break;

        case 'NO_FACE':
          console.log('❌ [ANALİZ BAŞARISIZ]', {
            type: 'NO_FACE',
            message: 'Yüz bulunamadı',
            timestamp: Date.now()
          });

          setIsAnalyzing(false);
          setIsProcessing(false);
          console.log('🔓 [KUYRUK] İşlem kilidi açıldı (NO_FACE)');

          Alert.alert(
            'Yüz Bulunamadı',
            'Fotoğrafta yüz tespit edilemedi. Lütfen:\n• Yüzünüz net görünsün\n• İyi ışıkta çekin\n• Kameraya düz bakın'
          );
          break;

        case 'ERROR':
          console.log('❌ [ANALİZ BAŞARISIZ]', {
            type: 'ERROR',
            message: data.error,
            timestamp: Date.now()
          });

          setIsAnalyzing(false);
          setIsProcessing(false);
          console.log('🔓 [KUYRUK] İşlem kilidi açıldı (ERROR)');

          Alert.alert('Analiz Hatası', data.error);
          break;
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[WebView] mesaj parse hatası:', error);
      }
    }
  };

  // Veritabanına kaydet - returns the saved record ID
  const saveAnalysisToDatabase = async (landmarksData: FaceLandmarks): Promise<string | null> => {
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
            landmarks: landmarksData.landmarks,
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
      const savedId = await saveAnalysisToDatabase(faceLandmarks);

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
          'Analiz Başarılı! 🎉',
          `${faceLandmarks.totalPoints} noktalı MediaPipe analizi kaydedildi!`,
          [
            {
              text: 'Tamam',
              // Pass the saved ID to analysis page to ensure it loads the correct data
              onPress: () => router.push({ pathname: '/analysis', params: { faceAnalysisId: savedId } })
            }
          ]
        );
      } else {
        Alert.alert(
          'Kayıt Hatası',
          'Analiz kaydedilemedi. Lütfen tekrar deneyin.',
          [{ text: 'Tamam' }]
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
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'İzin Gerekli',
        'Kamera kullanmak için ayarlardan izin vermeniz gerekiyor.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Ayarları Aç', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }
    return true;
  };

  // Galeri iznini kontrol et
  const checkGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'İzin Gerekli',
        'Fotoğraflara erişmek için ayarlardan izin vermeniz gerekiyor.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Ayarları Aç', onPress: () => Linking.openSettings() }
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
      Alert.alert('Hata', 'Fotoğraf çekilemedi. Lütfen tekrar deneyin.');
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
      Alert.alert('Hata', 'Fotoğraf seçilemedi. Lütfen tekrar deneyin.');
    }
  };

  // MediaPipe ile resmi işle
  const processImageWithMediaPipe = async (imageUri: string) => {
    if (!mediaPipeReady) {
      Alert.alert('MediaPipe Hazır Değil', 'Web teknolojisi henüz yüklenmedi. Lütfen bekleyin.');
      return;
    }

    console.log('🔵 [İŞLEM BAŞLADI]', {
      timestamp: Date.now(),
      imageUri: imageUri.substring(0, 50),
      mevcutLandmarks: faceLandmarks ? 'VAR' : 'YOK',
      mevcutMeshUri: meshImageUri ? 'VAR' : 'YOK'
    });

    // İşlem kuyruğu kontrolü
    if (isProcessing) {
      console.warn('⚠️ [KUYRUK] Zaten işleniyor, atlıyorum');
      return;
    }

    console.log('🧹 [STATE TEMİZLENİYOR]');

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
      console.log('🔒 [KUYRUK] İşlem kilitlendi');

      // Resmi optimize et (1024x1024 - MediaPipe için optimal, yüksek hassasiyet)
      const manipulatedImage = await (async () => {
        const context = ImageManipulator.manipulate(imageUri);
        context.resize({ width: 1024, height: 1024 });
        const image = await context.renderAsync();
        const result = await image.saveAsync({
          format: SaveFormat.JPEG,
          compress: 0.95,
          base64: true
        });
        return result;
      })();

      console.log('✅ [RESİM İŞLENDİ]', {
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        base64Uzunluk: manipulatedImage.base64?.length,
        timestamp: Date.now()
      });

      console.log('📤 [WEBVIEW\'A GÖNDERİLİYOR]', {
        mediaPipeReady,
        timestamp: Date.now()
      });

      // WebView'e base64 image gönder ve canvas'ı temizle
      const injectedJS = `
        (function() {
          // Canvas'ı HEMEN temizle
          const canvas = document.getElementById('output_canvas');
          if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            console.log('[WEBVIEW] Canvas enjeksiyon sırasında temizlendi');
          }

          if (window.processImage && typeof window.processImage === 'function') {
            window.processImage('${manipulatedImage.base64}');
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ERROR',
              error: 'MediaPipe fonksiyonu bulunamadı'
            }));
          }
        })();
        true;
      `;

      webViewRef.current?.injectJavaScript(injectedJS);

    } catch (error) {
      if (__DEV__) {
        console.error('[MediaPipe] process hatası:', error);
      }
      setIsAnalyzing(false);
      setIsProcessing(false);
      console.log('🔓 [KUYRUK] İşlem kilidi açıldı (ERROR)');
      Alert.alert('İşlem Hatası', 'Resim MediaPipe ile işlenemedi. Lütfen tekrar deneyin.');
    }
  };

  // Yeni analiz başlat
  const startNewAnalysis = () => {
    if (__DEV__) {
      console.log('[Flow] startNewAnalysis çağrıldı:', {
        hasSelectedImage: !!selectedImage,
        hasFaceLandmarks: !!faceLandmarks,
      });
    }
    setSelectedImage(null);
    setFaceLandmarks(null);
    setMeshImageUri(null);
    setShowImagePicker(true);
  };

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
    // Saved photo state
    savedPhotoUri,
    savedPhotoDate,
    savedPhotoAnalysisId,
    isLoadingPhoto,
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
    // Constants
    mediaPipeHTML,
  };
}

