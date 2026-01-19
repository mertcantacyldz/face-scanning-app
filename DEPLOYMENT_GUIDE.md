# OpenRouter API Güvenlik Güncellemesi - Deployment Rehberi

Bu rehber, OpenRouter API anahtarını client-side'dan backend'e taşıyan güvenlik güncellemesini production'a almak için gereken adımları içerir.

## 🎯 Yapılan Değişiklikler

### 1. **Supabase Edge Function**: `analyze-face-region`
- OpenRouter API çağrılarını güvenli şekilde proxy'ler
- API anahtarı server-side'da saklanır (binary'den çıkarılamaz)
- Kullanıcı authentication (JWT)
- **Not**: Quota kontrolü frontend'de yapılıyor (mevcut yapı korundu)

### 2. **Client-Side Güncellemeler**
- `lib/openrouter.ts`: Direct API çağrısı → Edge Function çağrısı
- `app/(tabs)/analysis.tsx`: Simplified error handling
- `.env.example`: Güvenlik notları eklendi

### 3. **Database Migration** (Optional)
- `usage_tracking` tablosu opsiyonel (şu an kullanılmıyor)
- Frontend'de zaten quota tracking var (usePremium hook)
- İsterseniz analytics için uncomment edip kullanabilirsiniz

---

## 📋 Deployment Adımları

### Adım 1: OpenRouter API Anahtarını Supabase Secrets'a Ekle

```bash
# Önce Supabase CLI'nin yüklü olduğundan emin ol
npm install -g supabase

# Supabase'e login ol
supabase login

# Projeyi link et (ilk sefer)
supabase link --project-ref YOUR_PROJECT_REF

# API anahtarını secret olarak ekle
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

**Mevcut anahtarı nereden bulacaksınız:**
- Eski `.env` dosyanızda `EXPO_PUBLIC_OPENROUTER_API_KEY` değeri
- VEYA OpenRouter dashboard: https://openrouter.ai/keys

**Doğrulama:**
```bash
# Secrets'ları listele (anahtar görünmez, sadece isim)
supabase secrets list
# OPENROUTER_API_KEY'i görmelisiniz
```

---

### Adım 2: Edge Function'ı Deploy Et

```bash
# Edge Function'ı production'a deploy et
supabase functions deploy analyze-face-region

# Deploy loglarını kontrol et
supabase functions logs analyze-face-region --tail
```

**Test:**
```bash
# Edge Function'ı test et (authentication gerektirir)
curl -L -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/analyze-face-region' \
  -H 'Authorization: Bearer YOUR_USER_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  --data '{"landmarks": [], "region": "eyes", "customPrompt": "Test"}'
```

---

### Adım 3: Client-Side .env Dosyasını Güncelle

**CRITICAL:** `.env` dosyanızdan eski API anahtarını SİLİN:

```bash
# .env dosyasından bu satırı KALDIR:
# EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Sadece Supabase credentials kalmalı:
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Neden önemli?**
- `EXPO_PUBLIC_` prefix'li değişkenler mobil app binary'sine gömülür
- Eski key'i silmezsek güvenlik açığı devam eder

---

### Adım 4: Expo Cache'i Temizle ve Test Et

```bash
# Tüm cache'i temizle (ZORUNLU)
npx expo start --clear

# Veya alternatif olarak
rm -rf .expo node_modules/.cache

# App'i başlat
npx expo start
```

**Test Senaryoları:**

1. **Authentication Testi**:
   - Login yap
   - Bir bölgeyi analiz et → Başarılı olmalı
   - Console'da "✅ Analysis completed successfully" görmelisiniz

2. **Premium User Testi**:
   - Premium user ile login ol
   - Birden fazla analiz yap → Hepsi başarılı olmalı

3. **Session Testi**:
   - Logout → Login yap
   - Analiz çalışmalı (JWT token doğru gönderilmeli)

4. **Free User Limit Testi**:
   - Frontend'deki mevcut quota kontrolü çalışmalı
   - `usePremium` hook'u zaten limit kontrolü yapıyor

---

## 🔍 Troubleshooting

### Problem 1: Edge Function 404 Not Found
```
Error: Edge Function not found
```

