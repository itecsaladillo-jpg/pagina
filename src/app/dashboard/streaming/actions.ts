'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

export interface StreamingStatus {
  isActive: boolean
  youtubeUrl: string | null
}

/**
 * Obtiene el estado actual del streaming.
 */
export async function getStreamingStatus(): Promise<StreamingStatus> {
  try {
    const supabase = await createClient()

    const [activeResult, urlResult] = await Promise.all([
      supabase.from('site_settings').select('value').eq('key', 'streaming_active').single(),
      supabase.from('site_settings').select('value').eq('key', 'streaming_youtube_url').single(),
    ])

    const isActive = activeResult.data?.value === 'true'
    const youtubeUrl = urlResult.data?.value || null

    return { isActive, youtubeUrl }
  } catch {
    return { isActive: false, youtubeUrl: null }
  }
}

/**
 * Activa o desactiva el streaming en vivo.
 */
export async function toggleStreamingAction(isActive: boolean) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key: 'streaming_active',
        value: isActive ? 'true' : 'false',
      },
      { onConflict: 'key' }
    )

  if (error) {
    console.error('[toggleStreamingAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/streaming')
  revalidatePath('/')
  return { success: true }
}

/**
 * Actualiza la URL de YouTube para el streaming.
 */
export async function updateStreamingUrlAction(youtubeUrl: string) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('site_settings')
    .upsert(
      {
        key: 'streaming_youtube_url',
        value: youtubeUrl,
      },
      { onConflict: 'key' }
    )

  if (error) {
    console.error('[updateStreamingUrlAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/streaming')
  return { success: true }
}
