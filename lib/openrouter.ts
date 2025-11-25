/**
 * OpenRouter API Client
 * Handles communication with OpenRouter API for AI-powered face analysis
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

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
  landmarks: Array<{ x: number; y: number; z: number; index: number }>;
  region: 'eyebrows' | 'eyes' | 'nose' | 'lips' | 'jawline' | 'face_shape';
  customPrompt: string;
}

export interface FaceAnalysisResponse {
  success: boolean;
  analysis?: string;
  error?: string;
  tokens_used?: number;
}

/**
 * Analyzes facial features using OpenRouter API with Gemini 2.0 Flash model
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

    // Prepare the system prompt
    const systemPrompt = `Sen bir yüz analizi uzmanısın. MediaPipe Face Mesh tarafından tespit edilen 468 yüz noktası verisini analiz ediyorsun.
Kullanıcı dostu, pozitif ve detaylı analizler yapıyorsun. Cevaplarını Türkçe olarak veriyorsun.
Teknik terimler yerine anlaşılır bir dil kullanıyorsun.`;

    // Prepare the user prompt with landmarks data
    const userPrompt = `Aşağıda MediaPipe Face Mesh tarafından tespit edilen 468 yüz noktası verisi bulunmaktadır:

${JSON.stringify(request.landmarks, null, 2)}

${request.customPrompt}

Lütfen detaylı ve kullanıcı dostu bir analiz yap. Sonucu düzenli paragraflar halinde sun.`;

    const requestBody: OpenRouterRequest = {
      model: 'google/gemini-2.0-flash-exp:free',
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
      max_tokens: 1000,
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://face-scanning-app.com', // Optional: your app URL
        'X-Title': 'Face Scanning App', // Optional: your app name
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API error: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI model');
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
          : 'Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.',
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
