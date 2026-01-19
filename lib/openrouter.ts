/**
 * OpenRouter API Client (via Supabase Edge Function)
 * Securely handles communication with OpenRouter API for AI-powered face analysis
 *
 * IMPORTANT: API calls now go through Supabase Edge Function for security
 * - API key is stored server-side (not exposed in client code)
 * - Quota enforcement (free users: 1 lifetime, premium: unlimited)
 * - User authentication via Supabase JWT
 */

import { supabase } from './supabase';

export interface FaceAnalysisRequest {
  landmarks: { x: number; y: number; z: number; index: number }[];
  region: 'eyebrows' | 'eyes' | 'nose' | 'lips' | 'jawline' | 'face_shape';
  customPrompt: string;
  language?: 'en' | 'tr';
  gender?: 'female' | 'male' | 'other' | null;
}

export interface FaceAnalysisResponse {
  success: boolean;
  analysis?: string;
  error?: string;
  details?: string; // Additional error details from Edge Function
  tokens_used?: number;
}

/**
 * Analyzes facial features using OpenRouter API via Supabase Edge Function
 * @param request - Face analysis request with landmarks and region
 * @returns Analysis result from AI
 */
export async function analyzeFaceRegion(
  request: FaceAnalysisRequest
): Promise<FaceAnalysisResponse> {
  try {
    console.log('🚀 Calling Supabase Edge Function: analyze-face-region');
    console.log('Region:', request.region);
    console.log('Language:', request.language || 'en');

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return {
        success: false,
        error: request.language === 'tr'
          ? 'Oturum bulunamadı. Lütfen tekrar giriş yapın.'
          : 'Session not found. Please log in again.',
      };
    }

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-face-region', {
      body: {
        landmarks: request.landmarks,
        region: request.region,
        customPrompt: request.customPrompt,
        language: request.language || 'en',
        gender: request.gender || null,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);

      // Handle specific error cases
      if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
        return {
          success: false,
          error: request.language === 'tr'
            ? 'Analiz limitinize ulaştınız. Premium üyelik ile sınırsız analiz yapabilirsiniz.'
            : 'You have reached your analysis limit. Upgrade to Premium for unlimited analyses.',
        };
      }

      return {
        success: false,
        error: request.language === 'tr'
          ? `Analiz sırasında hata oluştu: ${error.message}`
          : `Analysis error: ${error.message}`,
        details: data?.details, // Include details from Edge Function error response
      };
    }

    // Success response
    if (data && data.success) {
      console.log('✅ Analysis completed successfully');
      console.log('Tokens used:', data.tokens_used);

      return {
        success: true,
        analysis: data.analysis,
        tokens_used: data.tokens_used,
      };
    }

    // Unexpected response format
    return {
      success: false,
      error: request.language === 'tr'
        ? 'Beklenmeyen yanıt formatı.'
        : 'Unexpected response format.',
    };
  } catch (error) {
    console.error('OpenRouter API Error (via Edge Function):', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : (request.language === 'tr'
            ? 'Analiz sırasında beklenmedik bir hata oluştu. Lütfen tekrar deneyin.'
            : 'An unexpected error occurred during analysis. Please try again.'),
    };
  }
}

/**
 * Validates if the Edge Function is accessible
 * @returns true if Supabase client is configured
 */
export function isOpenRouterConfigured(): boolean {
  // Check if Supabase is initialized (Edge Function access depends on this)
  return !!supabase;
}
