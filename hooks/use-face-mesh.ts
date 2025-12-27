import { mediaPipeHTML } from '@/lib/mediapipe-html';
import { supabase } from '@/lib/supabase';
import { Camera } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert } from 'react-native';
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
    // Koordinatlar fotoğraf içinde mi? (512x512 piksel)
    if (!point || point.x < 0 || point.x > 512 || point.y < 0 || point.y > 512) {
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

  if (confidence >= 0.95) {
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
  } else if (confidence >= 0.73) {
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

  const webViewRef = useRef<WebView>(null);

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

  // Veritabanına kaydet
  const saveAnalysisToDatabase = async (landmarksData: FaceLandmarks) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
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
        ]);

      if (error) {
        if (__DEV__) {
          console.error('Kayıt hatası:', error);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Kayıt işlemi hatası:', error);
      }
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
      await saveAnalysisToDatabase(faceLandmarks);

      Alert.alert(
        'Analiz Başarılı! 🎉',
        `${faceLandmarks.totalPoints} noktalı MediaPipe analizi kaydedildi!`,
        [
          {
            text: 'Tamam',
            onPress: () => router.push('/analysis')
          }
        ]
      );
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
      Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermeniz gerekiyor');
      return false;
    }
    return true;
  };

  // Galeri iznini kontrol et
  const checkGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraflara erişmek için izin vermeniz gerekiyor');
      return false;
    }
    return true;
  };

  // Fotoğraf çekme uyarısı
  const showPhotoGuidelines = () => {
    if (__DEV__) {
      console.log('[Flow] showPhotoGuidelines çağrıldı');
    }
    Alert.alert(
      '📸 FaceAnalyzer AI Rehberi',
      '• Yüzünüzün tamamı görünecek şekilde çekin\n• İyi ışıklı bir ortam seçin\n• Kameraya düz bakın\n• Saç yüzünüzü kapatmasın\n• 468 nokta için net fotoğraf önemli\n• Özgün AI teknolojimizle analiz edilecek',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'FaceAnalyzer ile Analiz Et', onPress: () => setShowImagePicker(true) }
      ]
    );
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

      // Resmi optimize et (512x512 - MediaPipe için optimal)
      const manipulatedImage = await (async () => {
        const context = ImageManipulator.manipulate(imageUri);
        context.resize({ width: 512, height: 512 });
        const image = await context.renderAsync();
        const result = await image.saveAsync({
          format: SaveFormat.JPEG,
          compress: 0.9,
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
    showPhotoGuidelines();
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
    showPhotoGuidelines,
    setShowImagePicker,
    // Constants
    mediaPipeHTML,
  };
}

