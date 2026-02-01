# MediaPipe Landmark Variation Problem & Solutions

## 1. Problem Tanımı

MediaPipe Face Mesh, aynı görüntü için her çalıştırmada **biraz farklı landmark koordinatları** döndürebilir. Bu durum "deterministic olmayan" (non-deterministic) bir davranıştır.

### Gözlemlenen Durum

Test sırasında Case 3 için yapılan ölçümlerde:

| Ölçüm | Tip Deviation % | Rotation Angle | Overall Score |
|-------|-----------------|----------------|---------------|
| İlk tarama | 4.32% | -3.15° | - |
| Tekrar tarama | 3.97% | -2.73° | 5.4 |

**Fark:** ~0.35% tip deviation, ~0.42° rotation

### Etki

- **Skor Farkı:** ~0.5-1.0 puan fark oluşabilir
- **Kullanıcı Deneyimi:** Aynı fotoğrafı tekrar taratınca farklı skor alma
- **Güvenilirlik:** Kullanıcı sistemin doğruluğundan şüphe duyabilir

---

## 2. Neden Oluşuyor?

### 2.1 MediaPipe İç Faktörleri

1. **Floating Point Hesaplamalar**
   - GPU/CPU'da yapılan hesaplamalarda mikro farklılıklar
   - Tensor operasyonlarındaki yuvarlama farklılıkları

2. **Model İnternals**
   - Batch normalization katmanları
   - Dropout (inference'da kapalı olsa bile bazı implementasyonlarda etki)

3. **WebGL/GPU Non-Determinism**
   - WebView üzerinden çalışan MediaPipe, GPU shader'larını kullanır
   - GPU thread scheduling farklılıkları

### 2.2 Görüntü İşleme Faktörleri

1. **JPEG Compression Artifacts**
   - Her encode/decode döngüsünde mikro kayıp

2. **Resize Algoritması**
   - Farklı interpolation yöntemleri farklı sonuçlar verir

3. **Color Space Dönüşümleri**
   - RGB ↔ BGR dönüşümlerinde hassasiyet kaybı

---

## 3. Önerilen Çözümler

### 3.1 Çoklu Ölçüm Ortalaması (Önerilen ⭐)

**Yaklaşım:** Aynı görüntüyü 3-5 kez işleyip ortalamasını al.

```typescript
async function getStableLandmarks(imageBase64: string, iterations: number = 3): Promise<NormalizedLandmark[]> {
  const allLandmarks: NormalizedLandmark[][] = [];

  for (let i = 0; i < iterations; i++) {
    const result = await processImageWithMediaPipe(imageBase64);
    if (result.landmarks) {
      allLandmarks.push(result.landmarks);
    }
  }

  // Her landmark için ortalama koordinat hesapla
  return averageLandmarks(allLandmarks);
}

function averageLandmarks(allLandmarks: NormalizedLandmark[][]): NormalizedLandmark[] {
  const count = allLandmarks.length;
  const averaged: NormalizedLandmark[] = [];

  for (let i = 0; i < 468; i++) {
    let sumX = 0, sumY = 0, sumZ = 0;

    for (const landmarks of allLandmarks) {
      sumX += landmarks[i].x;
      sumY += landmarks[i].y;
      sumZ += landmarks[i].z ?? 0;
    }

    averaged.push({
      x: sumX / count,
      y: sumY / count,
      z: sumZ / count,
      index: i
    });
  }

  return averaged;
}
```

**Avantajlar:**
- Basit implementasyon
- Random noise'u azaltır
- Mevcut koda minimal değişiklik

**Dezavantajlar:**
- İşlem süresi 3-5x artar
- Batarya/CPU kullanımı artar

---

### 3.2 Güven Eşiği Artırma

**Yaklaşım:** MediaPipe confidence threshold'unu artır.

```javascript
// lib/mediapipe-html.ts içinde
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.85,  // 0.7'den artır
  minTrackingConfidence: 0.7,    // 0.5'den artır
  staticImageMode: true,
  modelComplexity: 1
});
```

**Avantajlar:**
- Düşük kaliteli tespitleri filtreler
- Ek işlem süresi yok

**Dezavantajlar:**
- Bazı geçerli yüzler reddedilebilir
- Varyasyonu tamamen çözmez

---

### 3.3 Görüntü Ön-İşleme

**Yaklaşım:** Görüntüyü standartlaştırarak tutarlılığı artır.

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

async function preprocessImage(uri: string): Promise<string> {
  const context = ImageManipulator.manipulate(uri);

  // 1. Sabit boyuta resize (zaten yapılıyor: 1024x1024)
  context.resize({ width: 1024, height: 1024 });

  // 2. Normalize (expo-image-manipulator'da yok, native modül gerekir)
  // - Histogram equalization
  // - Gaussian blur (hafif, gürültü azaltma)

  const image = await context.renderAsync();
  const result = await image.saveAsync({
    format: ImageManipulator.SaveFormat.PNG,  // Lossy compression yerine
    base64: true
  });

  return result.base64;
}
```

**Ek Öneri: PNG Kullanımı**
```typescript
// JPEG yerine PNG kullan (lossy → lossless)
format: ImageManipulator.SaveFormat.PNG
```

**Avantajlar:**
- JPEG artifact'larını elimine eder
- Daha tutarlı input

**Dezavantajlar:**
- PNG dosya boyutu daha büyük
- Base64 string daha uzun
- Ek native modül gerekebilir (histogram eq. için)

---

### 3.4 Outlier Filtreleme

**Yaklaşım:** Çoklu ölçümde aşırı sapan değerleri çıkar.

```typescript
function filterOutliers(values: number[], stdDevThreshold: number = 1.5): number[] {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
  );

  return values.filter(v => Math.abs(v - mean) <= stdDevThreshold * stdDev);
}

