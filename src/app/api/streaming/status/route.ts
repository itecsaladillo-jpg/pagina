import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractYouTubeId } from '@/lib/youtube'

export const revalidate = 10

/**
 * GET /api/streaming/status
 * Retorna el estado actual del streaming (público, lectura anónima).
 * Cache: 10 segundos
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
      return NextResponse.json(
        { isActive: false, streaming_enabled: false, youtubeUrl: null, videoId: null, isValid: false },
        { status: 200 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Intentar leer desde streaming_config
    const { data: configData, error: configError } = await supabase
      .from('streaming_config')
      .select('streaming_enabled, youtube_url')
      .eq('id', 'default')
      .maybeSingle()

    let isActive = false
    let youtubeUrl: string | null = null

    if (!configError && configData) {
      isActive = Boolean(configData.streaming_enabled)
      youtubeUrl = configData.youtube_url ? configData.youtube_url.trim() : null
    } else {
      // 2. Fallback hacia api_settings o site_settings
      const [activeResult, urlResult] = await Promise.all([
        supabase.from('api_settings').select('value').eq('key', 'streaming_active').maybeSingle(),
        supabase.from('api_settings').select('value').eq('key', 'streaming_youtube_url').maybeSingle(),
      ])

      isActive = activeResult.data?.value === 'true'
      youtubeUrl = urlResult.data?.value ? urlResult.data.value.trim() : null
    }

    const videoId = extractYouTubeId(youtubeUrl)

    const response = NextResponse.json({
      isActive,
      streaming_enabled: isActive,
      youtubeUrl,
      videoId,
      isValid: Boolean(videoId),
    })

    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30')
    return response
  } catch (error) {
    console.error('[/api/streaming/status] Error:', error)
    return NextResponse.json(
      { isActive: false, streaming_enabled: false, youtubeUrl: null, videoId: null, isValid: false },
      { status: 200 }
    )
  }
}
