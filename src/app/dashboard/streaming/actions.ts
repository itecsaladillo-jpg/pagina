'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import { extractYouTubeId } from '@/lib/youtube'

export interface StreamingStatus {
  isActive: boolean
  streaming_enabled: boolean
  youtubeUrl: string
  videoId: string | null
}

/**
 * Obtiene el estado actual del streaming para el panel de administración.
 */
export async function getStreamingStatus(): Promise<StreamingStatus> {
  try {
    const supabase = await createClient()

    // 1. Intentar desde streaming_config
    const { data: configData, error: configError } = await supabase
      .from('streaming_config')
      .select('streaming_enabled, youtube_url')
      .eq('id', 'default')
      .maybeSingle()

    if (!configError && configData) {
      const isEnabled = Boolean(configData.streaming_enabled)
      const url = configData.youtube_url || ''
      return {
        isActive: isEnabled,
        streaming_enabled: isEnabled,
        youtubeUrl: url,
        videoId: extractYouTubeId(url),
      }
    }

    // 2. Fallback a api_settings
    const [activeResult, urlResult] = await Promise.all([
      supabase.from('api_settings').select('value').eq('key', 'streaming_active').maybeSingle(),
      supabase.from('api_settings').select('value').eq('key', 'streaming_youtube_url').maybeSingle(),
    ])

    const isActive = activeResult.data?.value === 'true'
    const url = urlResult.data?.value || ''

    return {
      isActive,
      streaming_enabled: isActive,
      youtubeUrl: url,
      videoId: extractYouTubeId(url),
    }
  } catch (err) {
    console.error('[getStreamingStatus] Error:', err)
    return {
      isActive: false,
      streaming_enabled: false,
      youtubeUrl: '',
      videoId: null,
    }
  }
}

/**
 * Guarda y actualiza de forma unificada y atómica la configuración de streaming.
 */
export async function saveStreamingConfigAction({
  streaming_enabled,
  youtube_url,
}: {
  streaming_enabled: boolean
  youtube_url: string
}) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No autorizado. Se requieren permisos de administrador o coordinador.' }
  }

  const cleanUrl = (youtube_url || '').trim()

  // Validación de YouTube ID si está activado
  if (streaming_enabled && cleanUrl) {
    const videoId = extractYouTubeId(cleanUrl)
    if (!videoId) {
      return {
        success: false,
        error: 'La URL ingresada no corresponde a un formato de video o transmisión de YouTube válido.',
      }
    }
  }

  const supabase = await createClient()

  // 1. Actualizar tabla principal streaming_config
  const { error: configError } = await supabase
    .from('streaming_config')
    .upsert(
      {
        id: 'default',
        streaming_enabled,
        youtube_url: cleanUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

  if (configError) {
    console.error('[saveStreamingConfigAction] Error en streaming_config:', configError.message)
    // Continuamos para intentar guardar en api_settings como fallback si la tabla aún no fue migrada
  }

  // 2. Sincronizar en api_settings para retrocompatibilidad
  try {
    await Promise.all([
      supabase.from('api_settings').upsert(
        { key: 'streaming_active', value: streaming_enabled ? 'true' : 'false' },
        { onConflict: 'key' }
      ),
      supabase.from('api_settings').upsert(
        { key: 'streaming_youtube_url', value: cleanUrl },
        { onConflict: 'key' }
      ),
    ])
  } catch (apiErr) {
    console.warn('[saveStreamingConfigAction] Warning sync api_settings:', apiErr)
  }

  revalidatePath('/dashboard/streaming')
  revalidatePath('/')
  return { success: true }
}

/**
 * Activa o desactiva el streaming en vivo.
 */
export async function toggleStreamingAction(isActive: boolean) {
  const current = await getStreamingStatus()
  return saveStreamingConfigAction({
    streaming_enabled: isActive,
    youtube_url: current.youtubeUrl,
  })
}

/**
 * Actualiza la URL de YouTube para el streaming.
 */
export async function updateStreamingUrlAction(youtubeUrl: string) {
  const current = await getStreamingStatus()
  return saveStreamingConfigAction({
    streaming_enabled: current.streaming_enabled,
    youtube_url: youtubeUrl,
  })
}
