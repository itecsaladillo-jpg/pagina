'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import { extractYouTubeId } from '@/lib/youtube'

export interface StreamingStatus {
  isActive: boolean
  streaming_enabled: boolean
  youtubeUrl: string
  videoId: string | null
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || !url.startsWith('http')) return null
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

/**
 * Obtiene el estado actual del streaming para el panel de administración.
 */
export async function getStreamingStatus(): Promise<StreamingStatus> {
  try {
    const adminSupabase = getServiceSupabase()
    const supabase = adminSupabase || (await createClient())

    // 1. Intentar desde streaming_config
    try {
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
    } catch {
      // Fallback a api_settings
    }

    // 2. Fallback a api_settings
    const [activeResult, urlResult, enabledResult, genericUrlResult] = await Promise.all([
      supabase.from('api_settings').select('value').eq('key', 'streaming_active').maybeSingle(),
      supabase.from('api_settings').select('value').eq('key', 'streaming_youtube_url').maybeSingle(),
      supabase.from('api_settings').select('value').eq('key', 'streaming_enabled').maybeSingle(),
      supabase.from('api_settings').select('value').eq('key', 'youtube_url').maybeSingle(),
    ])

    const activeVal = enabledResult.data?.value || activeResult.data?.value
    const urlVal = urlResult.data?.value || genericUrlResult.data?.value

    const isActive = activeVal === 'true'
    const url = urlVal || ''

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
 * Guarda y actualiza de forma unificada y persistente la configuración de streaming.
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

  const userSupabase = await createClient()
  const adminSupabase = getServiceSupabase()
  const clientToUse = adminSupabase || userSupabase

  // 1. Actualizar tabla streaming_config (si existe)
  try {
    const { error: configError } = await clientToUse
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
      console.warn('[saveStreamingConfigAction] streaming_config upsert error:', configError.message)
    }
  } catch (err) {
    console.warn('[saveStreamingConfigAction] Error en streaming_config:', err)
  }

  // 2. Sincronizar en api_settings (para redundancia total y lectura garantizada)
  try {
    const stringVal = streaming_enabled ? 'true' : 'false'
    await Promise.all([
      clientToUse.from('api_settings').upsert({ key: 'streaming_active', value: stringVal }, { onConflict: 'key' }),
      clientToUse.from('api_settings').upsert({ key: 'streaming_enabled', value: stringVal }, { onConflict: 'key' }),
      clientToUse.from('api_settings').upsert({ key: 'streaming_youtube_url', value: cleanUrl }, { onConflict: 'key' }),
      clientToUse.from('api_settings').upsert({ key: 'youtube_url', value: cleanUrl }, { onConflict: 'key' }),
    ])
  } catch (apiErr) {
    console.warn('[saveStreamingConfigAction] Warning sync api_settings:', apiErr)
  }

  // 3. Revalidar todas las rutas afectadas
  try {
    revalidatePath('/')
    revalidatePath('/', 'layout')
    revalidatePath('/dashboard/streaming')
  } catch (revalErr) {
    console.warn('[saveStreamingConfigAction] Revalidate warning:', revalErr)
  }

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
