// app/(tabs)/index.tsx - MediaPipe Web Implementation
import { Camera } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';

const { width: screenWidth } = Dimensions.get('window');

interface Profile {
  id: string;
  full_name: string;
  is_premium: boolean;
}

interface FaceLandmarks {
  landmarks: {x: number, y: number, z: number, index: number}[];
  totalPoints: number;
  confidence: number;
  faceBox: {x: number, y: number, width: number, height: number};
  faceRegions: {
    faceOval: {x: number, y: number, z: number, index: number}[];
    forehead: {x: number, y: number, z: number, index: number}[];
    leftEyebrow: {x: number, y: number, z: number, index: number}[];
    rightEyebrow: {x: number, y: number, z: number, index: number}[];
    leftEye: {x: number, y: number, z: number, index: number}[];
    rightEye: {x: number, y: number, z: number, index: number}[];
    nose: {x: number, y: number, z: number, index: number}[];
    noseBridge: {x: number, y: number, z: number, index: number}[];
    noseTip: {x: number, y: number, z: number, index: number}[];
    noseWings: {x: number, y: number, z: number, index: number}[];
    lips: {x: number, y: number, z: number, index: number}[];
    upperLip: {x: number, y: number, z: number, index: number}[];
    lowerLip: {x: number, y: number, z: number, index: number}[];
    mouthOutline: {x: number, y: number, z: number, index: number}[];
    jawline: {x: number, y: number, z: number, index: number}[];
    // Yanaklar ve diğer bölgeler de eklenebilir
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

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [faceLandmarks, setFaceLandmarks] = useState<FaceLandmarks | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [mediaPipeReady, setMediaPipeReady] = useState(false);
  const [imageToProcess, setImageToProcess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fullName, setFullName] = useState('');
  
  const webViewRef = useRef<WebView>(null);

  // console.log(faceLandmarks, '🎯 Face Landmarks State');
  // MediaPipe Web HTML Template
const mediaPipeHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>MediaPipe Face Mesh - Tüm Yüz Bölgeleri</title>
    <style>
        body { margin: 0; padding: 20px; background: #f0f0f0; }
        #output_canvas { 
            width: 100%; 
            max-width: 500px; 
            height: auto; 
            border: 2px solid #4CAF50;
            border-radius: 10px;
            display: block;
            margin: 20px auto;
        }
        #status { 
            text-align: center; 
            padding: 10px; 
            font-family: Arial, sans-serif;
            background: white;
            border-radius: 8px;
            margin: 10px 0;
        }
        .loading { color: #2196F3; }
        .ready { color: #4CAF50; }
        .error { color: #f44336; }
    </style>
</head>
<body>
    <div id="status" class="loading">📥 MediaPipe Face Mesh yükleniyor...</div>
    <canvas id="output_canvas" width="512" height="512"></canvas>

    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"></script>

    <script>
        const statusDiv = document.getElementById('status');
        const canvasElement = document.getElementById('output_canvas');
        const canvasCtx = canvasElement.getContext('2d');

        let faceMesh;
        let isReady = false;

        // TÜM YÜZ BÖLGELERİ - MediaPipe 468 nokta indeksleri
        const faceRegions = {
            // Yüz ovali (dış kontur)
            faceOval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
            
            // Alın bölgesi
            forehead: [10, 338, 297, 332, 284, 251, 301, 298, 333, 299, 337, 151, 108, 69, 104, 68, 71, 21, 54, 103, 67, 109, 9, 8, 168, 193, 122, 196, 3, 51, 197],
            
            // Kaşlar
            leftEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46, 124, 35, 226, 113, 225, 224, 223, 222, 221, 189],
            rightEyebrow: [336, 296, 334, 293, 300, 276, 283, 282, 295, 285, 413, 441, 442, 443, 444, 445, 446, 447, 448, 449],
            
            // Gözler - tam kontur
            leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 247, 30, 29, 27, 28, 56, 190, 243, 244, 245, 122, 6, 351, 465, 464, 463, 362, 398, 384],
            rightEye: [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382, 398, 384, 385, 386, 387, 388, 466, 253, 254, 255, 256, 257, 258, 259, 260, 467, 446, 255, 339, 448, 449],
            
            // Burun
            nose: [19, 20, 94, 125, 141, 235, 236, 3, 51, 48, 115, 131, 134, 102, 49, 220, 305, 290, 328, 326, 2, 97, 99, 1, 164, 129, 49, 131, 134, 102, 64, 49, 131, 134, 102],
            noseBridge: [168, 193, 122, 196, 3, 51, 197, 419, 248, 281, 275, 4, 5, 195, 6, 419, 248, 197, 131, 134, 51],
            noseTip: [1, 2, 98, 327, 326, 197, 419, 248, 281, 275, 4, 5, 195, 6, 168, 193, 122, 196],
            noseWings: [129, 98, 97, 2, 326, 327, 358, 343, 277, 355, 371, 266, 425, 436, 432, 434, 430, 431, 262, 428, 199, 208, 32, 211, 210, 214, 192],
            
            // Ağız ve dudaklar
            lips: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318],
            upperLip: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
            lowerLip: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 179, 178, 177, 176, 175, 152, 148, 149, 150, 136, 172, 58, 132, 93, 234],
            mouthOutline: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324],
            
            // Çene hattı
            jawline: [58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338, 10, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132, 58]
        };

        // MediaPipe Face Mesh başlatma
        async function initMediaPipe() {
            try {
                statusDiv.innerHTML = '🔄 MediaPipe Face Mesh başlatılıyor...';
                
                faceMesh = new FaceMesh({
                    locateFile: (file) => {
                        return \`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/\${file}\`;
                    }
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: false,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.0,
                    selfieMode: false,
                    staticImageMode: true,
                    modelComplexity: 1

                });

                faceMesh.onResults(onResults);
                
                isReady = true;
                statusDiv.innerHTML = '✅ MediaPipe Face Mesh hazır - Tüm yüz bölgeleri analizi!';
                statusDiv.className = 'ready';
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'READY',
                    ready: true
                }));
                
            } catch (error) {
                console.error('MediaPipe init error:', error);
                statusDiv.innerHTML = '❌ MediaPipe yükleme hatası: ' + error.message;
                statusDiv.className = 'error';
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ERROR',
                    error: error.message
                }));
            }
        }

        // Face Mesh sonuçlarını işle
        function onResults(results) {
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            
            if (results.image) {
                canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
            }

            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];
                
                // Manuel olarak bağlantı noktalarını çiz - MediaPipe sabitleri yerine
                drawFaceConnections(canvasCtx, landmarks);
                
                // Yüz bounding box hesapla
                let minX = 1, minY = 1, maxX = 0, maxY = 0;
                landmarks.forEach(point => {
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                    maxX = Math.max(maxX, point.x);
                    maxY = Math.max(maxY, point.y);
                });

                // Tüm yüz bölgelerini hazırla
                const processedRegions = {};
                Object.keys(faceRegions).forEach(regionName => {
                    processedRegions[regionName] = faceRegions[regionName]
                        .filter(idx => idx < landmarks.length)
                        .map(idx => ({
                            x: landmarks[idx]?.x * canvasElement.width || 0,
                            y: landmarks[idx]?.y * canvasElement.height || 0,
                            z: landmarks[idx]?.z || 0,
                            index: idx
                        }));
                });

                // React Native'e TÜM VERİYİ gönder
                const result = {
                    type: 'LANDMARKS',
                    data: {
                        landmarks: landmarks.map((point, index) => ({
                            x: parseFloat((point.x * canvasElement.width).toFixed(4)),  // ✅ 4 ondalık
                            y: parseFloat((point.y * canvasElement.height).toFixed(4)),
                            z: parseFloat((point.z || 0).toFixed(6)),  // ✅ 6 ondalık - 3D için
                            index: index
                        })),
                        totalPoints: landmarks.length,
                        confidence: 0.95,
                        faceBox: {
                            x: minX * canvasElement.width,
                            y: minY * canvasElement.height,
                            width: (maxX - minX) * canvasElement.width,
                            height: (maxY - minY) * canvasElement.height
                        },
                        faceRegions: processedRegions,
                        regionDetails: {
                            totalRegions: Object.keys(faceRegions).length,
                            regionNames: Object.keys(faceRegions),
                            pointCounts: Object.keys(faceRegions).reduce((acc, region) => {
                                acc[region] = faceRegions[region].length;
                                return acc;
                            }, {})
                        },
                        timestamp: Date.now(),
                        imageSize: {
                            width: canvasElement.width,
                            height: canvasElement.height
                        }
                    }
                };
                
                window.ReactNativeWebView.postMessage(JSON.stringify(result));
                
            } else {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'NO_FACE',
                    message: 'Fotoğrafta yüz tespit edilemedi'
                }));
            }
        }

        // Manuel yüz bağlantılarını çiz
        function drawFaceConnections(ctx, landmarks) {
            if (!landmarks || landmarks.length < 468) return;

            // Yüz ovali
            drawRegion(ctx, landmarks, faceRegions.faceOval, '#E0E0E0', 2);
            
            // Gözler
            drawRegion(ctx, landmarks, faceRegions.leftEye, '#30FF30', 1.5);
            drawRegion(ctx, landmarks, faceRegions.rightEye, '#FF3030', 1.5);
            
            // Kaşlar
            drawRegion(ctx, landmarks, faceRegions.leftEyebrow, '#FFA500', 1.5);
            drawRegion(ctx, landmarks, faceRegions.rightEyebrow, '#FFA500', 1.5);
            
            // Burun
            drawRegion(ctx, landmarks, faceRegions.nose, '#800080', 1.5);
            
            // Ağız
            drawRegion(ctx, landmarks, faceRegions.lips, '#E0E0E0', 1.5);
            
            // Tüm noktaları çiz (isteğe bağlı)
            landmarks.forEach((point, i) => {
                if (i % 10 === 0) { // Her 10 noktadan birini çiz
                    drawPoint(ctx, point, '#FF0000', 2);
                }
            });
        }

        // Bölge çizimi
        function drawRegion(ctx, landmarks, indices, color, lineWidth) {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            
            for (let i = 0; i < indices.length; i++) {
                const idx = indices[i];
                if (idx < landmarks.length) {
                    const point = landmarks[idx];
                    const x = point.x * canvasElement.width;
                    const y = point.y * canvasElement.height;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            }
            
            // İlk noktaya geri dön
            const firstIdx = indices[0];
            if (firstIdx < landmarks.length) {
                const firstPoint = landmarks[firstIdx];
                ctx.lineTo(firstPoint.x * canvasElement.width, firstPoint.y * canvasElement.height);
            }
            
            ctx.stroke();
        }

        // Nokta çizimi
        function drawPoint(ctx, point, color, radius) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(
                point.x * canvasElement.width,
                point.y * canvasElement.height,
                radius,
                0,
                2 * Math.PI
            );
            ctx.fill();
        }

        // Base64 image'ı işle
        window.processImage = function(base64Image) {
            if (!isReady) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ERROR',
                    error: 'MediaPipe henüz hazır değil'
                }));
                return;
            }

            try {
                statusDiv.innerHTML = '🔄 Tüm yüz bölgeleri analiz ediliyor...';
                statusDiv.className = 'loading';
                
                const img = new Image();
                img.onload = async function() {
                    try {
                        await faceMesh.send({image: img});
                    } catch (error) {
                        console.error('Process error:', error);
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'ERROR',
                            error: 'Analiz sırasında hata: ' + error.message
                        }));
                    }
                };
                
                img.onerror = function(error) {
                    console.error('Image load error:', error);
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'ERROR',
                        error: 'Resim yüklenemedi'
                    }));
                };
                
                img.src = 'data:image/jpeg;base64,' + base64Image;
                
            } catch (error) {
                console.error('processImage error:', error);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ERROR',
                    error: error.message
                }));
            }
        };

        // MediaPipe'ı başlat
        initMediaPipe();
    </script>
</body>
</html>
`;

  // Kullanıcı profilini al
  useEffect(() => {
    fetchProfile();
  }, []);

   const fetchProfile = async () => {
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
 
       const { data: profileData } = await supabase
         .from('profiles')
         .select('*')
         .eq('user_id', user.id)
         .single();
 
       if (profileData) {
         setProfile(profileData);
         setFullName(profileData.full_name || '');
       } else {
         Alert.alert('Hata', 'Profil bulunamadı');
       }
     } catch (error) {
       console.error('Hata:', error);
     } finally {
       setLoading(false);
       setRefreshing(false);
     }
   };
  // WebView mesajlarını dinle
  const handleWebViewMessage = (event: any) => {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    
    switch (data.type) {
      case 'READY':
        console.log('✅ MediaPipe Web hazır!');
        setMediaPipeReady(true);
        break;
        
      case 'LANDMARKS':
        // console.log('🎯 Face landmarks alındı:', data.data.totalPoints, 'nokta');
        
        // Detaylı loglama
        // console.log('RAW DATA:', JSON.stringify(data, null, 2) ,"raw dataaa");
        //  console.log('📊 FACE DATA:', JSON.stringify(data.data, null, 2), "face dataaaa");
         console.log('📊 YÜZ ANALİZ DETAYLARI:');
         console.log('📍 Toplam Nokta:', data.data.totalPoints);
         console.log('📏 Yüz Boyutu:', data.data.faceBox);
         console.log('🎭 Bölge Sayısı:', data.data.regionDetails.totalRegions);
         console.log('🔢 Bölge Nokta Dağılımı:', data.data.regionDetails.pointCounts);
        
        // İlk 5 landmark'ı detaylı göster
        console.log('📍 İlk 5 Landmark:');
        data.data.landmarks.slice(0, 5).forEach((point: any, index: number) => {
          console.log(`  ${index + 1}. x:${point.x.toFixed(1)} y:${point.y.toFixed(1)} z:${point.z.toFixed(3)}`);
        });
        
        // Yüz bölgelerinden örnekler
        console.log('🎭 Yüz Bölgeleri (Örnekler):');
        Object.keys(data.data.faceRegions).slice(0, 3).forEach(region => {
          console.log(`  ${region}: ${data.data.faceRegions[region].length} nokta`);
        });
        
        setFaceLandmarks(data.data);
        setIsAnalyzing(false);
        Alert.alert(
          'Analiz Başarılı! 🎉', 
          `${data.data.totalPoints} noktalı MediaPipe analizi tamamlandı!`
        );
        break;
        
      case 'NO_FACE':
        console.log('❌ Yüz bulunamadı');
        setIsAnalyzing(false);
        Alert.alert(
          'Yüz Bulunamadı', 
          'Fotoğrafta yüz tespit edilemedi. Lütfen:\n• Yüzünüz net görünsün\n• İyi ışıkta çekin\n• Kameraya düz bakın'
        );
        break;
        
      case 'ERROR':
        console.error('❌ MediaPipe hatası:', data.error);
        setIsAnalyzing(false);
        Alert.alert('Analiz Hatası', data.error);
        break;
    }
  } catch (error) {
    console.error('WebView mesaj parse hatası:', error);
  }
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
    Alert.alert(
      '📸 MediaPipe Face Mesh Rehberi',
      '• Yüzünüzün tamamı görünecek şekilde çekin\n• İyi ışıklı bir ortam seçin\n• Kameraya düz bakın\n• Saç yüzünüzü kapatmasın\n• 468 nokta için net fotoğraf önemli\n• MediaPipe teknolojisiyle analiz edilecek',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'MediaPipe ile Analiz Et', onPress: () => setShowImagePicker(true) }
      ]
    );
  };

  // Kameradan fotoğraf çek
  const takePhoto = async () => {
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Kare format (MediaPipe için optimal)
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setShowImagePicker(false);
        await processImageWithMediaPipe(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Kamera hatası:', error);
      Alert.alert('Hata', 'Fotoğraf çekilemedi. Lütfen tekrar deneyin.');
    }
  };

  // Galeriden fotoğraf seç
  const pickImage = async () => {
    const hasPermission = await checkGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Kare format
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setShowImagePicker(false);
        await processImageWithMediaPipe(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Galeri hatası:', error);
      Alert.alert('Hata', 'Fotoğraf seçilemedi. Lütfen tekrar deneyin.');
    }
  };

  // MediaPipe ile resmi işle
  const processImageWithMediaPipe = async (imageUri: string) => {
    if (!mediaPipeReady) {
      Alert.alert('MediaPipe Hazır Değil', 'Web teknolojisi henüz yüklenmedi. Lütfen bekleyin.');
      return;
    }

    setSelectedImage(imageUri);
    setIsAnalyzing(true);
    setFaceLandmarks(null);

    try {
      console.log('🔄 MediaPipe Face Mesh analizi başlatılıyor...');

      // Resmi optimize et (512x512 - MediaPipe için optimal)
      const manipulatedImage = await manipulateAsync(
        imageUri,
        [
          { resize: { width: 512, height: 512 } }
        ],
        { 
          compress: 0.9, 
          format: SaveFormat.JPEG,
          base64: true
        }
      );

      console.log('📸 Resim MediaPipe için hazırlandı');

      // WebView'e base64 image gönder
      const injectedJS = `
        if (window.processImage && typeof window.processImage === 'function') {
          window.processImage('${manipulatedImage.base64}');
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ERROR',
            error: 'MediaPipe fonksiyonu bulunamadı'
          }));
        }
        true;
      `;

      webViewRef.current?.injectJavaScript(injectedJS);

    } catch (error) {
      console.error('❌ MediaPipe process hatası:', error);
      setIsAnalyzing(false);
      Alert.alert('İşlem Hatası', 'Resim MediaPipe ile işlenemedi. Lütfen tekrar deneyin.');
    }
  };

  // Yeni analiz başlat
  const startNewAnalysis = () => {
    setSelectedImage(null);
    setFaceLandmarks(null);
    showPhotoGuidelines();
  };

 if (!profile) {
  return (
    <SafeAreaView className="flex-1 bg-background justify-center items-center">
      <View className="items-center">
        <Text className="text-lg text-muted-foreground mb-2">Yükleniyor...</Text>
        <Text className="text-sm text-muted-foreground">Profil bilgileri alınıyor</Text>
      </View>
    </SafeAreaView>
  );
}

 console.log("-------------------");
 console.log('🎯 YÜZ ANALİZ VERİLERİ:');
 console.log('📍 Toplam Nokta:', faceLandmarks?.landmarks);
// console.log(faceLandmarks?.faceRegions.faceOval, '🎯 FaceOval');
// console.log(faceLandmarks?.faceRegions.forehead, '🎯 Forehead');
// console.log(faceLandmarks?.faceRegions.jawline, '🎯 Jawline');
// console.log(faceLandmarks?.faceRegions.leftEye, '🎯 LeftEye');
// console.log(faceLandmarks?.faceRegions.leftEyebrow, '🎯 LeftEyebrow');
// console.log(faceLandmarks?.faceRegions.lips, '🎯 Lips');
// console.log(faceLandmarks?.faceRegions.lowerLip, '🎯 LowerLip');
// console.log(faceLandmarks?.faceRegions.mouthOutline, '🎯 MouthOutline');
// console.log(faceLandmarks?.faceRegions.nose, '🎯 Nose');
// console.log(faceLandmarks?.faceRegions.noseBridge, '🎯 NoseBridge');
// console.log(faceLandmarks?.faceRegions.noseTip, '🎯 NoseTip');
// console.log(faceLandmarks?.faceRegions.noseWings, '🎯 NoseWings');
// console.log(faceLandmarks?.faceRegions.rightEye, '🎯 RightEye');
// console.log(faceLandmarks?.faceRegions.rightEyebrow, '🎯 RightEyebrow');
// console.log(faceLandmarks?.faceRegions.upperLip, '🎯 UpperLip');
  console.log("-------------------");

return (
  <SafeAreaView className="flex-1">
    {/* Hidden WebView for MediaPipe */}
  <View style={{ 
    width: 0, 
    height: 0, 
    overflow: 'hidden',
    position: 'absolute',
  }}>
    <WebView
      ref={webViewRef}
      source={{ html: mediaPipeHTML }}
      onMessage={handleWebViewMessage}
      style={{ 
        width: 1, 
        height: 1,
        opacity: 0,
      }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      mixedContentMode="compatibility"
      allowsInlineMediaPlayback={true}
      mediaPlaybackRequiresUserAction={false}
    />
  </View>

    <ScrollView 
      className="flex-1"
      contentContainerStyle={{ padding: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hoşgeldin Mesajı */}
      <View className="mb-8">
        <Text className="text-2xl font-bold text-foreground mb-2">
          Merhaba {profile.full_name}! 👋
        </Text>
        <Text className="text-muted-foreground">
          {profile.is_premium ? 'Premium üyeliğinizle' : 'Ücretsiz hesabınızla'} 
          {' '}MediaPipe Face Mesh ile 468 noktalı analiz yapmaya hazır mısınız?
        </Text>
      </View>

      {/* MediaPipe Model Durumu */}
      <Card className="p-4 mb-6">
        <CardHeader className="p-0 mb-2">
          <Text className="text-primary font-semibold">
            🌐 MediaPipe Web Durumu
          </Text>
        </CardHeader>
        <CardContent className="p-0">
          <Text className="text-muted-foreground text-sm">
            {mediaPipeReady 
              ? '✅ MediaPipe Face Mesh hazır - Google teknolojisi ile 468 nokta!' 
              : '⏳ MediaPipe Web yükleniyor... (~5 MB) İnternet gerekli'
            }
          </Text>
        </CardContent>
      </Card>

      {/* Ana Analiz Kartı */}
      {!selectedImage ? (
        <Card className="p-6 mb-6">
          <CardContent className="items-center p-0">
            <View className="w-24 h-24 bg-muted rounded-full items-center justify-center mb-4">
              <Text className="text-4xl">🕸️</Text>
            </View>
            
            <Text className="text-xl font-bold text-foreground mb-3 text-center">
              MediaPipe Face Mesh
            </Text>
            
            <Text className="text-muted-foreground text-center mb-6 leading-6">
              Google'ın MediaPipe teknolojisi ile yüzünüzün 468 özel noktasını 
              web tabanlı AI ile tespit ediyoruz
            </Text>

            <Button 
              onPress={showPhotoGuidelines}
              disabled={!mediaPipeReady}
              className="w-full"
            >
              <Text className="text-primary-foreground font-semibold text-base">
                {mediaPipeReady ? '🕸️ MediaPipe Analizi Başlat' : '⏳ Web Yükleniyor...'}
              </Text>
            </Button>

            {!mediaPipeReady && (
              <Text className="text-muted-foreground text-xs mt-2 text-center">
                MediaPipe Web teknolojisi yükleniyor, lütfen bekleyin
              </Text>
            )}
          </CardContent>
        </Card>
      ) : (
        // Analiz Sonuçları
        <Card className="p-6 mb-6">
          <CardHeader className="p-0 mb-4">
            <Text className="text-lg font-bold text-foreground">
              🕸️ MediaPipe Face Mesh Analizi
            </Text>
          </CardHeader>
          
          {/* Seçilen Resim */}
          <View className="items-center mb-6">
            <Image 
              source={{ uri: selectedImage }}
              style={{ 
                width: screenWidth - 80, 
                height: screenWidth - 80,
                borderRadius: 12
              }}
              resizeMode="cover"
            />
          </View>

          {/* Loading veya Sonuç */}
          {isAnalyzing ? (
            <View className="items-center py-8">
              <View className="w-16 h-16 bg-muted rounded-full items-center justify-center mb-4">
                <Text className="text-2xl">🕸️</Text>
              </View>
              <Text className="text-primary font-semibold mb-2 text-center">
                MediaPipe Face Mesh Analizi
              </Text>
              <Text className="text-muted-foreground text-sm text-center">
                Google AI ile 468 yüz noktası tespit ediliyor...{'\n'}Web tabanlı analiz yapılıyor
              </Text>
            </View>
          ) : faceLandmarks ? (
            <View>
              {/* Ana Sonuç Kartı */}
              <Card className="bg-primary/10 p-4 rounded-lg mb-4 border-primary/20">
                <CardHeader className="p-0 mb-3">
                  <Text className="text-primary font-bold text-lg">
                    ✅ MediaPipe Analizi Tamamlandı!
                  </Text>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <Text className="text-primary text-sm">
                    🕸️ <Text className="font-semibold">{faceLandmarks.totalPoints}</Text> MediaPipe landmark tespit edildi
                  </Text>
                  <Text className="text-primary text-sm">
                    📏 Yüz boyutu: <Text className="font-semibold">{Math.round(faceLandmarks.faceBox.width)}x{Math.round(faceLandmarks.faceBox.height)}</Text> piksel
                  </Text>
                  <Text className="text-primary text-sm">
                    💯 Google AI güvenilirliği: <Text className="font-semibold">{(faceLandmarks.confidence * 100).toFixed(1)}%</Text>
                  </Text>
                </CardContent>
              </Card>

              {/* MediaPipe Yüz Bölgeleri */}

              <Card className="p-4 mb-4">
  <CardHeader className="p-0 mb-3">
    <Text className="text-foreground font-semibold">
      🎭 Tüm Yüz Bölgeleri
    </Text>
  </CardHeader>
  <CardContent className="p-0">
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row space-x-2">
        {faceLandmarks && Object.entries(faceLandmarks.regionDetails.pointCounts).map(([region, count]) => (
          <Badge key={region} variant="secondary" className="mb-2">
            <Text className="text-xs font-semibold">
              {region}: {count}
            </Text>
          </Badge>
        ))}
      </View>
    </ScrollView>
  </CardContent>
</Card>
              <Card className="p-4 mb-4">
                <CardHeader className="p-0 mb-4">
                  <Text className="text-foreground font-semibold">
                    🎭 MediaPipe Yüz Bölgeleri
                  </Text>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-foreground">👁️ Sol Göz Bölgesi</Text>
                    <Badge variant="secondary">
                      <Text className="text-xs font-semibold">
                        {faceLandmarks.faceRegions.leftEye.length} nokta
                      </Text>
                    </Badge>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-foreground">👁️ Sağ Göz Bölgesi</Text>
                    <Badge variant="secondary">
                      <Text className="text-xs font-semibold">
                        {faceLandmarks.faceRegions.rightEye.length} nokta
                      </Text>
                    </Badge>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-foreground">👃 Burun Bölgesi</Text>
                    <Badge variant="secondary">
                      <Text className="text-xs font-semibold">
                        {faceLandmarks.faceRegions.nose.length} nokta
                      </Text>
                    </Badge>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-foreground">👄 Dudak Bölgesi</Text>
                    <Badge variant="secondary">
                      <Text className="text-xs font-semibold">
                        {faceLandmarks.faceRegions.lips.length} nokta
                      </Text>
                    </Badge>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-foreground">⭕ Yüz Çevresi</Text>
                    <Badge variant="secondary">
                      <Text className="text-xs font-semibold">
                        {faceLandmarks.faceRegions.faceOval.length} nokta
                      </Text>
                    </Badge>
                  </View>
                </CardContent>
              </Card>

              {/* MediaPipe Koordinatları */}
              <Card className="p-4 mb-4">
                <CardHeader className="p-0 mb-3">
                  <Text className="text-foreground font-semibold">
                    📍 MediaPipe Koordinat Bilgileri
                  </Text>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground text-sm">Yüz Konumu</Text>
                    <Text className="text-foreground font-mono text-sm">
                      ({Math.round(faceLandmarks.faceBox.x)}, {Math.round(faceLandmarks.faceBox.y)})
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground text-sm">Yüz Alanı</Text>
                    <Text className="text-foreground font-mono text-sm">
                      {Math.round(faceLandmarks.faceBox.width * faceLandmarks.faceBox.height)} px²
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-muted-foreground text-sm">Toplam Nokta</Text>
                    <Text className="text-foreground font-mono text-sm">
                      {faceLandmarks.totalPoints} landmark
                    </Text>
                  </View>
                </CardContent>
              </Card>

              {/* MediaPipe Örnek Noktalar */}
              <Card className="p-4">
                <CardHeader className="p-0 mb-3">
                  <Text className="text-foreground font-semibold text-sm">
                    🔢 MediaPipe Landmark Verileri (İlk 5 nokta)
                  </Text>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  {faceLandmarks.landmarks.slice(0, 5).map((point, index) => (
                    <View key={index} className="flex-row justify-between">
                      <Text className="text-muted-foreground text-xs">#{index + 1}</Text>
                      <Text className="text-muted-foreground font-mono text-xs">
                        x: {point.x.toFixed(1)}, y: {point.y.toFixed(1)}, z: {point.z.toFixed(3)}
                      </Text>
                    </View>
                  ))}
                  <Text className="text-muted-foreground text-xs mt-2 italic text-center">
                    ... ve {faceLandmarks.totalPoints - 5} MediaPipe noktası daha
                  </Text>
                </CardContent>
              </Card>
            </View>
          ) : null}

          {/* Yeni Analiz Butonu */}
          <Button 
            onPress={startNewAnalysis}
            variant="outline"
            className="mt-6"
          >
            <Text className="text-primary font-semibold">
              🔄 Yeni MediaPipe Analizi
            </Text>
          </Button>
        </Card>
      )}

      {/* Premium Tanıtımı */}
      {!profile.is_premium && (
        <Card className="p-6">
          <CardContent className="items-center p-0">
            <Text className="text-foreground font-bold text-lg mb-3 text-center">
              ⭐ Premium ile Çok Daha Fazlası
            </Text>
            <Text className="text-muted-foreground mb-4 text-center leading-6">
              • Sınırsız MediaPipe analiz{'\n'}
              • Detaylı yüz şekli raporları{'\n'}
              • Kişiselleştirilmiş öneriler{'\n'}
              • Analiz geçmişi ve ilerleme takibi{'\n'}
              • Öncelikli analiz hızı
            </Text>
            <Button 
              onPress={() => {/* Navigate to premium */}}
              className="w-full"
            >
              <Text className="text-primary-foreground font-bold">
                🚀 Premium'a Geç
              </Text>
            </Button>
          </CardContent>
        </Card>
      )}
    </ScrollView>

    {/* Image Picker Modal */}
    <Modal
      visible={showImagePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowImagePicker(false)}
    >
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
        activeOpacity={1}
        onPress={() => setShowImagePicker(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1}>
            <View className="bg-background rounded-t-3xl p-6">
              <View className="w-12 h-1 bg-muted rounded-full self-center mb-6" />
              
              <Text className="text-xl font-bold text-foreground mb-2 text-center">
                MediaPipe ile Analiz
              </Text>
              <Text className="text-muted-foreground text-sm text-center mb-6">
                468 noktalı Google AI analizi için fotoğraf seçin
              </Text>
              
              <View className="space-y-4">
                <Button 
                  onPress={takePhoto}
                  className="w-full"
                >
                  <Text className="text-primary-foreground font-semibold text-base">
                    📷 Kameradan Çek
                  </Text>
                </Button>
                
                <Button 
                  onPress={pickImage}
                  variant="outline"
                  className="w-full"
                >
                  <Text className="text-primary font-semibold text-base">
                    🖼️ Galeriden Seç
                  </Text>
                </Button>
                
                <Button 
                  onPress={() => setShowImagePicker(false)}
                  variant="ghost"
                  className="w-full"
                >
                  <Text className="text-muted-foreground font-semibold">
                    İptal
                  </Text>
                </Button>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  </SafeAreaView>
);
}