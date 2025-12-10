# AsyncStorage Fallback - Implementasyon Rehberi

## 🎯 Ne Zaman Gerekir?

Eğer test sonucunda Device ID her açılışta değişiyorsa (yani SecureStore Expo Go'da çalışmıyorsa), bu fallback implementasyonunu kullan.

## 📋 Adım 1: Bağımlılık Ekle

```bash
npx expo install @react-native-async-storage/async-storage
```

## 📋 Adım 2: device-id.ts Dosyasını Değiştir

İki seçeneğin var:

### Seçenek A: Dosyayı Değiştir (Basit)

```bash
# Eski dosyayı yedeklepeki uygulamayı silip yüklesem ya da telefonu aç kapa yapsam yine aynı mantıkla mı işler
cp lib/device-id.ts lib/device-id.backup.ts

# Yeni versiyonu kullan
cp lib/device-id-with-fallback.ts lib/device-id.ts
```

### Seçenek B: Manuel Güncelle

`lib/device-id.ts` dosyasının başına import ekle:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
```

Sonra `getOrCreateDeviceId()` fonksiyonunu şu şekilde güncelle:

```typescript
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    // 1. SecureStore kontrol et
    console.log('🔍 Checking SecureStore for existing device ID...');
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY).catch(err => {
      console.warn('⚠️ SecureStore read error:', err.message);
      return null;
    });

    if (deviceId) {
      console.log('✅ Device ID retrieved from SecureStore:', deviceId);
      return deviceId;
    }

    // 2. AsyncStorage kontrol et (fallback)
    console.log('🔍 Checking AsyncStorage for existing device ID...');
    deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (deviceId) {
      console.log('✅ Device ID retrieved from AsyncStorage (fallback):', deviceId);
      return deviceId;
    }

    // 3. Yeni oluştur
    deviceId = generateUUID();
    console.log('🆕 New device ID generated:', deviceId);

    // 4. Her ikisine de kaydet
    await Promise.allSettled([
      SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId).then(() => {
        console.log('✅ Device ID saved to SecureStore');
      }).catch(err => {
        console.warn('⚠️ SecureStore save failed:', err.message);
      }),
      AsyncStorage.setItem(DEVICE_ID_KEY, deviceId).then(() => {
        console.log('✅ Device ID saved to AsyncStorage');
      })
    ]);

    // 5. Verify
    const verifySecure = await SecureStore.getItemAsync(DEVICE_ID_KEY).catch(() => null);
    const verifyAsync = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (verifySecure === deviceId) {
      console.log('✅ Device ID verified in SecureStore');
    } else if (verifyAsync === deviceId) {
      console.log('✅ Device ID verified in AsyncStorage');
    } else {
      console.warn('⚠️ Device ID verification failed in both storages!');
    }

    return deviceId;
  } catch (error) {
    console.error('❌ Device ID error:', error);
    const tempId = `temp-${generateUUID()}`;
    console.warn('⚠️ Using temporary device ID:', tempId);
    return tempId;
  }
}
```

## 📋 Adım 3: Test Et

```bash
npx expo start --clear
```

**Beklenen Davranış:**

### İlk Açılış:
```
🔍 Checking SecureStore for existing device ID...
❌ No device ID in SecureStore
🔍 Checking AsyncStorage for existing device ID...
❌ No device ID in AsyncStorage
🆕 New device ID generated: abc-123...
⚠️ SecureStore save failed: [Error] (Expo Go'da normal)
✅ Device ID saved to AsyncStorage
✅ Device ID verified in AsyncStorage
```

### İkinci Açılış (Uygulama Kapatıp Aç):
```
🔍 Checking SecureStore for existing device ID...
❌ No device ID in SecureStore (Expo Go'da normal)
🔍 Checking AsyncStorage for existing device ID...
✅ Device ID retrieved from AsyncStorage (fallback): abc-123...
```

☝️ **AYNI ID!** Artık her açılışta aynı device ID kullanılacak.

## 📋 Adım 4: Diagnostic Test (Opsiyonel)

`app/(tabs)/index.tsx` veya `app/index.tsx` dosyasına ekle:

```typescript
import { testDeviceId } from '@/lib/device-id';

// Component içinde
useEffect(() => {
  testDeviceId(); // Detaylı diagnostic çıktısı
}, []);
```

Bu şu şekilde bir çıktı verecek:

```
═══════════════════════════════════════
     DEVICE ID DIAGNOSTIC TEST
═══════════════════════════════════════
📱 Current Device ID: abc-123-def-456...

📦 Storage Status:
  - SecureStore: ❌ Empty
  - AsyncStorage: ✅ abc-123-def-456...
  - Primary Source: async-storage

🔧 Device Info:
  - Platform: android
  - OS: Android 14
  - Device: sdk_gphone64_arm64
  - Is Physical Device: false

═══════════════════════════════════════

⚠️ INFO: Using AsyncStorage (SecureStore failed).
   Device ID will persist, but less secure.
   This is normal in Expo Go, will use SecureStore in production.
```

## ✅ Başarı Kriterleri

- [ ] `@react-native-async-storage/async-storage` yüklendi
- [ ] `lib/device-id.ts` güncellendi (veya değiştirildi)
- [ ] İlk açılışta device ID oluşturuldu
- [ ] İkinci açılışta **AYNI** device ID kullanıldı
- [ ] `use-auth.ts` loglarında sadece **BİR** anonymous user creation görünüyor

## 🔧 Sorun Giderme

### Hala Her Açılışta Yeni ID Oluşuyor
**Sebep:** AsyncStorage da temizleniyor olabilir (hot reload)

**Çözüm:** Uygulamayı TAM KAPATIP aç (hot reload değil):
1. Expo Go'yu tamamen kapat
2. `npx expo start --clear` ile yeniden başlat
3. QR kodu tekrar tara

### "AsyncStorage is not available" Hatası
**Sebep:** Package제대로 yüklenmemiş

**Çözüm:**
```bash
npx expo install @react-native-async-storage/async-storage
npx expo start --clear
```

### Her İki Storage da Empty
**Sebep:** Device ID hiç oluşturulmamış veya critical error var

**Çözüm:** `testDeviceId()` çıktısını kontrol et, error loglarına bak.

## 🎯 Production Davranışı

### Expo Go (Development):
- SecureStore başarısız olur ✗
- AsyncStorage kullanılır ✓
- Device ID persist eder ✓

### Development Build (npx expo run:android):
- SecureStore başarılı olur ✓
- AsyncStorage backup olarak kullanılır
- Device ID persist eder ✓

### Production (EAS Build):
- SecureStore başarılı olur ✓
- AsyncStorage backup olarak kullanılır
- Device ID persist eder ✓
- **Uygulama silindikten sonra bile** ID korunabilir (iOS Keychain)

## 📊 Karşılaştırma

| Özellik | Sadece SecureStore | SecureStore + AsyncStorage Fallback |
|---------|-------------------|-------------------------------------|
| Expo Go'da Çalışır | ❌ Hayır | ✅ Evet |
| Production'da Güvenli | ✅ Evet | ✅ Evet (SecureStore kullanılır) |
| Uygulama Silindikten Sonra | ✅ ID korunur (iOS) | ✅ ID korunur (iOS, SecureStore varsa) |
| Komplekslik | Basit | Orta |
| Önerilen | Production only | Development + Production |

## 🚀 Önerilen Strateji

1. **Şimdi:** AsyncStorage fallback ekle → Expo Go'da test et
2. **Premium tamamlandıktan sonra:** Development build oluştur → gerçek cihazda test et
3. **Production öncesi:** EAS Build ile test et → SecureStore'un çalıştığını doğrula

Bu şekilde hem development hem production için hazır olursun!
