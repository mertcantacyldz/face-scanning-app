# Cihaz Değişikliği - Veri Persistence Rehberi

## ❌ Mevcut Sorun

### Senaryo: Premium User Yeni Cihaza Geçiyor

```
ESKİ CİHAZ:
- user_id: anonymous-123
- Premium: ✅ Aktif
- Analizler: 50 tarama ✓

YENİ CİHAZ:
- user_id: anonymous-456 (YENİ!)
- Premium: ✅ Restore ile geri geldi
- Analizler: 0 tarama ❌ (Kayboldu!)
```

**Sorun:** `face_analysis` tablosu `user_id` ile bağlı. Yeni anonymous user = yeni user_id = eski veriler erişilemez.

---

## ✅ Çözüm: Device ID Ekle

### Mantık

```
face_analysis tablosuna device_id ekle
↓
Query yaparken hem user_id hem device_id kontrol et
↓
Cihaz değişse bile device_id ile eski verilere eriş
```

### İmplementasyon

#### 1. Database Migration

**Dosya:** `supabase/add_device_id_to_face_analysis.sql`

```sql
-- device_id kolonu ekle
ALTER TABLE face_analysis
ADD COLUMN device_id TEXT;

-- Index ekle (performance için)
CREATE INDEX idx_face_analysis_device_id
  ON face_analysis(device_id);

-- Mevcut kayıtları güncelle
UPDATE face_analysis fa
SET device_id = (
  SELECT raw_user_meta_data->>'device_id'
  FROM auth.users
  WHERE id = fa.user_id
)
WHERE device_id IS NULL;
```

**Supabase Dashboard'da çalıştır!**

#### 2. Analiz Kaydederken device_id Ekle

**Hangi dosyalarda değişiklik gerekiyor:**
- `hooks/use-face-mesh.ts` - Analiz kaydetme fonksiyonu
- `app/(tabs)/index.tsx` - Face mesh kaydetme

**Değişiklik:**
```typescript
// ÖNCEKİ:
await supabase
  .from('face_analysis')
  .insert({
    user_id: userId,
    landmarks: landmarksData,
    analysis_data: analysisResult
  });

// YENİ:
const deviceId = await getOrCreateDeviceId();

await supabase
  .from('face_analysis')
  .insert({
    user_id: userId,
    device_id: deviceId,  // ← EKLE
    landmarks: landmarksData,
    analysis_data: analysisResult
  });
```

#### 3. Analiz Getirir ken device_id ile Query

**Dosya:** `app/(tabs)/analysis.tsx` veya history component

**ÖNCEKİ:**
```typescript
const { data } = await supabase
  .from('face_analysis')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

**YENİ:**
```typescript
const deviceId = await getOrCreateDeviceId();

const { data } = await supabase
  .from('face_analysis')
  .select('*')
  .or(`user_id.eq.${userId},device_id.eq.${deviceId}`)
  .order('created_at', { ascending: false });
```

**Bu query:**
- Mevcut user'ın analizlerini getirir
- VEYA bu cihazın tüm analizlerini getirir
- Cihaz değişse bile eski analizler görünür ✓

---

## 📊 Senaryo Karşılaştırma

### Önceki Durum ❌

```
CIHAZ 1 (iPhone 12):
- user_id: anonymous-123
- device_id: device-ABC
- Analizler: 50 tarama

                  │
                  │ (Cihaz değişikliği)
                  ▼

CIHAZ 2 (iPhone 15):
- user_id: anonymous-456
- device_id: device-XYZ
- Query: WHERE user_id = 'anonymous-456'
- Sonuç: 0 tarama ❌
```

### Yeni Durum ✅

```
CIHAZ 1 (iPhone 12):
- user_id: anonymous-123
- device_id: device-ABC
- Analizler: 50 tarama (device_id ile işaretli)

                  │
                  │ (Cihaz değişikliği)
                  ▼

CIHAZ 2 (iPhone 15):
- user_id: anonymous-456
- device_id: device-ABC (AYNI!)
- Query: WHERE user_id = 'anonymous-456'
         OR device_id = 'device-ABC'
