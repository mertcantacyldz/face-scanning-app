/**
 * MediaPipe Face Mesh HTML Template
 * WebView içinde çalışacak MediaPipe Face Mesh analiz script'i
 */

export const mediaPipeHTML = `
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

        /* Icons */
        .icon { width: 20px; height: 20px; vertical-align: middle; }
        
        /* Spinner */
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
        
        #status { display: flex; align-items: center; justify-content: center; gap: 8px; }
    </style>
</head>
<body>
    <div id="status" class="loading">
        <svg class="icon spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V6" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 18V22" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.93 4.93L7.76 7.76" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.24 16.24L19.07 19.07" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12H6" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 12H22" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.93 19.07L7.76 16.24" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.24 7.76L19.07 4.93" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>MediaPipe Face Mesh yükleniyor...</span>
    </div>
    <canvas id="output_canvas" width="1024" height="1024"></canvas>

    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"></script>

    <script>
        const statusDiv = document.getElementById('status');
        const canvasElement = document.getElementById('output_canvas');
        const canvasCtx = canvasElement.getContext('2d');

        // Icons
        const icons = {
            loading: \`<svg class="icon spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V6" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 18V22" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.93 4.93L7.76 7.76" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.24 16.24L19.07 19.07" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12H6" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 12H22" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.93 19.07L7.76 16.24" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.24 7.76L19.07 4.93" stroke="#2196F3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>\`,
            success: \`<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>\`,
            error: \`<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18" stroke="#f44336" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6L18 18" stroke="#f44336" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>\`
        };

        let faceMesh;
        let isReady = false;
        let currentImage = null;

        // TÜM YÜZ BÖLGELERİ - MediaPipe 468 nokta indeksleri
        const faceRegions = {
            // Yüz ovali (dış kontur)
            faceOval: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
            
            // Alın bölgesi
            forehead: [10, 338, 297, 332, 284, 251, 301, 298, 333, 299, 337, 151, 108, 69, 104, 68, 71, 21, 54, 103, 67, 109, 9, 8, 168, 193, 122, 196, 3, 51, 197],
            
            // Kaşlar - doğru sıralı, tekrarsız
            leftEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
            rightEyebrow: [336, 296, 334, 293, 300, 276, 283, 282, 295, 285],
            
            // Gözler - tam kontur, doğru sıralı, tekrarsız
            leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
            rightEye: [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382],
            
            // Burun - köprü, uç ve kanatlar ayrı alt-bölgeler
            // Burun köprüsü (üstten alta)
            noseBridge: [6, 168, 8, 9, 10],
            // Burun ucu
            noseTip: [1, 2, 4, 5],
            // Sol burun kanadı (üstten alta, soldan sağa)
            noseLeftWing: [129, 98, 97, 2, 19, 20, 94, 125, 141, 235, 236, 3, 51, 48, 115, 131, 134, 102, 49],
            // Sağ burun kanadı (üstten alta, sağdan sola)
            noseRightWing: [358, 327, 326, 2, 220, 305, 290, 328],
            // Tüm burun (köprü + uç + kanatlar birleşik)
            nose: [6, 168, 8, 9, 10, 1, 2, 4, 5, 129, 98, 97, 19, 20, 94, 125, 141, 235, 236, 3, 51, 48, 115, 131, 134, 102, 49, 358, 327, 326, 220, 305, 290, 328],
            
            // Ağız ve dudaklar - doğru sıralı, tekrarsız
            // Üst dudak (soldan sağa)
            upperLip: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
            // Alt dudak (soldan sağa)
            lowerLip: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95],
            // Ağız konturu (üst dudak + alt dudak birleşik)
            lips: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 291],
            // Ağız dış konturu
            mouthOutline: [61, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
            
            // Çene hattı - doğru sıralı, tekrarsız (soldan sağa)
            jawline: [58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454, 356, 389, 251, 284, 332, 297, 338, 10]
        };

        // MediaPipe Face Mesh başlatma
        async function initMediaPipe() {
            try {
                statusDiv.innerHTML = icons.loading + '<span>MediaPipe Face Mesh başlatılıyor...</span>';
                
                faceMesh = new FaceMesh({
                    locateFile: function(file) {
                        return 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/' + file;
                    }
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,  // İris detayı için aktif (468-477 landmarks)
                    minDetectionConfidence: 0.7,  // Daha yüksek kalite kontrolü
                    minTrackingConfidence: 0.5,
                    selfieMode: false,
                    staticImageMode: true,
                    modelComplexity: 1  // 0=lite, 1=full, 2=heavy (1 optimal)

                });

                faceMesh.onResults(onResults);
                
                isReady = true;
                statusDiv.innerHTML = icons.success + '<span>MediaPipe Face Mesh hazır - Tüm yüz bölgeleri analizi!</span>';
                statusDiv.className = 'ready';
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'READY',
                    ready: true
                }));
                
            } catch (error) {
                console.error('MediaPipe init error:', error);
                statusDiv.innerHTML = icons.error + '<span>MediaPipe yükleme hatası: ' + error.message + '</span>';
                statusDiv.className = 'error';
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ERROR',
                    error: error.message
                }));
            }
        }

        // Face Mesh sonuçlarını işle
        function onResults(results) {
            // Eski image'i GÜVENLİ bir zamanda temizle (canvas işleminden ÖNCE DEĞİL!)
            // Canvas toDataURL() 100ms sonra çağrılacak, o yüzden 2 saniye bekleyelim
            if (currentImage) {
                const oldImage = currentImage;
                setTimeout(function() {
                    if (oldImage) {
                        oldImage.onload = null;
                        oldImage.onerror = null;
                        oldImage.src = '';
                    }
                }, 2000);  // Canvas işlemleri için BOL süre
                currentImage = null;
            }

            // Canvas aggressive clear
            canvasCtx.save();
            canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            canvasCtx.restore();

            if (results.image) {
                canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
            }

            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];

                // DEBUG-MIRROR: Raw MediaPipe landmarks (0-1 normalized)
                console.log('[WEBVIEW] 🎯 [DEBUG-MIRROR] RAW MEDIAPIPE LANDMARKS:', {
                  P4_noseTip: { x: landmarks[4]?.x.toFixed(4), y: landmarks[4]?.y.toFixed(4) },
                  P33_rightEyeOuter: { x: landmarks[33]?.x.toFixed(4), y: landmarks[33]?.y.toFixed(4) },
                  P263_leftEyeOuter: { x: landmarks[263]?.x.toFixed(4), y: landmarks[263]?.y.toFixed(4) },
                  mirrorCheck: landmarks[263]?.x > landmarks[33]?.x ? 'NORMAL' : 'MIRRORED',
                  timestamp: Date.now()
                });

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

                const boxArea = (maxX - minX) * (maxY - minY);

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

                // ============================================
                // YENİ CONFIDENCE PUANLAMA SİSTEMİ (100 Puan)
                // ============================================
                // Skor Aralıkları:
                // 85-100: ✅ Yeşil - İyi veri
                // 65-84:  ⚠️ Sarı  - Orta, yeniden çekilmesi tavsiye
                // 0-64:   ❌ Kırmızı - Kötü, kesinlikle yeniden çekilmeli

                // Referans noktaları
                const leftEyeOuter = landmarks[33];
                const rightEyeOuter = landmarks[263];
                const leftEyeInner = landmarks[133];
                const rightEyeInner = landmarks[362];
                const noseTip = landmarks[1];
                const nosePoint = landmarks[4];
                const noseRoot = landmarks[168];
                const forehead = landmarks[10];
                const chin = landmarks[152];
                const leftEar = landmarks[234];
                const rightEar = landmarks[454];

                // ---- 1. YAW (Sağa/Sola Dönüş) - 25 Puan ----
                const eyeCenterX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
                const yawDeviation = noseTip.x - eyeCenterX;
                const yawAmount = Math.abs(yawDeviation);
                const yawDegrees = Math.atan(yawAmount / 0.15) * (180 / Math.PI);

                let yawScore = 25;
                if (yawDegrees > 12) {
                    yawScore = 0;
                } else if (yawDegrees > 8) {
                    yawScore = 25 * (1 - (yawDegrees - 8) / 4);
                }

                // ---- 2. GÖZ SİMETRİSİ - 20 Puan ----
                const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
                const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
                const eyeWidthRatio = Math.min(leftEyeWidth, rightEyeWidth) /
                                      Math.max(leftEyeWidth, rightEyeWidth);
                const eyeDiffPercent = (1 - eyeWidthRatio) * 100;

                let eyeSymmetryScore = 20;
                if (eyeDiffPercent > 15) {
                    eyeSymmetryScore = 0;
                } else if (eyeDiffPercent > 10) {
                    eyeSymmetryScore = 20 * (1 - (eyeDiffPercent - 10) / 5);
                }

                // ---- 3. PITCH (Yukarı/Aşağı Eğim) - 15 Puan ----
                const faceHeight = chin.y - forehead.y;
                const noseRelativeY = (noseTip.y - forehead.y) / faceHeight;
                const pitchDeviation = Math.abs(noseRelativeY - 0.50);
                const pitchDegrees = pitchDeviation * 150;

                let pitchScore = 15;
                if (pitchDegrees > 15) {
                    pitchScore = 0;
                } else if (pitchDegrees > 10) {
                    pitchScore = 15 * (1 - (pitchDegrees - 10) / 5);
                }

                // ---- 4. YÜZ BOYUTU - 15 Puan ----
                let sizeScore = 15;
                if (boxArea < 0.15) {
                    sizeScore = 0;
                } else if (boxArea < 0.20) {
                    sizeScore = 15 * ((boxArea - 0.15) / 0.05);
                } else if (boxArea > 0.85) {
                    sizeScore = 15 * 0.7;
                }

                // ---- 5a. DEPTH GLOBAL (Kulak-Burun) - 6 Puan ----
                const avgEarZ = (leftEar.z + rightEar.z) / 2;
                const globalDepthRange = Math.abs(noseTip.z - avgEarZ);

                let depthGlobalScore = 6;
                if (globalDepthRange < 0.05) {
                    depthGlobalScore = 0;
                } else if (globalDepthRange < 0.08) {
                    depthGlobalScore = 6 * ((globalDepthRange - 0.05) / 0.03);
                }

                // ---- 5b. DEPTH LOCAL (Burun Ucu-Kök) - 4 Puan ----
                const localDepthRange = noseRoot.z - nosePoint.z;

                let depthLocalScore = 4;
                if (localDepthRange < 0) {
                    depthLocalScore = 0; // Z verisi ters, hatalı
                } else if (localDepthRange < 0.01) {
                    depthLocalScore = 0;
                } else if (localDepthRange < 0.02) {
                    depthLocalScore = 4 * ((localDepthRange - 0.01) / 0.01);
                }

                // ---- 6. ROLL (Yana Yatma) - 10 Puan ----
                const eyeYDiff = leftEyeOuter.y - rightEyeOuter.y;
                const eyeXDiff = Math.abs(leftEyeOuter.x - rightEyeOuter.x);
                const rollAngle = Math.atan2(Math.abs(eyeYDiff), eyeXDiff) * (180 / Math.PI);

                let rollScore = 10;
                if (rollAngle > 10) {
                    rollScore = 0;
                } else if (rollAngle > 5) {
                    rollScore = 10 * (1 - (rollAngle - 5) / 5);
                }

                // ---- 7. COVERAGE (Kapsama) - 5 Puan ----
                const criticalPoints = [159, 145, 133, 386, 374, 263, 1, 2, 61, 291, 152, 10];
                const validPoints = criticalPoints.filter(function(idx) {
                    const p = landmarks[idx];
                    return p && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
                }).length;

                let coverageScore = 5;
                if (validPoints < 12) {
                    coverageScore = 0; // Tolerans yok, 12/12 zorunlu
                }

                // ---- FINAL SKOR (0-100) ----
                const totalScore = yawScore + eyeSymmetryScore + pitchScore + sizeScore +
                                   depthGlobalScore + depthLocalScore + rollScore + coverageScore;

                // 0-1 aralığına normalize et (eski sistemle uyumluluk için)
                const detectionConfidence = totalScore / 100;

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
                        confidence: detectionConfidence,
                        confidenceDetails: {
                            totalScore: totalScore,
                            yaw: { score: yawScore, max: 25, degrees: yawDegrees },
                            eyeSymmetry: { score: eyeSymmetryScore, max: 20, diffPercent: eyeDiffPercent },
                            pitch: { score: pitchScore, max: 15, degrees: pitchDegrees },
                            size: { score: sizeScore, max: 15, areaPercent: boxArea * 100 },
                            depthGlobal: { score: depthGlobalScore, max: 6, range: globalDepthRange },
                            depthLocal: { score: depthLocalScore, max: 4, range: localDepthRange },
                            roll: { score: rollScore, max: 10, degrees: rollAngle },
                            coverage: { score: coverageScore, max: 5, validPoints: validPoints }
                        },
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

                console.log('[WEBVIEW] 📤 LANDMARKS gönderiliyor', {
                    totalScore: totalScore.toFixed(1) + '/100',
                    scores: {
                        yaw: yawScore.toFixed(1) + '/25 (' + yawDegrees.toFixed(1) + '°)',
                        eyeSym: eyeSymmetryScore.toFixed(1) + '/20 (' + eyeDiffPercent.toFixed(1) + '%)',
                        pitch: pitchScore.toFixed(1) + '/15 (' + pitchDegrees.toFixed(1) + '°)',
                        size: sizeScore.toFixed(1) + '/15 (' + (boxArea * 100).toFixed(1) + '%)',
                        depthG: depthGlobalScore.toFixed(1) + '/6',
                        depthL: depthLocalScore.toFixed(1) + '/4',
                        roll: rollScore.toFixed(1) + '/10 (' + rollAngle.toFixed(1) + '°)',
                        coverage: coverageScore.toFixed(1) + '/5 (' + validPoints + '/12)'
                    },
                    faceBox: result.data.faceBox.width.toFixed(0) + 'x' + result.data.faceBox.height.toFixed(0),
                    canvasSize: canvasElement.width + 'x' + canvasElement.height
                });

                // DEBUG-MIRROR: Pixel dönüşümü sonrası kontrol
                console.log('[WEBVIEW] 📤 [DEBUG-MIRROR] PIXEL DÖNÜŞÜMÜ SONRASI:', {
                  P4_noseTip_px: result.data.landmarks[4]?.x.toFixed(2),
                  P33_rightEyeOuter_px: result.data.landmarks[33]?.x.toFixed(2),
                  P263_leftEyeOuter_px: result.data.landmarks[263]?.x.toFixed(2),
                  canvasWidth: canvasElement.width,
                  mirrorCheck: result.data.landmarks[263]?.x > result.data.landmarks[33]?.x ? 'NORMAL' : 'MIRRORED',
                  timestamp: Date.now()
                });

                window.ReactNativeWebView.postMessage(JSON.stringify(result));

                // Canvas'ı base64 PNG olarak gönder (mesh görselleştirme için)
                setTimeout(() => {
                    const canvasDataUrl = canvasElement.toDataURL('image/png');

                    console.log('[WEBVIEW] 🖼️ MESH_IMAGE gönderiliyor', {
                        meshImageLength: canvasDataUrl.length,
                        canvasSize: canvasElement.width + 'x' + canvasElement.height,
                        timestamp: Date.now()
                    });

                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'MESH_IMAGE',
                        data: { meshImage: canvasDataUrl }
                    }));
                }, 100); // Mesh çiziminin bitmesini bekle

            } else {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'NO_FACE',
                    message: 'Fotoğrafta yüz tespit edilemedi'
                }));
            }
        }

        // ============================================
        // MODERN MESH GÖRSELLEŞTIRME - V2.0
        // ============================================
        // Versiyon seçimi: true = triangular mesh, false = sadece noktalar
        const USE_TRIANGULAR_MESH = false;

        // Modern renk paleti (app design system ile uyumlu) - DAHA CANLI RENKLER
        const MESH_COLORS = {
            primary: '#6366F1',           // Indigo
            primaryLight: '#A5B4FC',      // Daha parlak light indigo
            accent: '#2DD4BF',            // Daha parlak Teal
            contour: 'rgba(99, 102, 241, 0.95)',      // Yüz ovali - daha belirgin
            features: 'rgba(165, 180, 252, 1)',       // Kaş/göz/dudak - tam opak
            dots: 'rgba(255, 255, 255, 1)',           // Noktalar - tam beyaz
            dotsGlow: 'rgba(99, 102, 241, 0.4)',      // Nokta glow - indigo tonlu
            meshLines: 'rgba(99, 102, 241, 0.35)'
        };

        // Glow efekti helper fonksiyonları
        function setGlowEffect(ctx, color, blur) {
            ctx.shadowColor = color;
            ctx.shadowBlur = blur || 8;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        function clearGlowEffect(ctx) {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }

        // MediaPipe Face Mesh Tesselation - TAM LİSTE (468 nokta için ~900 üçgen)
        // Kaynak: https://github.com/google/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model_uv_visualization.png
        const FACE_MESH_TESSELATION = [
            // Alın üst
            [127, 34, 139], [11, 0, 37], [232, 231, 120], [72, 37, 39], [128, 121, 47],
            [232, 121, 128], [104, 69, 67], [175, 171, 148], [118, 50, 101], [73, 39, 40],
            [9, 108, 151], [48, 115, 131], [194, 211, 204], [74, 40, 185], [80, 42, 183],
            [40, 92, 186], [230, 229, 118], [202, 212, 214], [83, 18, 17], [76, 61, 146],
            [160, 29, 30], [56, 157, 173], [106, 204, 194], [135, 214, 192], [203, 165, 98],
            [21, 71, 68], [51, 45, 4], [144, 24, 23], [77, 146, 91], [205, 50, 187],
            [201, 200, 18], [91, 106, 182], [90, 91, 181], [85, 84, 17], [206, 203, 36],
            [148, 171, 140], [92, 40, 39], [193, 189, 244], [159, 158, 28], [247, 246, 161],
            [236, 3, 196], [54, 68, 104], [193, 168, 8], [117, 228, 31], [189, 193, 55],
            [98, 97, 99], [126, 47, 100], [166, 79, 218], [155, 154, 26], [209, 49, 131],
            [135, 136, 150], [47, 126, 217], [223, 52, 53], [45, 51, 134], [211, 170, 140],
            [67, 69, 108], [43, 106, 91], [230, 119, 120], [226, 130, 247], [63, 53, 52],
            [238, 20, 242], [46, 70, 63], [7, 163, 144], [285, 336, 296], [340, 346, 347],

            // Göz çevresi sol
            [120, 119, 47], [119, 118, 101], [25, 143, 111], [154, 153, 26], [128, 127, 162],
            [233, 232, 128], [113, 225, 224], [56, 28, 27], [156, 155, 26], [113, 130, 25],
            [251, 284, 332], [10, 338, 297], [10, 297, 332], [10, 332, 284], [10, 284, 251],
            [10, 109, 67], [10, 67, 103], [10, 103, 54], [10, 54, 21], [21, 162, 127],

            // Göz çevresi sağ
            [338, 297, 299], [297, 332, 333], [332, 284, 298], [284, 251, 301], [299, 333, 298],
            [333, 298, 301], [109, 67, 69], [67, 103, 104], [103, 54, 68], [54, 21, 71],
            [336, 296, 334], [296, 334, 293], [334, 293, 300], [293, 300, 276], [300, 276, 283],
            [70, 63, 105], [63, 105, 66], [105, 66, 107], [66, 107, 55], [107, 55, 65],

            // Sol göz
            [33, 7, 163], [7, 163, 144], [163, 144, 145], [144, 145, 153], [145, 153, 154],
            [153, 154, 155], [154, 155, 133], [155, 133, 173], [133, 173, 157], [173, 157, 158],
            [157, 158, 159], [158, 159, 160], [159, 160, 161], [160, 161, 246], [161, 246, 33],
            [246, 33, 7], [130, 113, 226], [25, 130, 226], [226, 247, 161], [161, 160, 30],

            // Sağ göz
            [362, 398, 384], [398, 384, 385], [384, 385, 386], [385, 386, 387], [386, 387, 388],
            [387, 388, 466], [388, 466, 263], [466, 263, 249], [263, 249, 390], [249, 390, 373],
            [390, 373, 374], [373, 374, 380], [374, 380, 381], [380, 381, 382], [381, 382, 362],
            [382, 362, 398], [359, 342, 446], [254, 359, 446], [446, 467, 381], [381, 380, 260],

            // Burun
            [168, 6, 197], [6, 197, 195], [197, 195, 5], [195, 5, 4], [4, 5, 51],
            [4, 1, 19], [1, 19, 94], [19, 94, 2], [2, 94, 370], [370, 94, 141],
            [4, 1, 274], [274, 1, 440], [440, 1, 275], [275, 440, 344], [344, 275, 278],
            [168, 417, 351], [351, 6, 168], [122, 196, 3], [3, 236, 198], [198, 236, 131],
            [131, 198, 126], [217, 126, 198], [236, 3, 51], [51, 3, 195], [195, 3, 196],
            [129, 203, 98], [98, 64, 129], [129, 64, 102], [102, 64, 240], [240, 64, 48],
            [358, 423, 327], [327, 294, 358], [358, 294, 331], [331, 294, 460], [460, 294, 278],

            // Yanak sol
            [127, 162, 21], [162, 21, 54], [21, 54, 103], [54, 103, 67], [67, 103, 109],
            [127, 234, 93], [234, 93, 132], [93, 132, 58], [132, 58, 172], [172, 58, 136],
            [136, 58, 150], [150, 58, 149], [149, 132, 176], [176, 132, 148], [148, 93, 152],
            [234, 127, 139], [139, 127, 34], [34, 139, 227], [227, 139, 143], [143, 139, 111],

            // Yanak sağ
            [356, 389, 251], [389, 251, 284], [251, 284, 332], [284, 332, 297], [297, 332, 338],
            [356, 454, 323], [454, 323, 361], [323, 361, 288], [361, 288, 397], [397, 288, 365],
            [365, 288, 379], [379, 288, 378], [378, 361, 400], [400, 361, 377], [377, 323, 152],
            [454, 356, 368], [368, 356, 264], [264, 368, 447], [447, 368, 372], [372, 368, 340],

            // Ağız üst
            [61, 185, 40], [185, 40, 39], [40, 39, 37], [39, 37, 0], [0, 37, 267],
            [267, 37, 269], [269, 37, 270], [270, 269, 409], [409, 270, 291], [291, 270, 287],
            [61, 146, 91], [146, 91, 181], [181, 91, 84], [84, 181, 17], [17, 84, 314],
            [314, 17, 405], [405, 314, 321], [321, 405, 375], [375, 321, 291], [291, 321, 409],
            [76, 77, 146], [77, 146, 61], [61, 146, 185], [185, 146, 40], [40, 146, 74],
            [306, 307, 375], [307, 375, 291], [291, 375, 409], [409, 375, 270], [270, 375, 269],

            // Ağız alt
            [78, 95, 88], [88, 95, 178], [178, 95, 87], [87, 178, 14], [14, 87, 317],
            [317, 14, 402], [402, 317, 318], [318, 402, 324], [324, 318, 308], [308, 324, 415],
            [191, 78, 80], [80, 78, 81], [81, 78, 82], [82, 81, 13], [13, 82, 312],
            [312, 13, 311], [311, 312, 310], [310, 311, 415], [415, 310, 308], [308, 310, 324],

            // Çene sol
            [58, 172, 136], [172, 136, 150], [136, 150, 149], [150, 149, 176], [149, 176, 148],
            [176, 148, 152], [152, 148, 377], [377, 148, 400], [400, 148, 378], [378, 148, 379],
            [136, 172, 213], [213, 172, 147], [147, 213, 192], [192, 147, 187], [187, 192, 205],
            [205, 187, 36], [36, 205, 142], [142, 205, 126], [126, 142, 217], [217, 142, 174],

            // Çene sağ
            [288, 397, 365], [397, 365, 379], [365, 379, 378], [379, 378, 400], [378, 400, 377],
            [400, 377, 152], [152, 377, 148], [148, 377, 176], [176, 377, 149], [149, 377, 150],
            [365, 397, 433], [433, 397, 376], [376, 433, 416], [416, 376, 411], [411, 416, 425],
            [425, 411, 266], [266, 425, 371], [371, 425, 355], [355, 371, 437], [437, 355, 399],

            // Alt çene orta
            [152, 377, 400], [377, 400, 378], [378, 379, 365], [379, 365, 397], [17, 314, 405],
            [314, 405, 321], [321, 375, 291], [375, 291, 409], [84, 17, 181], [17, 181, 91],
            [181, 91, 146], [146, 91, 77], [152, 148, 176], [176, 148, 149], [149, 150, 136],
            [136, 150, 172], [172, 58, 132], [132, 93, 234], [234, 127, 162], [162, 21, 54]
        ];

        // Triangular mesh çizimi
        function drawMeshTriangles(ctx, landmarks) {
            ctx.strokeStyle = MESH_COLORS.meshLines;
            ctx.lineWidth = 0.8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            FACE_MESH_TESSELATION.forEach(function(triangle) {
                var i1 = triangle[0];
                var i2 = triangle[1];
                var i3 = triangle[2];

                if (i1 >= landmarks.length || i2 >= landmarks.length || i3 >= landmarks.length) return;

                var p1 = landmarks[i1];
                var p2 = landmarks[i2];
                var p3 = landmarks[i3];

                ctx.beginPath();
                ctx.moveTo(p1.x * canvasElement.width, p1.y * canvasElement.height);
                ctx.lineTo(p2.x * canvasElement.width, p2.y * canvasElement.height);
                ctx.lineTo(p3.x * canvasElement.width, p3.y * canvasElement.height);
                ctx.closePath();
                ctx.stroke();
            });
        }

        // Burun köprüsü - modern stil
        function drawNoseBridge(ctx, landmarks) {
            var bridge = [168, 6, 197, 195, 5, 4];

            setGlowEffect(ctx, MESH_COLORS.primary, 8);
            ctx.strokeStyle = MESH_COLORS.contour;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();

            var firstPoint = landmarks[bridge[0]];
            ctx.moveTo(firstPoint.x * canvasElement.width, firstPoint.y * canvasElement.height);

            for (var i = 1; i < bridge.length; i++) {
                var point = landmarks[bridge[i]];
                ctx.lineTo(point.x * canvasElement.width, point.y * canvasElement.height);
            }

            ctx.stroke();
            clearGlowEffect(ctx);
        }

        // Kontur çizimi - modern stil
        function drawSimpleContour(ctx, landmarks, indices, color, lineWidth, closePath) {
            if (!indices || indices.length < 2) return;
            if (closePath === undefined) closePath = true;

            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();

            var firstPoint = landmarks[indices[0]];
            ctx.moveTo(firstPoint.x * canvasElement.width, firstPoint.y * canvasElement.height);

            for (var i = 1; i < indices.length; i++) {
                var point = landmarks[indices[i]];
                ctx.lineTo(point.x * canvasElement.width, point.y * canvasElement.height);
            }

            if (closePath) {
                ctx.lineTo(firstPoint.x * canvasElement.width, firstPoint.y * canvasElement.height);
            }

            ctx.stroke();
        }

        // Nokta çizimi - modern stil
        function drawSimplePoint(ctx, point, color, radius) {
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

        // Ana mesh çizim fonksiyonu - MODERN VERSİYON
        function drawFaceConnections(ctx, landmarks) {
            if (!landmarks || landmarks.length < 468) return;

            // === TRIANGULAR MESH (Versiyon B - opsiyonel) ===
            if (USE_TRIANGULAR_MESH) {
                drawMeshTriangles(ctx, landmarks);
            }

            // === 1. YÜZ OVALİ (glow ile) ===
            setGlowEffect(ctx, MESH_COLORS.primary, 12);
            drawSimpleContour(ctx, landmarks, faceRegions.faceOval, MESH_COLORS.contour, 2.5, true);
            clearGlowEffect(ctx);

            // === 2. KAŞLAR (aynı renk, glow ile) ===
            setGlowEffect(ctx, MESH_COLORS.primaryLight, 8);
            drawSimpleContour(ctx, landmarks, faceRegions.leftEyebrow, MESH_COLORS.features, 2.5, false);
            drawSimpleContour(ctx, landmarks, faceRegions.rightEyebrow, MESH_COLORS.features, 2.5, false);
            clearGlowEffect(ctx);

            // === 3. GÖZLER (glow ile) ===
            setGlowEffect(ctx, MESH_COLORS.accent, 8);
            drawSimpleContour(ctx, landmarks, faceRegions.leftEye, MESH_COLORS.features, 2.5, true);
            drawSimpleContour(ctx, landmarks, faceRegions.rightEye, MESH_COLORS.features, 2.5, true);
            clearGlowEffect(ctx);

            // === 4. DUDAKLAR (glow ile) ===
            setGlowEffect(ctx, MESH_COLORS.primaryLight, 8);
            drawSimpleContour(ctx, landmarks, faceRegions.lips, MESH_COLORS.features, 2.5, true);
            clearGlowEffect(ctx);

            // === 5. BURUN KÖPRÜSü ===
            drawNoseBridge(ctx, landmarks);

            // === 6. TÜM 468 NOKTA (daha büyük, belirgin, glow ile) ===
            landmarks.forEach(function(point) {
                var x = point.x * canvasElement.width;
                var y = point.y * canvasElement.height;

                // Glow efekti (dış halka)
                ctx.fillStyle = MESH_COLORS.dotsGlow;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fill();

                // Core nokta (iç daire) - daha büyük
                ctx.fillStyle = MESH_COLORS.dots;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, 2 * Math.PI);
                ctx.fill();
            });

            // === 7. P_168 VURGUSU (DEBUG - Orta nokta kontrolü) ===
            // P_168 (mid-bridge) - Kırmızı ve büyük göster
            var p168 = landmarks[168];
            if (p168) {
                var x168 = p168.x * canvasElement.width;
                var y168 = p168.y * canvasElement.height;

                // Dış glow - kırmızı
                ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.arc(x168, y168, 12, 0, 2 * Math.PI);
                ctx.fill();

                // İç daire - parlak kırmızı
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(x168, y168, 6, 0, 2 * Math.PI);
                ctx.fill();

                // Beyaz border
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x168, y168, 6, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }

        // MediaPipe instance'ını tamamen reset et
        window.forceReset = function() {
            if (faceMesh) {
                faceMesh.close().catch(function() {});
            }

            if (currentImage) {
                currentImage.onload = null;
                currentImage.src = '';
                currentImage = null;
            }

            faceMesh = new FaceMesh({
                locateFile: function(file) {
                    return 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/' + file;
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
        };

        // Base64 image'ı işle
        window.processImage = function(base64Image) {
            if (!isReady) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ERROR',
                    error: 'MediaPipe henüz hazır değil'
                }));
                return;
            }

            // Eski image'i temizle
            if (currentImage) {
                currentImage.onload = null;
                currentImage.src = '';
                currentImage = null;
            }

            try {
                statusDiv.innerHTML = icons.loading + '<span>Tüm yüz bölgeleri analiz ediliyor...</span>';
                statusDiv.className = 'loading';

                const img = new Image();
                currentImage = img;

                img.onload = async function() {
                    try {
                        await faceMesh.send({image: img});
                        // CLEANUP KALDIRILDI - bir sonraki processImage çağrısında temizlenecek
                    } catch (error) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'ERROR',
                            error: 'Analiz sırasında hata: ' + error.message
                        }));
                    }
                };

                img.onerror = function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'ERROR',
                        error: 'Resim yüklenemedi'
                    }));
                };

                // Cache bypass için unique URI
                img.src = 'data:image/jpeg;base64,' + base64Image + '#' + Date.now();

            } catch (error) {
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

