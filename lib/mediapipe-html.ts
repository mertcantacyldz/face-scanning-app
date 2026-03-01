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
    <title>MediaPipe Face Mesh - Pixel Scaling</title>
    <style>
        body { margin: 0; padding: 20px; background: #f0f0f0; }
        #output_canvas { 
            width: 100%; 
            max-width: 500px; 
            height: auto; 
            border: 2px solid #6366F1;
            border-radius: 10px;
            display: block;
            margin: 20px auto;
            background: #000;
        }
        #status { 
            text-align: center; 
            padding: 10px; 
            font-family: Arial, sans-serif;
            background: white;
            border-radius: 8px;
            margin: 10px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .loading { color: #6366F1; }
        .ready { color: #4CAF50; }
        .error { color: #f44336; }
        .icon { width: 20px; height: 20px; vertical-align: middle; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
    </style>
</head>
<body>
    <div id="status" class="loading">
        <span>Yükleniyor...</span>
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

        const icons = {
            loading: '<svg class="icon spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V6" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 18V22" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.93 4.93L7.76 7.76" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.24 16.24L19.07 19.07" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12H6" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 12H22" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.93 19.07L7.76 16.24" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.24 7.76L19.07 4.93" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            success: '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            error: '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18" stroke="#f44336" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6L18 18" stroke="#f44336" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        };

        let faceMesh;
        let isReady = false;
        let currentProcessingId = null;
        let currentImage = null;

        async function initMediaPipe() {
            try {
                statusDiv.innerHTML = icons.loading + '<span>MediaPipe yükleniyor...</span>';
                faceMesh = new FaceMesh({
                    locateFile: (file) => 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/' + file
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.7,
                    minTrackingConfidence: 0.5,
                    staticImageMode: true,
                    modelComplexity: 1
                });

                faceMesh.onResults(onResults);
                isReady = true;
                statusDiv.innerHTML = icons.success + '<span>Hazır</span>';
                statusDiv.className = 'ready';
                
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY', ready: true }));
            } catch (error) {
                statusDiv.innerHTML = icons.error + '<span>Hata: ' + error.message + '</span>';
                statusDiv.className = 'error';
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', error: error.message }));
            }
        }

        function onResults(results) {
            if (!canvasCtx) return;
            canvasCtx.save();
            const width = canvasElement.width;
            const height = canvasElement.height;
            canvasCtx.clearRect(0, 0, width, height);
            
            if (results.image) {
                canvasCtx.drawImage(results.image, 0, 0, width, height);
            }
            
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];
                const pixelLandmarks = landmarks.map((point, index) => ({
                    x: point.x * width,
                    y: point.y * height,
                    z: point.z * width,
                    index: index
                }));

                // --- Gelişmiş Pose ve Kalite Analizi ---
                // 1. Açı Hesaplamaları (Yaw, Pitch, Roll)
                const leftEye = landmarks[33];
                const rightEye = landmarks[263];
                const noseTip = landmarks[4];
                const bridge = landmarks[6];
                const forehead = landmarks[10];
                const chin = landmarks[152];

                // Yaw (Sağa-Sola Dönüş)
                const eyeDist = Math.sqrt(Math.pow(leftEye.x - rightEye.x, 2) + Math.pow(leftEye.y - rightEye.y, 2));
                const noseOffset = (noseTip.x - bridge.x) / eyeDist;
                const yaw = noseOffset * 50; // Derece bazlı yaklaşık değer

                // Pitch (Yukarı-Aşağı Bakış)
                const faceHeight = Math.abs(forehead.y - chin.y);
                const noseVerticalDist = (noseTip.y - bridge.y) / faceHeight;
                const pitch = (noseVerticalDist - 0.05) * 60; // 0.05 ideal merkez ofseti

                // Roll (Kafa Eğimi)
                const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);

                // 2. Kalite Puanlama (Penaltı Sistemi)
                let totalScore = 1.0;
                const details = {
                    yaw: { score: 1.0, value: yaw },
                    pitch: { score: 1.0, value: pitch },
                    roll: { score: 1.0, value: roll },
                    size: { score: 1.0, value: eyeDist }
                };

                // Yaw Penaltısı (Max 10 derece tolerans)
                if (Math.abs(yaw) > 10) details.yaw.score = Math.max(0.4, 1 - (Math.abs(yaw) - 10) / 20);
                
                // Pitch Penaltısı (Max 10 derece tolerans)
                if (Math.abs(pitch) > 10) details.pitch.score = Math.max(0.4, 1 - (Math.abs(pitch) - 10) / 15);
                
                // Roll Penaltısı (Max 5 derece tolerans)
                if (Math.abs(roll) > 5) details.roll.score = Math.max(0.5, 1 - (Math.abs(roll) - 5) / 10);
                
                // Boyut/Mesafe Penaltısı (İdeal göz mesafesi oranı: 0.15 - 0.45)
                if (eyeDist < 0.10) details.size.score = 0.85; // Çok uzak (minimum %85)
                if (eyeDist > 0.45) details.size.score = 0.85; // Çok yakın (minimum %85)

                totalScore = details.yaw.score * details.pitch.score * details.roll.score * details.size.score;

                // DIAGNOSTIC LOG: Neden düşük puan aldığımızı görmek için
                console.log('📊 [WEBVIEW QUALITY DIAGNOSTIC]', {
                    finalScore: (totalScore * 100).toFixed(1) + '%',
                    yaw: { val: yaw.toFixed(2), score: details.yaw.score.toFixed(2) },
                    pitch: { val: pitch.toFixed(2), score: details.pitch.score.toFixed(2) },
                    roll: { val: roll.toFixed(2), score: details.roll.score.toFixed(2) },
                    eyeDist: { val: eyeDist.toFixed(3), score: details.size.score.toFixed(2) }
                });

                // Görselleştirme (Daha dengeli - hem mesh hem yüz belli olsun)
                drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#EEEEEE70', lineWidth: 1});
                drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030', lineWidth: 1.5});
                drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30', lineWidth: 1.5});
                drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0A0', lineWidth: 1.5});
                
                drawLandmarks(canvasCtx, landmarks, {
                    color: '#6366F180',
                    lineWidth: 0.5,
                    radius: (data) => 0.8
                });

                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'LANDMARKS',
                    processingId: currentProcessingId,
                    data: {
                        landmarks: pixelLandmarks,
                        totalPoints: pixelLandmarks.length,
                        confidence: totalScore,
                        confidenceDetails: {
                            totalScore: totalScore,
                            yaw: details.yaw,
                            pitch: details.pitch,
                            roll: details.roll,
                            size: details.size
                        },
                        imageSize: { width, height }
                    }
                }));

                const meshImage = canvasElement.toDataURL('image/jpeg', 0.7);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'MESH_IMAGE',
                    processingId: currentProcessingId,
                    data: { meshImage }
                }));

                statusDiv.innerHTML = icons.success + '<span>Analiz: ' + (totalScore * 100).toFixed(0) + '%</span>';
            } else {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NO_FACE', processingId: currentProcessingId }));
                statusDiv.innerHTML = icons.error + '<span>Yüz bulunamadı</span>';
            }
            canvasCtx.restore();
        }

        window.processImage = async function(payload) {
            if (!faceMesh || !isReady) return;
            
            if (currentImage) {
                currentImage.onload = null;
                currentImage.src = '';
            }
            
            let base64Image = typeof payload === 'object' ? payload.image : payload;
            currentProcessingId = typeof payload === 'object' ? payload.id : null;

            statusDiv.innerHTML = icons.loading + '<span>Analiz ediliyor...</span>';
            const img = new Image();
            currentImage = img;

            img.onload = async function() {
                try {
                    await faceMesh.reset();
                    canvasElement.width = img.width;
                    canvasElement.height = img.height;
                    await faceMesh.send({image: img});
                } catch (e) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', error: e.message }));
                }
            };
            img.src = 'data:image/jpeg;base64,' + base64Image;
        };

        initMediaPipe();
    </script>
</body>
</html>
`;