- Sonuç: 50 tarama ✓ (device_id ile bulundu)
```

---

## 🎯 Avantajlar

### 1. Cihaz Değişikliğinde Veri Korunur
- Eski cihazdan yeni cihaza geçiş
- Analizler kaybolmaz
- Tek query ile hem yeni hem eski veriler

### 2. Uygulama Silme/Yeniden Yükleme
```
Senaryo:
1. Kullanıcı 50 analiz yaptı
2. Uygulamayı sildi
3. Yeniden yükledi
4. Yeni anonymous user oluştu

Sonuç:
- Premium: Restore ile geri gelir ✓
- Analizler: device_id ile geri gelir ✓
```

### 3. Multiple Anonymous Users (Edge Case)
```
Aynı cihazda birden fazla anonymous user oluşmuşsa:
- user-1: 10 analiz
- user-2: 20 analiz
- user-3: 30 analiz (aktif)

Query: device_id = 'device-ABC'
Sonuç: 60 analiz (hepsi) ✓
```

---

## ⚠️ Dikkat Edilmesi Gerekenler

### 1. Privacy
**Soru:** Aynı cihazı kullanan farklı kişiler birbirinin analizlerini görür mü?

**Cevap:** Evet, device_id aynı olduğu için. Ama:
- Çoğu kullanıcı tek kişi kullanıyor (kişisel cihaz)
- Paylaşılan cihazlarda profile/analiz ayırma gelecekte eklenebilir

**Çözüm (Future):**
- OAuth ile user separation
- "Logout" özelliği ekle
- Device-level vs Account-level data

### 2. Device ID Değişimi
**Soru:** Device ID değişirse ne olur?

**Cevap:**
- SecureStore kullanıyoruz (persist ediyor)
- Uygulama silinse bile iOS'ta korunuyor
- Ama Android'de bazen sıfırlanabilir

**Çözüm:** OAuth ile cloud backup (future)

### 3. Cross-Device Sync Yok (Henüz)
```
Kullanıcı 2 cihazı var:
- iPhone: 20 analiz
- iPad: 30 analiz

Her cihaz kendi device_id'sini kullanıyor.
Analizler birbirinden bağımsız.
```

**Çözüm:** OAuth + Cloud Sync (Phase 2)

---

## 🚀 Gelecek İyileştirmeler

### Phase 1: Device ID (ŞİMDİ) ✅
- ✅ device_id kolonu ekle
- ✅ Query'leri güncelle
- ✅ Insert'lere device_id ekle

### Phase 2: OAuth Integration (GELECEK)
```typescript
// OAuth sonrası tüm cihazların verilerini birleştir
async function mergeDeviceData(oauthUserId, deviceIds) {
  for (const deviceId of deviceIds) {
    await supabase
      .from('face_analysis')
      .update({ user_id: oauthUserId })
      .eq('device_id', deviceId);
  }
}
```

**Sonuç:** Tüm cihazlar + tüm analizler = tek OAuth account ✓

### Phase 3: Cloud Backup & Restore
- İsteğe bağlı cloud backup
- Cross-platform sync
- Family sharing support

---

## ✅ Yapılacaklar Listesi

### 1. Database Migration
- [ ] `add_device_id_to_face_analysis.sql` çalıştır
- [ ] Verification query ile kontrol et
- [ ] Index oluştuğunu doğrula

### 2. Code Changes
- [ ] Face analysis insert'e `device_id` ekle
  - Dosya: `hooks/use-face-mesh.ts` veya `app/(tabs)/index.tsx`
  - Import ekle: `import { getOrCreateDeviceId } from '@/lib/device-id';`
  - Insert'e `device_id: await getOrCreateDeviceId()` ekle

- [ ] Analysis query'yi güncelle
  - Dosya: `app/(tabs)/analysis.tsx` veya history component
  - OR condition ekle: `.or(\`user_id.eq.${userId},device_id.eq.${deviceId}\`)`

### 3. Test
- [ ] Yeni analiz kaydet → device_id var mı kontrol et
- [ ] Uygulamayı sil/yeniden yükle → analizler görünüyor mu?
- [ ] Farklı cihazda test et (mümkünse)

---

## 📝 Özet

**Sorun:** Cihaz değişince analizler kayboluyor ❌

**Çözüm:** `device_id` ile tracking ✅

**Sonuç:**
- ✅ Premium restore ile geri geliyor
- ✅ Analizler device_id ile geri geliyor
- ✅ Zero data loss

**Sonraki adım:** OAuth ile multi-device sync (Phase 2)