**Çözüm:**
```bash
# Function'ın deploy edildiğini doğrula
supabase functions list

# Yoksa tekrar deploy et
supabase functions deploy analyze-face-region
```

---

### Problem 2: Unauthorized (401)
```
Error: Invalid or expired token
```

**Çözüm:**
- Kullanıcının giriş yapmış olduğundan emin olun
- `supabase.auth.getSession()` null döndürüyorsa logout → login yapın
- JWT token expire olmuş olabilir (auto-refresh çalışıyor mu?)

---

### Problem 3: API Key Missing (500)
```
Error: Server configuration error: API key missing
```

**Çözüm:**
```bash
# Secret'ın set edildiğini kontrol et
supabase secrets list

# Yoksa tekrar set et
supabase secrets set OPENROUTER_API_KEY=your_key_here

# Edge Function'ı yeniden deploy et (secrets güncellemesi için)
supabase functions deploy analyze-face-region
```

---

---

### Problem 4: Old API Key Still Used
```
Direct OpenRouter API call detected
```

**Çözüm:**
```bash
# .env dosyasından eski key'i SİL
# Sonra cache'i tamamen temizle
rm -rf .expo node_modules/.cache
npx expo start --clear

# VEYA tüm node_modules'ü yeniden yükle
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

---

## 📊 Monitoring

### Edge Function Logs
```bash
# Canlı logları izle
supabase functions logs analyze-face-region --tail

# Son 100 log girişi
supabase functions logs analyze-face-region --limit 100
```

### Database Queries

**Note**: Backend usage tracking yok (frontend'de yapılıyor), ama analytics için queries:

**Toplam analysis kayıtları:**
```sql
-- region_analysis tablosundan (mevcut tablo)
SELECT
  user_id,
  COUNT(*) as total_analyses
FROM region_analysis
GROUP BY user_id
ORDER BY total_analyses DESC
LIMIT 10;
```

**Premium users:**
```sql
SELECT id, email, is_premium, premium_expires_at
FROM profiles
WHERE is_premium = true
ORDER BY premium_expires_at DESC;
```

---

## ✅ Deployment Checklist

- [ ] OpenRouter API anahtarı Supabase secrets'a eklendi
- [ ] Edge Function deploy edildi
- [ ] `.env` dosyasından `EXPO_PUBLIC_OPENROUTER_API_KEY` silindi
- [ ] Expo cache temizlendi (`--clear` flag ile başlatıldı)
- [ ] Authentication test: Login → Analiz → Başarılı ✓
- [ ] Premium user test: Birden fazla analiz ✓
- [ ] Edge Function logları hatasız çalışıyor
- [ ] Frontend quota kontrolü çalışıyor (mevcut yapı)

---

## 🔄 Rollback Plan

Eğer production'da problem çıkarsa:

1. **Edge Function'ı kaldır:**
   ```bash
   supabase functions delete analyze-face-region
   ```

2. **Eski kodu geri yükle:**
   ```bash
   git checkout HEAD~1 lib/openrouter.ts app/(tabs)/analysis.tsx
   ```

3. **API anahtarını .env'e geri ekle:**
   ```bash
   echo "EXPO_PUBLIC_OPENROUTER_API_KEY=your_key_here" >> .env
   ```

4. **Cache temizle ve redeploy:**
   ```bash
   npx expo start --clear
   ```

---

## 📝 Notes

- **Quota Control**: Frontend'de yapılıyor (`usePremium` hook)
- **Secrets Rotation**: API anahtarını değiştirmeniz gerekirse:
  ```bash
  supabase secrets set OPENROUTER_API_KEY=new_key
  supabase functions deploy analyze-face-region
  ```
- **Migration**: Opsiyonel, şu an kullanılmıyor (uncomment edip kullanabilirsiniz)

---

## 🎉 Başarı Kriterleri

✅ OpenRouter API anahtarı client-side kodda yok
✅ API anahtarı mobil app binary'sinden çıkarılamaz
✅ Frontend quota kontrolü çalışıyor (mevcut yapı korundu)
✅ Edge Function stable çalışıyor (error rate <1%)
✅ Response time <10 saniye (p95)
✅ User authentication çalışıyor (JWT validation)

---

**Sorular için:** [GitHub Issues](https://github.com/yourrepo/issues)
