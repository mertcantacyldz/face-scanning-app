import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
    userId: string
    deviceId: string
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Parse request body
        const { userId, deviceId } = await req.json() as RequestBody

        if (!userId || !deviceId) {
            return new Response(
                JSON.stringify({ error: 'Missing userId or deviceId' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        console.log('📱 Session restore request:', { userId, deviceId })

        // 2. Initialize Supabase Admin Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })

        // 3. SECURITY: Verify device-user mapping
        const { data: deviceMapping, error: mappingError } = await supabaseAdmin
            .from('device_users')
            .select('supabase_user_id')
            .eq('device_id', deviceId)
            .eq('supabase_user_id', userId)
            .maybeSingle()

        if (mappingError) {
            console.error('❌ Error checking device mapping:', mappingError)
            return new Response(
                JSON.stringify({ error: 'Database error checking device mapping' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        if (!deviceMapping) {
            console.warn('⚠️ Security: Device ID not mapped to this user ID')
            return new Response(
                JSON.stringify({ error: 'Device not authorized for this user' }),
                {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        console.log('✅ Device mapping verified:', deviceMapping)

        // 4. Verify user exists and is anonymous
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

        if (userError || !userData.user) {
            console.error('❌ Error getting user:', userError)
            return new Response(
                JSON.stringify({ error: 'User not found' }),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        console.log('✅ User found:', {
            id: userData.user.id,
            isAnonymous: userData.user.is_anonymous
        })

        // 5. Generate new session using GoTrue REST API
        // admin.createSession is not available in this Supabase JS version
        // So we use the REST API directly
        const authUrl = `${supabaseUrl}/auth/v1/admin/generate_link`

        const generateLinkResponse = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
            },
            body: JSON.stringify({
                type: 'recovery',
                email: userData.user.email || `${userId}@temp.local`,
            }),
        })

        if (!generateLinkResponse.ok) {
            const errorText = await generateLinkResponse.text()
            console.error('❌ Error generating link:', errorText)
            return new Response(
                JSON.stringify({
                    error: 'Failed to generate session link',
                    details: errorText
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        const linkResult = await generateLinkResponse.json()
        console.log('✅ Link generated, extracting tokens...')

        // Extract access and refresh tokens from the URL
        const actionLink = linkResult.action_link || linkResult.properties?.action_link

        if (!actionLink) {
            console.error('❌ No action_link in response')
            return new Response(
                JSON.stringify({ error: 'No action link generated' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Parse tokens from URL hash
        const url = new URL(actionLink)
        const hash = url.hash.substring(1) // Remove #
        const params = new URLSearchParams(hash)

        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (!access_token || !refresh_token) {
            console.error('❌ Tokens not found in URL')
            return new Response(
                JSON.stringify({ error: 'Session tokens not available in link' }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        console.log('✅ Session tokens extracted successfully')

        // 6. Return session to client
        return new Response(
            JSON.stringify({
                session: {
                    access_token,
                    refresh_token,
                    user: userData.user,
                    expires_in: 3600,
                    expires_at: Math.floor(Date.now() / 1000) + 3600,
                },
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('❌ Unexpected error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})
