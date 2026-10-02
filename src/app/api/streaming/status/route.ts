import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractYouTubeId } from '@/lib/youtube'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/streaming/status
 * Retorna el estado actual del streaming en tiempo real (sin cache).
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
      return NextResponse.json(
        { isActive: false, streaming_enabled: false, youtubeUrl: null, videoId: null, isValid: false },
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    let isActive = false
    let youtubeUrl: string | null = null

    // 1. Intentar leer desde streaming_config
    try {
      const { data: configData, error: configError } = await supabase
        .from('streaming_config')
        .select('streaming_enabled, youtube_url')
        .eq('id', 'default')
        .maybeSingle()

      if (!configError && configData) {
        isActive = Boolean(configData.streaming_enabled)
        youtubeUrl = configData.youtube_url ? configData.youtube_url.trim() : null
      }
    } catch {
      // Continuar con fallback
    }

    // 2. Si no se obtuvo de streaming_config, consultar api_settings (con Service Role para saltar RLS)
    if (!isActive && !youtubeUrl) {
      try {
        const [activeRes, urlRes, enabledRes, genericUrlRes] = await Promise.all([
          supabase.from('api_settings').select('value').eq('key', 'streaming_active').maybeSingle(),
          supabase.from('api_settings').select('value').eq('key', 'streaming_youtube_url').maybeSingle(),
          supabase.from('api_settings').select('value').eq('key', 'streaming_enabled').maybeSingle(),
          supabase.from('api_settings').select('value').eq('key', 'youtube_url').maybeSingle(),
        ])

        const activeVal = enabledRes.data?.value || activeRes.data?.value
        const urlVal = urlRes.data?.value || genericUrlRes.data?.value

        isActive = activeVal === 'true'
        youtubeUrl = urlVal ? urlVal.trim() : null
      } catch (e) {
        console.warn('[/api/streaming/status] Error leyendo api_settings:', e)
      }
    }

    const videoId = extractYouTubeId(youtubeUrl)

    const response = NextResponse.json({
      isActive,
      streaming_enabled: isActive,
      youtubeUrl,
      videoId,
      isValid: Boolean(videoId),
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    return response
  } catch (error) {
    console.error('[/api/streaming/status] Error:', error)
    return NextResponse.json(
      { isActive: false, streaming_enabled: false, youtubeUrl: null, videoId: null, isValid: false },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    )
  }
}
