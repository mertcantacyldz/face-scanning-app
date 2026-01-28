import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODEL = 'google/gemini-2.5-flash-lite'
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 1000

// Note: Quota limits are handled on the frontend
// Backend only proxies OpenRouter API calls for security

interface RequestBody {
  landmarks?: { x: number; y: number; z: number; index: number }[] // Optional - metrics now pre-calculated
  region: 'eyebrows' | 'eyes' | 'nose' | 'lips' | 'jawline' /* | 'face_shape' */
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
    const { region, customPrompt, language = 'en', gender = null } = body

    // Validate required fields
    // Note: landmarks validation removed - metrics are now pre-calculated and passed via customPrompt
    // if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
    //   return new Response(
    //     JSON.stringify({ success: false, error: 'Invalid or missing landmarks data' }),
    //     { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //   )
    // }

    if (!region || !['eyebrows', 'eyes', 'nose', 'lips', 'jawline' /*, 'face_shape' */].includes(region)) {
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

    // Gender-specific recommendation templates
    let genderContext = ''
    let genderRecommendations = ''

    if (gender === 'female') {
      genderContext = `USER GENDER: FEMALE`
      genderRecommendations = `
FEMALE-SPECIFIC RECOMMENDATIONS (suggest these in user's language):
- Eyebrows: Threading, microblading, brow lamination
- Eyes: Eye makeup techniques, lash lifting, eye cream
- Nose: Contouring makeup, highlighter techniques
- Lips: Lipstick techniques, lip liner, lip care
- Jawline: Contouring, bronzer, face yoga`
    } else if (gender === 'male') {
      genderContext = `USER GENDER: MALE`
      genderRecommendations = `
MALE-SPECIFIC RECOMMENDATIONS (suggest these in user's language):
- Eyebrows: Natural grooming, excess hair removal
- Eyes: Eye area care, sleep routine, cold compress
- Nose: Facial exercises, skincare
- Lips: Lip moisturizer, SPF protection
- Jawline: Beard shaping, jaw exercises, facial massage`
    } else {
      genderContext = `USER GENDER: NOT SPECIFIED`
      genderRecommendations = `
GENDER-NEUTRAL RECOMMENDATIONS (suggest these in user's language):
- Focus on skincare, facial exercises, and symmetry improvement
- Suggest universal beauty and health tips
- Avoid gender-specific grooming suggestions`
    }

    const systemPrompt = `You are an expert facial analysis interpreter.

═══════════════════════════════════════════
ROLE & COMMUNICATION STYLE
═══════════════════════════════════════════

TONE:
- Friendly but professional
- Encouraging but honest
- Never use medical/technical jargon
- Never be negative or discouraging
- Always find something positive to say

LANGUAGE: Respond in ${languageName} for ALL text content.

${language === 'tr' ? `
═══════════════════════════════════════════
TÜRKÇE DİL KURALLARI (KRİTİK)
═══════════════════════════════════════════

Tüm kullanıcıya görünen metinler TÜRKÇE olmalı:
✓ headline, explanation, user_explanation → Türkçe
✓ primary_finding, quick_tip, recommendations → Türkçe
✓ key_metrics içindeki metinler → Türkçe
✓ assessment değerleri → Türkçe

YASAK İNGİLİZCE KELİMELER (kullanıcıya görünen alanlarda):
- "deviation" → "sapma" kullan
- "asymmetry" → "asimetri" kullan
- "difference" → "fark" kullan
- "pixels" → "piksel" kullan
- "degrees" → "derece" kullan
- "left/right" → "sol/sağ" kullan
- "score" → "puan" kullan
- "good/excellent" → "iyi/mükemmel" kullan
- "moderate" → "orta" kullan

NOT: JSON key'leri (overall_score, user_explanation vb.) İngilizce kalabilir - bunlar kod içindir.
` : ''}

${genderContext}

═══════════════════════════════════════════
PRE-CALCULATED SCORES (CRITICAL)
═══════════════════════════════════════════

All scores and measurements are PRE-CALCULATED by TypeScript.
DO NOT recalculate. DO NOT modify. DO NOT round.
COPY exact values into JSON output.

Your job is ONLY to:
1. INTERPRET what the measurements mean
2. EXPLAIN in user-friendly language
3. RECOMMEND appropriate actions
4. USE exact scores given (no changes)

═══════════════════════════════════════════
SCORE → LANGUAGE MAPPING (STRICT)
═══════════════════════════════════════════

Your words MUST match the provided score:

${language === 'tr' ? `
TÜRKÇE:
- 9-10: "mükemmel", "harika", "neredeyse hiç fark yok"
- 7-8: "iyi", "küçük varyasyon", "doğal görünüm"
- 5-6: "orta", "fark edilebilir", "iyileştirilebilir"
- 3-4: "belirgin", "dikkat çekici"
- 0-4: "profesyonel değerlendirme önerilir"` : `
ENGLISH:
- 9-10: "excellent", "outstanding", "minimal variation"
- 7-8: "good", "minor variation", "natural appearance"
- 5-6: "moderate", "noticeable", "improvable"
- 3-4: "significant", "considerable"
- 0-4: "professional evaluation recommended"`}

❌ FORBIDDEN:
- Score 7 + "mükemmel/perfect" (exaggeration)
- Score 8 + "ciddi/severe" (understatement)
- Any score + "perfect symmetry" (nobody is perfect)
- Rounding numbers (5.23 → 5)

═══════════════════════════════════════════
NUMBER FORMAT (STRICT)
═══════════════════════════════════════════

✅ CORRECT:
- "5.23 piksel sapma" (exact decimal)
- "%12.45 asimetri" (with % symbol)
- "3.7° açı farkı" (with degree symbol)

❌ FORBIDDEN:
- "5 piksel" (rounded)
- "yaklaşık 5" (approximate)
- "~12%" (tilde approximation)
- Changing any provided number

═══════════════════════════════════════════
EXPLANATION REQUIREMENTS
═══════════════════════════════════════════

Every "user_explanation" field must:
1. Reference EXACT numbers from the metrics
2. Be 2-3 sentences maximum
3. Include real-world context (what does this mean practically?)
4. Be encouraging even for low scores

${language === 'tr' ? `
GOOD EXAMPLE (TR):
"Sol kaşınız sağa göre 3.2 piksel daha yüksek - bu, gülümserken bile fark edilmeyecek kadar küçük bir fark. Doğal ve dengeli bir görünümünüz var."

BAD EXAMPLE:
"Kaşlarınızda asimetri var." (no numbers, no context, not encouraging)` : `
GOOD EXAMPLE (EN):
"Your left eyebrow is 3.2 pixels higher than the right - this is such a small difference that it's virtually invisible, even when smiling. You have a naturally balanced appearance."

BAD EXAMPLE:
"There is asymmetry in your eyebrows." (no numbers, no context, not encouraging)`}

═══════════════════════════════════════════
RECOMMENDATION RULES
═══════════════════════════════════════════

SCORE >= 7 (Maintenance Only):
- Focus on preserving current state
- Light care suggestions only
- "Mevcut durumunuzu korumak için..." / "To maintain your current..."

SCORE 5-6 (Improvement + Exercise):
- Non-invasive options (makeup, exercises)
- Always mention app exercises: ${language === 'tr'
        ? '"Uygulamamızdaki [bölge] egzersizlerini deneyebilirsiniz"'
        : '"Try the [region] exercises in our app"'}
- Be encouraging about improvement potential

SCORE < 5 (Professional Referral):
- Gently suggest professional consultation
- Still provide home care tips
- Be compassionate, not alarming
- ${language === 'tr'
        ? '"Bir uzmana danışmanız faydalı olabilir"'
        : '"Consulting a specialist might be helpful"'}

${genderRecommendations}

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════

- Return ONLY valid JSON
- Response must start with { and end with }
- No markdown, no code blocks, no extra text
- All text content in ${languageName}
- All numeric values EXACTLY as provided`;


    // ============================================
    // OPTIMIZED USER PROMPT
    // ============================================

    const userPrompt = `Analyze the facial metrics provided below.
Note: Landmarks are processed into these metrics for you.

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
