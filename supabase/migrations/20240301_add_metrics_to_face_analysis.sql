-- KVKK Uyumluluğu: face_analysis Tablosu Güncellemesi
-- Bu script: 
-- 1. 'metrics' adında bir JSONB kolonu ekler.
-- 2. 'landmarks' kolonunu opsiyonel (NULLABLE) hale getirir.

-- 1. 'metrics' kolonunu ekle (varsayılan boş obje)
ALTER TABLE face_analysis 
ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}'::jsonb;

-- 2. 'landmarks' kolonunu NULLABLE yap
ALTER TABLE face_analysis 
ALTER COLUMN landmarks DROP NOT NULL;

-- 3. İndeks ekle (Performans için)
CREATE INDEX IF NOT EXISTS idx_face_analysis_metrics ON face_analysis USING gin (metrics);

-- Açıklama:
COMMENT ON COLUMN face_analysis.metrics IS 'Bölgesel yüz metrikleri (burun, göz vb. sayısal oranlar). Ham landmarklar yerine bu veri kullanılır.';
COMMENT ON COLUMN face_analysis.landmarks IS 'DEPRECATED: Ham landmark verisi. KVKK uyumu için yeni kayıtlarda boş bırakılmalıdır.';

-- KONTROL SORGUSU:
-- SELECT id, landmarks, metrics FROM face_analysis LIMIT 5;
