import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * POST /api/streaming/seed
 * Inserta los valores iniciales de streaming en site_settings.
 * Solo para uso temporal durante setup inicial.
 */
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const results = await Promise.allSettled([
      supabase.from('site_settings').upsert(
        { key: 'streaming_active', value: 'false' },
        { onConflict: 'key' }
      ),
      supabase.from('site_settings').upsert(
        { key: 'streaming_youtube_url', value: '' },
        { onConflict: 'key' }
      ),
    ])

    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => r.reason?.message || String(r.reason))

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Partial failure', details: errors }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Streaming settings seeded' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
