# Device ID Persistence - Diagnostic Guide

## 🔍 Problem
Device ID değişiyor her uygulama yeniden başlatıldığında, bu da her seferinde yeni anonymous user oluşturulmasına sebep oluyor.

## 📋 Test Adımları

### 1. İlk Açılış Testi
Uygulamayı **TAM OLARAK KAPATIP** yeniden başlat ve logları kontrol et:

```bash
npx expo start --clear
```

**Beklenen Log (İLK AÇILIŞ):**
```
🔍 Checking for existing device ID...
❌ No existing device ID found
🆕 New device ID generated: abc123-def456-...
💾 Saving device ID to SecureStore...
✅ Device ID saved successfully
✅ Device ID verified in SecureStore
```

### 2. İkinci Açılış Testi
Uygulamayı **KAPATIP TEKRAR AÇ** (Expo Go'yu tamamen kapat):

**Beklenen Log (İKİNCİ AÇILIŞ - BAŞARILI):**
```
🔍 Checking for existing device ID...
✅ Device ID retrieved from SecureStore: abc123-def456-...
```
☝️ **Aynı ID tekrar kullanılmalı!**

**Gerçek Log (İKİNCİ AÇILIŞ - BAŞARISIZ):**
```
🔍 Checking for existing device ID...
❌ No existing device ID found
🆕 New device ID generated: xyz789-uvw012-...
```
☝️ **Farklı ID oluşturulmuş - SORUN VAR!**

---

## 🎯 Olası Senaryolar ve Çözümler

### Senaryo 1: SecureStore Hatası
**Log:**
```
❌ Device ID error: [SecureStoreError: ...]
Error type: ...
⚠️ Using temporary device ID (will change on restart): temp-xyz...
```

**Sebep:** SecureStore API'si çalışmıyor (Expo Go limiti veya izin sorunu)

**Çözüm:** Development build kullan:
```bash
npx expo prebuild
npx expo run:android  # veya run:ios
```

---

### Senaryo 2: Verification Failed
**Log:**
```
💾 Saving device ID to SecureStore...
✅ Device ID saved successfully
⚠️ Device ID verification failed! Saved: abc123 Retrieved: null
```

**Sebep:** SecureStore.setItemAsync() başarılı gibi görünüyor ama sonra geri okunamıyor

**Çözüm:** AsyncStorage'a geç (fallback):

```typescript
// lib/device-id.ts güncellenmeli
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getOrCreateDeviceId(): Promise<string> {
  try {
    // 1. Önce SecureStore dene
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (deviceId) {
      return deviceId;
    }

    // 2. SecureStore'da yoksa AsyncStorage'a bak (fallback)
    deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (deviceId) {
      console.log('✅ Device ID retrieved from AsyncStorage (fallback)');
      return deviceId;
    }

    // 3. Hiçbir yerde yoksa yeni oluştur
    deviceId = generateUUID();

    // 4. Her ikisine de kaydet
    await Promise.all([
      SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId).catch(err =>
        console.warn('SecureStore save failed:', err)
      ),
      AsyncStorage.setItem(DEVICE_ID_KEY, deviceId)
    ]);

    return deviceId;
  } catch (error) {
    console.error('Device ID error:', error);
    return `temp-${generateUUID()}`;
  }
}
```

**Bağımlılık Ekle:**
```bash
npx expo install @react-native-async-storage/async-storage
```

---

### Senaryo 3: Expo Go Cache Problemi
**Log:**
```
🔍 Checking for existing device ID...
❌ No existing device ID found
```
(Her açılışta bu görünüyor, hata yok ama ID persist etmiyor)

**Sebep:** Expo Go sandbox'ında SecureStore her reload'da sıfırlanıyor

**Çözüm 1 - Development Build (Önerilen):**
```bash
npx expo prebuild
npx expo run:android  # veya run:ios
```

**Çözüm 2 - AsyncStorage Fallback (Hızlı):**
Yukarıdaki Senaryo 2'deki kodu kullan.

---

## 🧪 Manuel Test

Device ID'nin gerçekten persist edip etmediğini kontrol etmek için:

```typescript
// Test fonksiyonu ekle: lib/device-id.ts
export async function testDeviceId() {
  console.log('=== DEVICE ID TEST START ===');

  const deviceId = await getOrCreateDeviceId();
  console.log('Current Device ID:', deviceId);

  // Doğrudan SecureStore'dan oku
  const directRead = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  console.log('Direct SecureStore read:', directRead);

  // Device info
  const info = await getDeviceInfo();
  console.log('Device Info:', info);

  console.log('=== DEVICE ID TEST END ===');
}
```

**Kullanım:**
```typescript
// app/(tabs)/index.tsx veya app/index.tsx
import { testDeviceId } from '@/lib/device-id';

useEffect(() => {
  testDeviceId();
}, []);
```

---

## 🚨 Kritik Notlar

### Expo Go Limitleri
- **SecureStore** Expo Go'da bazı platformlarda제대로 çalışmayabilir
- **Development build** gerçek cihaz davranışını gösterir
- **Expo Go** sadece development için, production davranışı farklı

### Production'da Durum
- **iOS:** Keychain kullanılır → uygulama silinse bile ID korunur
- **Android:** KeyStore kullanılır → uygulama silinse bile ID korunur
- **Expo Go:** Sandbox ortamı → güvenilir değil

### AsyncStorage vs SecureStore
| Özellik | SecureStore | AsyncStorage |
|---------|-------------|--------------|
| Güvenlik | ✅ Şifreli (Keychain/KeyStore) | ❌ Plain text |
| Uygulama silindikten sonra | ✅ Korunur (iOS) | ❌ Silinir |
| Expo Go Desteği | ⚠️ Sınırlı | ✅ Tam |
| Production | ✅ Önerilen | ⚠️ Fallback |

---

## ✅ Çözüm Öncelikleri

### Kısa Vadeli (Hızlı Test için)
1. AsyncStorage fallback ekle → Expo Go'da çalışır
2. Test et ve onay al
3. Premium flow'a devam et

### Uzun Vadeli (Production için)
1. Development build oluştur
2. Gerçek cihazda test et
3. SecureStore'un제대로 çalıştığını doğrula
4. AsyncStorage'ı sadece fallback olarak tut

---

## 📝 Şu An Yapılacaklar

1. **Uygulamayı tamamen kapat** (Expo Go'yu kapat)
2. **Yeniden başlat:** `npx expo start --clear`
3. **İlk açılış loglarını kaydet**
4. **Uygulamayı TEKRAR kapat**
5. **İkinci açılışta logları kontrol et**

**Aradığımız soru:**
- İkinci açılışta `✅ Device ID retrieved from SecureStore: [AYNI ID]` görüyor muyuz?
- Yoksa `❌ No existing device ID found` ve `🆕 New device ID generated: [FARKLI ID]` mı?

---

## 🔧 Hızlı Düzeltme (AsyncStorage Fallback)

Eğer SecureStore çalışmıyorsa, şimdi AsyncStorage ekleyelim:

```bash
npx expo install @react-native-async-storage/async-storage
```

Sonra `lib/device-id.ts` dosyasını güncelleyip tekrar test edelim.

**Sonuç:** Production'da SecureStore çalışacak, Expo Go'da AsyncStorage fallback kullanılacak.
