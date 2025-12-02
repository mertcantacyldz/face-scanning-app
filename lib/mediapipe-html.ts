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

                // Canvas'ı base64 PNG olarak gönder (mesh görselleştirme için)
                setTimeout(() => {
                    const canvasDataUrl = canvasElement.toDataURL('image/png');
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

        // Burun köprüsünü basit dikey çizgi olarak çiz
        function drawNoseBridge(ctx, landmarks) {
            // Burun köprüsü - kaşlar arasından burun ucuna (168'den başla, 6 alında kalıyor)
            const bridge = [168, 6, 197, 195, 5, 4];  // Kaşlar arası -> burun ucu

            ctx.strokeStyle = '#9B59B6';  // Mor
            ctx.lineWidth = 2;  // Kalınlık artırıldı
            ctx.beginPath();

            const firstPoint = landmarks[bridge[0]];
            ctx.moveTo(
                firstPoint.x * canvasElement.width,
                firstPoint.y * canvasElement.height
            );

            // Köprü noktalarını sırayla birleştir (kapalı kontur YOK)
            for (let i = 1; i < bridge.length; i++) {
                const point = landmarks[bridge[i]];
                ctx.lineTo(
                    point.x * canvasElement.width,
                    point.y * canvasElement.height
                );
            }

            ctx.stroke();
        }

        // Basit kontur çizimi - kapalı kontur OLMAYAN versiyon
        function drawSimpleContour(ctx, landmarks, indices, color, lineWidth, closePath = true) {
            if (!indices || indices.length < 2) return;

            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();

            // İlk noktaya git
            const firstPoint = landmarks[indices[0]];
            ctx.moveTo(firstPoint.x * canvasElement.width, firstPoint.y * canvasElement.height);

            // Diğer noktalara çiz
            for (let i = 1; i < indices.length; i++) {
                const point = landmarks[indices[i]];
                ctx.lineTo(point.x * canvasElement.width, point.y * canvasElement.height);
            }

            // İsteğe bağlı: kapalı kontur
            if (closePath) {
                ctx.lineTo(firstPoint.x * canvasElement.width, firstPoint.y * canvasElement.height);
            }

            ctx.stroke();
        }

        // Basit nokta çizimi
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

        // YENİ: Temiz yüz bağlantıları - burun minimal, diğerleri düzgün
        function drawFaceConnections(ctx, landmarks) {
            if (!landmarks || landmarks.length < 468) return;

            // 1. Yüz ovali (gri, kapalı kontur)
            drawSimpleContour(ctx, landmarks, faceRegions.faceOval, '#E0E0E0', 2.5, true);

            // 2. Kaşlar (turuncu, kapalı kontur, KALINLAŞTIRILDI)
            drawSimpleContour(ctx, landmarks, faceRegions.leftEyebrow, '#FFA500', 2.5, true);
            drawSimpleContour(ctx, landmarks, faceRegions.rightEyebrow, '#FFA500', 2.5, true);

            // 3. Gözler (yeşil/kırmızı, kapalı kontur, KALINLAŞTIRILDI)
            drawSimpleContour(ctx, landmarks, faceRegions.leftEye, '#30FF30', 2.5, true);
            drawSimpleContour(ctx, landmarks, faceRegions.rightEye, '#FF3030', 2.5, true);

            // 4. Ağız/Dudaklar (gri, kapalı kontur)
            drawSimpleContour(ctx, landmarks, faceRegions.lips, '#E0E0E0', 2.5, true);

            // 5. BURUN - Sadece köprü (dikey çizgi, KAPALI OLMAYAN)
            drawNoseBridge(ctx, landmarks);

            // 6. Tüm 468 noktayı çiz (PROFESYONEL RENK: açık gri/beyaz)
            landmarks.forEach((point) => {
                drawSimplePoint(ctx, point, '#FFFFFF', 1);  // Beyaz, biraz daha büyük
            });
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

