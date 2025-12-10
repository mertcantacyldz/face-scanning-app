# Restore Purchases - Kullanım Rehberi

## ✅ Tamamlanan İşler

### 1. Restore Fonksiyonu Güncellendi
**Dosya:** `lib/revenuecat.ts`

**Yeni özellikler:**
- RevenueCat `restorePurchases()` çağrısı
- Active premium subscription kontrolü
- Supabase ile otomatik senkronizasyon
- `is_premium` ve `premium_expires_at` güncelleme

**Akış:**
```
1. RevenueCat.restorePurchases() çağır
2. Active "premium" entitlement kontrol et
3. Varsa → Supabase profiles tablosunu güncelle
   - is_premium: true
   - premium_expires_at: [expiration date]
4. Success döndür
```

### 2. UI Zaten Hazır
**Dosya:** `app/paywall.tsx`

**Restore Butonu:** Line 254-266
```tsx
<Pressable
  onPress={handleRestore}
  disabled={purchasing || restoring}
  className="py-2 items-center"
>
  {restoring ? (
    <ActivityIndicator color="#007AFF" size="small" />
  ) : (
    <Text className="text-primary text-sm">
      Satın Alımları Geri Yükle
    </Text>
  )}
</Pressable>
```

### 3. Context Entegrasyonu
**Dosya:** `contexts/PremiumContext.tsx`

Zaten `restore()` fonksiyonu mevcut ve paywall'da kullanılıyor.

---

## 🎯 Kullanıcı Akışı

### Senaryo 1: Yeni Cihazda Restore

```
1. Kullanıcı uygulamayı yeni cihaza yüklüyor
   ├─ Anonymous user oluşturuluyor
   └─ is_premium: false

2. Premium paywallde "Satın Alımları Geri Yükle" tıklıyor
   └─ RevenueCat cihazın Apple/Google ID'sine bakıyor

3. Active subscription bulunuyor
   ├─ Supabase güncelleniyor: is_premium = true
   ├─ Premium expires date kaydediliyor
   └─ Başarı mesajı gösteriliyor

4. Kullanıcı premium özelliklerini kullanabiliyor
```

### Senaryo 2: Uygulama Silindi ve Yeniden Yüklendi

```
1. Kullanıcı uygulamayı sildi
2. Yeniden yükledi (aynı cihaz)
3. Yeni anonymous user oluşturuldu
4. "Satın Alımları Geri Yükle" tıkla
5. Premium status geri yüklendi ✅
```

### Senaryo 3: Premium Subscription Yok

```
1. "Satın Alımları Geri Yükle" tıkla
2. RevenueCat kontrol ediyor
3. Active subscription bulunamadı
4. Kullanıcıya bilgi mesajı:
   "Geri yüklenecek satın alım bulunamadı."
```

---

## 📊 Restore Fonksiyonu Detayları

### Input
- Yok (mevcut cihazın Apple/Google ID'sini kullanır)

### Output
```typescript
{
  success: boolean;     // Restore işlemi başarılı mı?
  isPremium: boolean;   // Premium subscription var mı?
  error?: string;       // Hata mesajı (varsa)
}
```

### Loglama
```
🔄 Starting restore purchases...
📦 RevenueCat restore complete. Premium: true
✅ Premium subscription found! Syncing with Supabase...
✅ Premium status synced with Supabase
```

### Hata Durumları

1. **RevenueCat Hatası**
   ```
   ❌ Restore error: [error message]
   ```
   → User'a hata mesajı gösterilir

2. **Supabase Sync Hatası**
   ```
   ❌ Failed to update premium status in Supabase
   ```
   → Restore başarılı sayılır (RevenueCat source of truth)

3. **No User**
   ```
   ⚠️ No authenticated user, skipping Supabase sync
   ```
   → Restore başarılı sayılır

---

## 🧪 Test Senaryoları

### Test 1: Basic Restore (Sandbox)

**Gereksinimler:**
- RevenueCat Sandbox mode
- Test subscription satın alınmış

**Adımlar:**
1. Uygulamayı sil
2. Yeniden yükle
3. Paywall'e git
4. "Satın Alımları Geri Yükle" tıkla

**Beklenen Sonuç:**
```
✅ Premium status geri yüklendi
✅ Supabase'de is_premium: true
✅ Paywall kapandı
```

### Test 2: No Subscription

**Adımlar:**
1. Hiç premium almamış hesapla test et
2. "Satın Alımları Geri Yükle" tıkla

**Beklenen Sonuç:**
```
Alert: "Geri yüklenecek satın alım bulunamadı."
```

### Test 3: Expired Subscription

**Adımlar:**
1. Expired subscription olan hesapla test et
2. "Satın Alımları Geri Yükle" tıkla

**Beklenen Sonuç:**
```
❌ No active premium subscription found
Alert: "Geri yüklenecek satın alım bulunamadı."
```

---

## 🔧 Troubleshooting

### Problem: "Satın alım bulunamadı" ama ben premium aldım

**Çözüm:**
1. Aynı Apple/Google hesabıyla giriş yaptığınızdan emin olun
2. RevenueCat Dashboard'da subscription durumunu kontrol edin
3. Sandbox mode'da test ediyorsanız, sandbox hesap kullanın

### Problem: Restore başarılı ama premium özelliklere erişemiyorum

**Çözüm:**
1. `usePremium` hook'unu kontrol edin
2. `checkPremiumStatus()` fonksiyonunu manuel çağırın
3. Supabase'de `is_premium` alanını kontrol edin

### Problem: Supabase sync hatası

**Log:**
```
❌ Failed to update premium status in Supabase
```

**Sebep:** RLS policy veya database connection hatası

**Çözüm:**
- RevenueCat çalışıyor, premium features kullanılabilir
- Arka planda Supabase sync sorunu çözülmeli

---

## 🚀 Gelecek İyileştirmeler (OAuth Sonrası)

### Phase 2: OAuth ile Data Migration

```typescript
// Restore + Data Migration akışı
async function restoreWithDataMigration() {
  // 1. RevenueCat restore
  const { isPremium } = await restorePurchases();

  if (isPremium) {
    // 2. OAuth ile giriş yap
    await signInWithGoogle();

    // 3. Eski anonymous user verilerini taşı
    await migrateAnonymousDataToOAuth(oldUserId, newUserId);

    // 4. Device mapping güncelle
    await updateDeviceMapping(deviceId, newUserId);
  }
}
```

Bu şimdilik beklemede, OAuth implementation sonrası eklenecek.

---

## ✅ Özet

### Tamamlanan
- ✅ RevenueCat restore fonksiyonu
- ✅ Supabase otomatik senkronizasyon
- ✅ UI (restore butonu)
- ✅ Error handling
- ✅ Detaylı loglama

### Bekleniyor (OAuth Phase)
- ⏳ OAuth sign-in integration
- ⏳ Data migration (anonymous → OAuth)
- ⏳ Device mapping update

**Restore Purchases şu an çalışıyor!** 🎉

Kullanıcı paywall'de "Satın Alımları Geri Yükle" tıklayabilir ve premium aboneliği varsa geri yüklenecek.
