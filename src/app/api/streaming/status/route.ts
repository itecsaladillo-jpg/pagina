import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * GET /api/streaming/status
 * Retorna el estado actual del streaming (público, sin auth).
 * Cache: 30 segundos
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { isActive: false, youtubeUrl: null },
        { status: 200 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const [activeResult, urlResult] = await Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'streaming_active').single(),
      supabase.from('site_settings').select('value').eq('key', 'streaming_youtube_url').single(),
    ])

    const isActive = activeResult.data?.value === 'true'
    const youtubeUrl = urlResult.data?.value || null

    const response = NextResponse.json({ isActive, youtubeUrl })
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')

    return response
  } catch {
    return NextResponse.json(
      { isActive: false, youtubeUrl: null },
      { status: 200 }
    )
  }
}
