/**
 * OpenRouter API Client
 * Handles communication with OpenRouter API for AI-powered face analysis
 */

// Güncellendi: Daha hızlı TTFT ve daha yüksek kalite sunan Gemini 2.0 Flash Experimental modeline geçildi.
const OPENROUTER_MODEL_TWO = 'meta-llama/llama-3.3-70b-instruct:free';
const OPENROUTER_MODEL = 'google/gemini-2.0-flash-exp:free';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 3; // Maksimum deneme sayısı
const INITIAL_BACKOFF_MS = 1000; // İlk gecikme süresi (1 saniye)

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface FaceAnalysisRequest {
  landmarks: { x: number; y: number; z: number; index: number }[];
  region: 'eyebrows' | 'eyes' | 'nose' | 'lips' | 'jawline' | 'face_shape';
  customPrompt: string;
  language?: 'en' | 'tr'; // Add language support
}

export interface FaceAnalysisResponse {
  success: boolean;
  analysis?: string;
  error?: string;
  tokens_used?: number;
}

/**
 * Exponential Backoff (Üstel Gecikmeli Yeniden Deneme) ile fetch isteği gönderir.
 * 429 veya 5xx hatası aldığında otomatik olarak bekleyip tekrar dener.
 * Bu, 429 hatalarını yönetmek için kritik bir yöntemdir.
 */
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      // Başarılı veya kalıcı (4xx) hata ise döngüyü sonlandır
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }

      // Hız Limiti (429) veya Sunucu Hatası (5xx) varsa bekle
      if (response.status === 429 || response.status >= 500) {
        if (i === retries - 1) {
          // Son deneme ise hata fırlat
          throw new Error(`OpenRouter API kalıcı hata: ${response.status} ${response.statusText}`);
        }

        const delay = INITIAL_BACKOFF_MS * Math.pow(2, i) + Math.random() * 1000;
        console.warn(
          `Hız limiti veya sunucu hatası (${response.status}). ${delay.toFixed(
            0
          )}ms bekleniyor (Deneme ${i + 1}/${MAX_RETRIES}).`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        // Diğer hatalar için (401, 403, vs.) direkt geri dön
        return response;
      }
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, i) + Math.random() * 1000;
      console.error(`Ağ hatası, ${delay.toFixed(0)}ms bekleniyor (Deneme ${i + 1}/${MAX_RETRIES}).`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  // Bu satıra asla ulaşılmamalı
  throw new Error('Tüm yeniden deneme girişimleri başarısız oldu.');
}

/**
 * Analyzes facial features using OpenRouter API with a stable and high-context Gemini model
 * @param request - Face analysis request with landmarks and region
 * @returns Analysis result from AI
 */
export async function analyzeFaceRegion(
  request: FaceAnalysisRequest
): Promise<FaceAnalysisResponse> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OpenRouter API key not found. Please add EXPO_PUBLIC_OPENROUTER_API_KEY to your .env file'
      );
    }

    // Determine language (default to English)
    const language = request.language || 'en';
    const languageName = language === 'tr' ? 'TURKISH (Türkçe)' : 'ENGLISH';

    // Prepare the system prompt with language instruction
    const systemPrompt = `You are a face analysis expert. You analyze 468 facial landmark data detected by MediaPipe Face Mesh.
You provide user-friendly, positive, and detailed analyses.

📍 COORDINATE SYSTEM (CRITICAL):
- Unit: Pixels (NOT normalized 0-1 values)
- Canvas: 512x512 square
- Range: x and y coordinates are 0 to 512
- Origin: Top-left corner (0,0)
- Format: {x: float, y: float, z: float, index: int}
⚠️ DO NOT assume normalized coordinates!
⚠️ DO NOT multiply by 100 for "mm conversion" - already pixels!

📊 SCORING SCALE (0-10):
- 0-2: Excellent symmetry (diff <2px) → NONE asymmetry
- 3-4: Good symmetry (minor diff) → MILD asymmetry
- 5-6: Moderate asymmetry (noticeable) → MODERATE
- 7-10: Significant asymmetry → SEVERE

✅ MATH VERIFICATION:
Show calculation steps for every measurement.
Example: LEFT = 95.67 - 23.45 = 72.22 ✓

CRITICAL LANGUAGE INSTRUCTION:
- You MUST respond in ${languageName} language ONLY
- All analysis text, descriptions, and recommendations must be in ${languageName}
- Use simple, understandable language instead of technical terms
- JSON structure remains the same, only the content language changes

CRITICAL JSON INSTRUCTION:
- Values defined as 'number' in the schema must be plain numbers (e.g., 42.5), NOT formulas or strings (e.g., "40+2.5").
- Calculate all values internally before constructing the JSON.
- Do not output mathematical expressions like "(A - B) / C".`;

    // Prepare the user prompt with landmarks data
    const userPrompt = `Below is the 468 facial landmark data detected by MediaPipe Face Mesh:

${JSON.stringify(request.landmarks, null, 2)}

${request.customPrompt}

Please provide a detailed and user-friendly analysis. Present the results in well-organized paragraphs.`;

    // Kullanıcının isteği üzerine prompt içeriğini konsola yazdırıyoruz.
    console.log('--- Gönderilen System Prompt ---');
    console.log(systemPrompt);
    console.log('--- Gönderilen User Prompt ---');
    console.log(userPrompt);
    console.log('------------------------------');

    const requestBody: OpenRouterRequest = {
      // Daha stabil ve yüksek kapasiteli model kullanılıyor
      model: OPENROUTER_MODEL_TWO,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      // Çıktının kesilmesini önlemek ve yeterli uzunluk sağlamak için 4096 (4K) olarak ayarlandı
      max_tokens: 4096,
    };

    const response = await fetchWithBackoff(OPENROUTER_API_URL, { // Yeni, geri çekilmeli fetch fonksiyonu kullanılıyor
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://face-scanning-app.com', // Optional: your app URL
        'X-Title': 'FaceLoom', // Optional: your app name
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Hata mesajını daha anlaşılır hale getirelim
      throw new Error(
        `OpenRouter API Hatası: ${response.status} - ${errorData.error?.message || response.statusText
        }. (Not: Uzun promptlarda 429 alırsanız, lütfen 30 saniye bekleyip tekrar deneyin.)`
      );
    }

    const data: OpenRouterResponse = await response.json();
    console.log('OpenRouter API Yanıtı:', data);

    if (!data.choices || data.choices.length === 0) {
      throw new Error('AI modelinden yanıt alınamadı.');
    }

    return {
      success: true,
      analysis: data.choices[0].message.content,
      tokens_used: data.usage?.total_tokens,
    };
  } catch (error) {
    console.error('OpenRouter API Error:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Analiz sırasında beklenmedik bir hata oluştu. Lütfen tekrar deneyin.',
    };
  }
}

/**
 * Validates if the API key is configured
 * @returns true if API key exists
 */
export function isOpenRouterConfigured(): boolean {
  return !!process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
}