async function getStableMetric(imageBase64: string, metricFn: Function): Promise<number> {
  const measurements: number[] = [];

  for (let i = 0; i < 5; i++) {
    const landmarks = await processImageWithMediaPipe(imageBase64);
    const metric = metricFn(landmarks);
    measurements.push(metric);
  }

  // Outlier'ları filtrele
  const filtered = filterOutliers(measurements);

  // Kalan değerlerin ortalaması
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
}
```

**Avantajlar:**
- Aşırı sapan ölçümleri elimine eder
- İstatistiksel olarak daha sağlam

**Dezavantajlar:**
- 5+ ölçüm gerektirir
- Hesaplama karmaşıklığı artar

---

### 3.5 Tolerans Bantları (Score Rounding)

**Yaklaşım:** Küçük farklılıkları görmezden gel.

```typescript
function roundToTolerance(score: number, tolerance: number = 0.5): number {
  return Math.round(score / tolerance) * tolerance;
}

// Kullanım
const finalScore = roundToTolerance(6.23, 0.5);  // → 6.5
```

**Alternatif: Skor Aralığı Gösterme**
```typescript
// Tek skor yerine aralık göster
const displayScore = `${(score - 0.3).toFixed(1)} - ${(score + 0.3).toFixed(1)}`;
// "6.2 - 6.8" gibi
```

**Avantajlar:**
- Implementasyon çok basit
- Kullanıcıya "kesinlik yanılsaması" vermez

**Dezavantajlar:**
- Gerçek varyasyonu çözmez, sadece gizler
- Kullanıcı karşılaştırma yapamaz

---

## 4. Önerilen Hibrit Yaklaşım

En etkili çözüm birden fazla yöntemi birleştirmektir:

```typescript
// 1. Görüntü ön-işleme (PNG, sabit boyut)
const processedImage = await preprocessImage(imageUri);

// 2. Çoklu ölçüm (3 iterasyon)
const measurements: LandmarkSet[] = [];
for (let i = 0; i < 3; i++) {
  const result = await processImageWithMediaPipe(processedImage);
  if (result.landmarks && result.confidence > 0.85) {  // 3. Güven eşiği
    measurements.push(result.landmarks);
  }
}

// 4. Ortalama al (en az 2 geçerli ölçüm varsa)
if (measurements.length >= 2) {
  const stableLandmarks = averageLandmarks(measurements);
  return calculateMetrics(stableLandmarks);
}

// Yeterli ölçüm yoksa hata
throw new Error('Yeterli güvenilir ölçüm yapılamadı');
```

---

## 5. Performans Karşılaştırması

| Yöntem | Süre Artışı | Doğruluk İyileşmesi | Kompleksite |
|--------|-------------|---------------------|-------------|
| Çoklu Ölçüm (3x) | +200% | Yüksek | Düşük |
| Güven Eşiği | 0% | Orta | Çok Düşük |
| PNG Kullanımı | +20% | Düşük-Orta | Çok Düşük |
| Outlier Filtreleme | +300% | Çok Yüksek | Orta |
| Hibrit | +250% | Çok Yüksek | Orta |

---

## 6. Mevcut Durumda Ne Yapmalı?

**Kısa Vadede (Hemen):**
1. ✅ Mevcut skorlama kalibrasyonu kabul edilebilir düzeyde
2. ⚠️ Kullanıcıya "±0.5 puan hassasiyet" bilgisi verilebilir
3. 📝 UI'da "Bu analiz yaklaşık değerlerdir" disclaimer'ı ekle

**Orta Vadede (Sonraki Sprint):**
1. 🔧 PNG formatına geçiş (en kolay)
2. 🔧 Güven eşiğini 0.85'e çıkar

**Uzun Vadede (Major Update):**
1. 🚀 Çoklu ölçüm sistemini implement et
2. 🚀 Loading UI'ını "Analiz yapılıyor... (2/3)" şeklinde güncelle

---

## 7. Kaynaklar

- [MediaPipe Face Mesh Documentation](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- [MediaPipe GitHub Issues - Determinism](https://github.com/google/mediapipe/issues)
- [WebGL Non-Determinism](https://www.khronos.org/webgl/wiki/HandlingContextLost)

---

*Son güncelleme: 2026-02-01*
*İlgili dosya: lib/calculations/nose.ts*
