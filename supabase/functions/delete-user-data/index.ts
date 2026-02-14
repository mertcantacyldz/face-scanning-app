import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * delete-user-data Edge Function
 * 
 * Kullanıcının tüm verilerini FK bağımlılık sırasına uygun şekilde siler
 * ve ardından auth.users kaydını kaldırır.
 * 
 * Silme sırası (FK constraint'lere uygun):
 * 1. region_analysis   (face_analysis_id FK)
 * 2. face_analysis
 * 3. exercise_completions
 * 4. device_users
 * 5. profiles
 * 6. auth.admin.deleteUser()
 */

interface DeletionStep {
    table: string
    count: number
    success: boolean
    error?: string
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Initialize Supabase Admin Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        })

        // 2. Authenticate user from JWT
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

        const userId = user.id
        console.log(`🗑️ Starting data deletion for user: ${userId}`)

        const steps: DeletionStep[] = []

        // 3. Delete in FK-safe order

        // Step 1: region_analysis (depends on face_analysis via face_analysis_id FK)
        try {
            const { data, error } = await supabaseAdmin
                .from('region_analysis')
                .delete()
                .eq('user_id', userId)
                .select('id')

            steps.push({
                table: 'region_analysis',
                count: data?.length ?? 0,
                success: !error,
                error: error?.message,
            })

            if (error) throw new Error(`region_analysis: ${error.message}`)
            console.log(`  ✅ region_analysis: ${data?.length ?? 0} rows deleted`)
        } catch (e) {
            console.error(`  ❌ region_analysis deletion failed:`, e)
            // Continue with other deletions even if one fails
        }

        // Step 2: face_analysis
        try {
            const { data, error } = await supabaseAdmin
                .from('face_analysis')
                .delete()
                .eq('user_id', userId)
                .select('id')

            steps.push({
                table: 'face_analysis',
                count: data?.length ?? 0,
                success: !error,
                error: error?.message,
            })

            if (error) throw new Error(`face_analysis: ${error.message}`)
            console.log(`  ✅ face_analysis: ${data?.length ?? 0} rows deleted`)
        } catch (e) {
            console.error(`  ❌ face_analysis deletion failed:`, e)
        }

        // Step 3: exercise_completions
        try {
            const { data, error } = await supabaseAdmin
                .from('exercise_completions')
                .delete()
                .eq('user_id', userId)
                .select('id')

            steps.push({
                table: 'exercise_completions',
                count: data?.length ?? 0,
                success: !error,
                error: error?.message,
            })

            if (error) throw new Error(`exercise_completions: ${error.message}`)
            console.log(`  ✅ exercise_completions: ${data?.length ?? 0} rows deleted`)
        } catch (e) {
            console.error(`  ❌ exercise_completions deletion failed:`, e)
        }

        // Step 4: device_users
        try {
            const { data, error } = await supabaseAdmin
                .from('device_users')
                .delete()
                .eq('supabase_user_id', userId)
                .select('id')

            steps.push({
                table: 'device_users',
                count: data?.length ?? 0,
                success: !error,
                error: error?.message,
            })

            if (error) throw new Error(`device_users: ${error.message}`)
            console.log(`  ✅ device_users: ${data?.length ?? 0} rows deleted`)
        } catch (e) {
            console.error(`  ❌ device_users deletion failed:`, e)
        }

        // Step 5: profiles
        try {
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('user_id', userId)
                .select('user_id')

            steps.push({
                table: 'profiles',
                count: data?.length ?? 0,
                success: !error,
                error: error?.message,
            })

            if (error) throw new Error(`profiles: ${error.message}`)
            console.log(`  ✅ profiles: ${data?.length ?? 0} rows deleted`)
        } catch (e) {
            console.error(`  ❌ profiles deletion failed:`, e)
        }

        // Step 6: Delete auth user
        try {
            const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

            steps.push({
                table: 'auth.users',
                count: error ? 0 : 1,
                success: !error,
                error: error?.message,
            })

            if (error) throw new Error(`auth.users: ${error.message}`)
            console.log(`  ✅ auth.users: user deleted`)
        } catch (e) {
            console.error(`  ❌ auth.users deletion failed:`, e)
        }

        // 4. Check results
        const allSuccess = steps.every(s => s.success)
        const failedSteps = steps.filter(s => !s.success)

        if (allSuccess) {
            console.log(`🎉 All data deleted successfully for user: ${userId}`)
        } else {
            console.warn(`⚠️ Partial deletion for user ${userId}. Failed steps:`, failedSteps)
        }

        return new Response(
            JSON.stringify({
                success: allSuccess,
                steps,
                ...(failedSteps.length > 0 && {
                    warning: 'Some data could not be deleted. Please contact support.',
                    failedTables: failedSteps.map(s => s.table),
                }),
            }),
            {
                status: allSuccess ? 200 : 207, // 207 Multi-Status for partial success
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
