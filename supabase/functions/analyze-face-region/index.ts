import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = 'deepseek/deepseek-v3.2'
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 1000

// Note: Quota limits are handled on the frontend
// Backend only proxies OpenRouter API calls for security

interface RequestBody {
  landmarks: { x: number; y: number; z: number; index: number }[]
  region: 'eyebrows' | 'eyes' | 'nose' | 'lips' | 'jawline' | 'face_shape'
  customPrompt: string
  language?: 'en' | 'tr'
  gender?: 'female' | 'male' | 'other' | null
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  temperature?: number
  max_tokens?: number
}

interface OpenRouterResponse {
  id: string
  choices: {
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Exponential backoff fetch for handling 429 and 5xx errors
 */
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)

      // Success or permanent client error (not 429)
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response
      }

      // Rate limit or server error - retry
      if (response.status === 429 || response.status >= 500) {
        if (i === retries - 1) {
          throw new Error(`OpenRouter API persistent error: ${response.status} ${response.statusText}`)
        }

        const delay = INITIAL_BACKOFF_MS * Math.pow(2, i) + Math.random() * 1000
        console.warn(`Rate limit or server error (${response.status}). Waiting ${delay.toFixed(0)}ms (Attempt ${i + 1}/${MAX_RETRIES})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        return response
      }
    } catch (error) {
      if (i === retries - 1) {
        throw error
      }
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, i) + Math.random() * 1000
      console.error(`Network error, waiting ${delay.toFixed(0)}ms (Attempt ${i + 1}/${MAX_RETRIES})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw new Error('All retry attempts failed')
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Parse request body
    const body: RequestBody = await req.json()
    const { landmarks, region, customPrompt, language = 'en', gender = null } = body

    // Validate required fields
    if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or missing landmarks data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!region || !['eyebrows', 'eyes', 'nose', 'lips', 'jawline', 'face_shape'].includes(region)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or missing region parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!customPrompt || typeof customPrompt !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or missing customPrompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')

    if (!openRouterApiKey) {
      console.error('OPENROUTER_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error: API key missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ OPENROUTER_API_KEY is configured')
    console.log('API Key prefix:', openRouterApiKey.substring(0, 10) + '...')

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 3. Authenticate user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ User authenticated: ${user.id}`)

    // Note: Quota checking is handled on the frontend via usePremium hook
    // Backend only validates authentication and proxies the API call

    // 6. Prepare OpenRouter API request
    const languageName = language === 'tr' ? 'TURKISH (Türkçe)' : 'ENGLISH'

    let genderContext = ''
    if (gender === 'female') {
      genderContext = `
🎀 USER GENDER: FEMALE
- Provide beauty recommendations suitable for women (e.g., makeup tips, hairstyle suggestions like bangs, eyebrow shaping)
- Use feminine-appropriate grooming advice
- Example: "Consider getting bangs to complement your face shape"`
    } else if (gender === 'male') {
      genderContext = `
👔 USER GENDER: MALE
- Provide grooming recommendations suitable for men (e.g., beard styles, facial hair grooming, haircut suggestions)
- Use masculine-appropriate advice
- Example: "You might try growing a beard to enhance your jawline"`
    } else if (gender === 'other') {
      genderContext = `
✨ USER GENDER: OTHER/PREFER NOT TO SAY
- Provide gender-neutral recommendations (e.g., skincare, facial exercises, symmetry improvement)
- Avoid gender-specific grooming suggestions (no beard/makeup advice)
- Focus on universal beauty and health tips`
    } else {
      genderContext = `
⚪ USER GENDER: NOT PROVIDED
- Provide general, gender-neutral recommendations
- Focus on facial symmetry, skin health, and universal grooming tips`
    }

    const systemPrompt = const systemPrompt = `You are an expert facial landmark analyst using MediaPipe Face Mesh data.

═══════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════

1. OUTPUT FORMAT
   - Return ONLY valid JSON (no markdown, no code blocks, no explanations)
   - Response must start with { and end with }
   - All numeric fields must contain actual numbers, NOT formulas or strings

2. COORDINATE SYSTEM
   - Canvas: 1024x1024 pixels
   - Origin: Top-left (0,0)
   - Coordinates are already in pixels (DO NOT multiply by 100)
   - Format: {x: float, y: float, z: float, index: int}

3. SCORING (0-10 scale, higher = better)
   - Use EXACT formulas from customPrompt
   - Calculate weighted average correctly
   - DO NOT inflate scores to be encouraging
   - Round final score to nearest integer

4. LANGUAGE
   - Respond in ${languageName} for ALL text content
   - Use simple, non-technical language
   - JSON structure stays the same

${genderContext}

═══════════════════════════════════════════
SCORING ACCURACY REQUIREMENTS
═══════════════════════════════════════════

✅ CORRECT PROCESS:
1. Calculate all sub-scores using formulas
2. Apply weighted average formula
3. Round to nearest integer
4. Use that score as final result

❌ FORBIDDEN:
- Changing calculated score to "be positive"
- Giving 10/10 when sub-scores are 7-8
- Using words that don't match the actual score

SCORE → LANGUAGE MAPPING:
- 9-10: "excellent", "outstanding", "minimal asymmetry"
- 7-8: "good", "minor variation"
- 5-6: "moderate", "noticeable asymmetry"
- 3-4: "significant", "considerable asymmetry"
- 0-2: "severe", "major asymmetry"

═══════════════════════════════════════════
TRUTHFULNESS IN EXPLANATIONS
═══════════════════════════════════════════

Your text MUST match your calculations:

✅ CORRECT:
- Calculated deviation = 11.58px
- Text: "There is 11.58 pixels asymmetry"

❌ WRONG:
- Calculated deviation = 11.58px
- Text: "Perfectly centered with no asymmetry"

If you calculated a non-zero difference, DO NOT write "perfectly symmetrical".
If score is 7/10, DO NOT use words like "exceptional" or "perfect".

═══════════════════════════════════════════
USER EXPLANATION REQUIREMENTS
═══════════════════════════════════════════

Every "user_explanation" field must:
1. Reference specific measurements from that section
2. Explain what those numbers mean
3. Be 2-3 sentences in plain language
4. Be written in ${languageName}

Example:
❌ BAD: "Your eyebrows look good"
✅ GOOD: "Left eyebrow thickness is 18%, right is 19%. The 1% difference shows excellent symmetry."

═══════════════════════════════════════════
CALCULATION VERIFICATION
═══════════════════════════════════════════

Show your work for key measurements:
- LEFT_WIDTH = P_X.x - P_Y.x = 45.2 - 12.8 = 32.4 ✓
- SCORE = (8×0.5) + (7×0.3) + (9×0.2) = 4.0 + 2.1 + 1.8 = 7.9 → round(7.9) = 8 ✓

This helps you avoid calculation errors.`;

// ============================================
// OPTIMIZED USER PROMPT
// ============================================

   const userPrompt = `Analyze these 468 MediaPipe Face Mesh landmarks:

${JSON.stringify(landmarks, null, 2)}

${customPrompt}

Please provide a detailed and user-friendly analysis. Present the results in well-organized paragraphs.`

    console.log('--- Sending request to OpenRouter ---')
    console.log('Model:', OPENROUTER_MODEL)
    console.log('Language:', language)
    console.log('Region:', region)

    const requestBody: OpenRouterRequest = {
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,  // Reduced from 4096 to avoid credit issues
    }

    // 7. Call OpenRouter API
    const response = await fetchWithBackoff(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://face-scanning-app.com',
        'X-Title': 'FaceLoom',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenRouter API error:', errorData)
      return new Response(
        JSON.stringify({
          success: false,
          error: `OpenRouter API Error: ${response.status} - ${errorData.error?.message || response.statusText}`,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data: OpenRouterResponse = await response.json()
    console.log('✅ OpenRouter API response received')

    if (!data.choices || data.choices.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No response from AI model' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 8. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        analysis: data.choices[0].message.content,
        tokens_used: data.usage?.total_tokens,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
