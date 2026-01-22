# Apple App Store Submission Readiness Report - FaceLoom

Bu rapor, projenizin App Store'a gönderilmeden önce Apple tarafından reddedilme riskini azaltmak için hazırlanan analiz ve çözüm önerilerini içermektedir.

## 1. Teknik Eksiklikler (Otomatik Düzeltilebilir)

Aşağıdaki maddeler `app.json` dosyasında eksik olan ve teknik olarak gönderim sırasında hataya sebep olacak konulardır:

| Madde | Durum | Çözüm / Seçenekler |
| :--- | :--- | :--- |
| **Bundle Identifier** | ❌ Eksik | `com.mertcantacyildiz.faceloom` gibi benzersiz bir ID eklenmeli. |
| **Build Number** | ❌ Eksik | Her gönderimde artırılacak bir versiyon numarası (`1`, `2`...) eklenmeli. |
| **Privacy Policy URL** | ❌ Eksik | Apple, uygulama içindeki verilerin ne yapıldığını açıklayan bir URL ister. |
| **Camera Permission** | ❌ Eksik | `NSCameraUsageDescription` açıklaması eklenmeli. |
| **Photo Library Permission** | ❌ Eksik | `NSPhotoLibraryUsageDescription` açıklaması eklenmeli. |

---

## 2. In-App Purchase (Abonelik) Uyumluluğu

Apple, abonelik ekranlarında (Paywall) çok katı kurallara sahiptir. `paywall.tsx` dosyasında şu eksikler tespit edilmiştir:

- **Restore Purchases (Satın Alımları Geri Yükle)**: Buton mevcut fakat sayfanın en altında daha belirgin olması önerilir (Mevcut hali kabul edilebilir ancak test edilmeli).
- **Terms of Use & Privacy Policy Links**: Apple, paywall ekranında "Kullanım Koşulları" ve "Gizlilik Politikası" linklerinin tıklanabilir olmasını ZORUNLU tutar. Sadece yazı olarak belirtilmesi yetersizdir.
- **EULA**: Standart Apple EULA'sına atıfta bulunulmalı veya kendi EULA'nızın linki eklenmeli.

---

## 3. Yasal Dosyaların Analizi (docs/ Klasörü)

`docs/` klasöründeki `privacy.html` ve `terms.html` dosyaları incelendi. Genel olarak profesyonel ve kapsayıcı ancak şu düzeltmeler gereklidir:

| Dosya | Tespit Edilen Durum | Çözüm |
| :--- | :--- | :--- |
| **İletişim E-postası** | `mertcabtacyldz@gmail.com` olarak yazılmış. | `mertcantacyldz@gmail.com` olarak düzeltilmeli. |
| **Yargı Yetkisi** | `[Your Jurisdiction]` yer tutucusu duruyor. | `Turkey / Istanbul` gibi gerçek bir bölge yazılmalı. |
| **Dil Uyumluluğu** | Uygulama Türkçe/İngilizce ancak yasal metinler sadece İngilizce. | Apple Türkiye App Store için bu metinlerin Türkçe çevirilerini de eklemenizi isteyebilir. |
| **Face Mesh** | ✅ Mevcut | Yüz verilerinin cihazda işlendiği bilgisi doğru şekilde eklenmiş. |
| **Egzersiz Uyarısı** | ✅ Mevcut | Egzersizlerin tıbbi tavsiye olmadığı uyarısı eklenmiş. |

---

---

## 4. Kullanıcı Deneyimi (UX) ve Yasal Koruma Dengesi

Kullanıcıyı korkutmadan, hem Apple'ı hem de hukuki süreçleri tatmin edecek "ince" dokunuşlar önerilir:

| Konu | Strateji | Önerilen Aksiyon |
| :--- | :--- | :--- |
| **Yapay Zeka Hataları** | "AI hata yapabilir" yerine "En iyi sonuç için ışık ve açıya dikkat edin" denmeli. | Fotoğraf çekme modalındaki "İpuçları" kısmına eklenmeli. |
| **Egzersiz Kesinliği** | Mevcut "Rehber" modalındaki uyarı yeterli ve profesyonel. | Ana akışa ekstra korkutucu metin eklemeye gerek yok. |
| **Veri Doğruluğu** | "Veri yanlış olabilir" yerine "Analiz, MediaPipe tarafından sağlanan anlık veriye dayalıdır" denmeli. | Mevcut `aiDisclaimer` metni hafifçe güncellenmeli. |
| **Hukuki Kalkan** | Apple için "Eğlence ve bilgilendirme amaçlıdır" ibaresi kritik. | Analiz sonuçlarının altına küçük puntolu olarak eklenmeli. |

---

## 5. Manuel Kontrol Listesi (Sizin Yapmanız Gerekenler)

Apple'ın manuel olarak inceleyeceği ve bizim kodla otomatik düzeltemeyeceğimiz noktalar:

- [ ] **Ekran Görüntüleri**: App Store Connect üzerinde her iPhone boyutu için (6.5", 5.5") uygun ekran görüntüleri yüklenmelidir.
- [ ] **Support URL**: Uygulama için bir destek URL'si sağlanmalıdır.
- [ ] **Data Safety**: App Store Connect'teki anket doldurulurken "Yüz Verisi" topladığınızı (Face Mesh kullanımı nedeniyle) belirtmelisiniz. Apple, bu verinin cihazda mı işlendiğini yoksa sunucuya mı gittiğini soracaktır.
- [ ] **Restore Testing**: Sandbox ortamında "Restore Purchases" butonunun gerçekten çalışıp çalışmadığı test edilmelidir.
- [ ] **Disclaimer**: Yüz analizi sonuçlarının "tıbbi tavsiye niteliği taşımadığına" dair uygulama içinde bir uyarı olmalıdır (Mevcut kodda `disclaimer` var, bu iyi).

---

## 4. Önerilen Çözüm Yolları

### Seçenek A: Minimum Hızlı Düzeltme
Sadece `app.json` ve `paywall.tsx` dosyalarına gerekli teknik alanları ve linkleri eklemek. Bu gönderim için "olmazsa olmaz" kısımdır.

### Seçenek B: Tam Hazırlık
Uygulama ikonlarının (1024x1024) kalitesini kontrol etmek, tüm diller için (TR/EN) App Store metadata açıklamalarını hazırlamak ve IAP akışını gerçek bir cihazda test etmek.

---

> [!TIP]
> **ÖNEMLİ:** Uygulamanız AI tabanlı olduğu için Apple, "yüz verilerinin saklanıp saklanmadığını" ve "ne amaçla kullanıldığını" detaylıca sorabilir. Gizlilik politikanızda "Yüz verileri sadece analiz için cihazda/anlık işlenir, sunucularımızda saklanmaz" (veya işleyişiniz nasılsa) ibaresini mutlaka geçirin.
