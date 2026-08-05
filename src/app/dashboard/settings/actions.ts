'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

export async function updateSiteSettingsAction(formData: {
  hero_title: string
  hero_subtitle: string
  contact_email: string
  google_drive_email?: string
  google_drive_password?: string
  google_drive_root_id?: string
  google_service_account_json?: string
}) {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'No tenés permisos para realizar esta acción.' }
    }

    const supabase = await createClient()

    // Buscamos el ID del primer registro (solo debería haber uno)
    const { data: currentSettings } = await supabase
      .from('site_settings')
      .select('id')
      .single()

    if (!currentSettings) {
      return { success: false, error: 'No se encontró la configuración del sitio.' }
    }

    const { error } = await supabase
      .from('site_settings')
      .update({
        ...formData,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSettings.id)

    if (error) {
      console.error('[updateSettings] Error:', error.message)
      return { success: false, error: 'Error al actualizar la configuración.' }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/drive')
    revalidatePath('/') // Para actualizar la landing
    
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Ocurrió un error inesperado.' }
  }
}

// ─────────────────────────────────────────
// API KEYS
// ─────────────────────────────────────────

/** Configuración de keys conocidas: nombre, variable de entorno, categoría, label */
export const API_KEY_DEFINITIONS = [
  { key: 'OPENROUTER_API_KEY', envVar: 'OPENROUTER_API_KEY', label: 'OpenRouter API Key', category: 'ai' as const },
  { key: 'GEMINI_API_KEY', envVar: 'GEMINI_API_KEY', label: 'Gemini API Key (1)', category: 'ai' as const },
  { key: 'GEMINI_API_KEY_2', envVar: 'GEMINI_API_KEY_2', label: 'Gemini API Key (2)', category: 'ai' as const },
  { key: 'GEMINI_API_KEY_3', envVar: 'GEMINI_API_KEY_3', label: 'Gemini API Key (3)', category: 'ai' as const },
  { key: 'GEMINI_API_KEY_4', envVar: 'GEMINI_API_KEY_4', label: 'Gemini API Key (4)', category: 'ai' as const },
  { key: 'GOOGLE_GENERATIVE_AI_API_KEY', envVar: 'GOOGLE_GENERATIVE_AI_API_KEY', label: 'Gemini API Key (Alternativa)', category: 'ai' as const },
  { key: 'GROQ_API_KEY', envVar: 'GROQ_API_KEY', label: 'Groq API Key', category: 'ai' as const },
  { key: 'HF_API_KEY', envVar: 'HF_API_KEY', label: 'HuggingFace API Key', category: 'ai' as const },
  { key: 'OLLAMA_API_BASE_URL', envVar: 'OLLAMA_API_BASE_URL', label: 'Ollama URL del servidor', category: 'ai' as const },
  { key: 'OLLAMA_MODEL', envVar: 'OLLAMA_MODEL', label: 'Ollama Modelo', category: 'ai' as const },
  { key: 'RESEND_API_KEY', envVar: 'RESEND_API_KEY', label: 'Resend API Key', category: 'comms' as const },
  { key: 'RESEND_FROM_EMAIL', envVar: 'RESEND_FROM_PRENSA', label: 'Resend Email Remitente', category: 'comms' as const },
] as const

export type ApiKeyDefinition = (typeof API_KEY_DEFINITIONS)[number]
export type ApiKeyCategory = 'ai' | 'comms'

export interface ApiKeyStatus {
  key: string
  label: string
  category: ApiKeyCategory
  masked: string
  source: 'database' | 'env' | 'none'
  configured: boolean
}

/**
 * Enmascara una API key mostrando solo primeros 6 y últimos 4 caracteres.
 * Si la key es muy corta, muestra solo asteriscos.
 */
function maskKey(value: string): string {
  if (!value || value.length < 12) return '••••••••'
  return `${value.slice(0, 6)}••••••••${value.slice(-4)}`
}

/**
 * Obtiene el estado de todas las API keys configuradas.
 * Retorna la información necesaria para que el UI las renderice
 * sin exponer los valores reales al cliente.
 */
export async function getApiKeysAction(): Promise<{
  success: boolean
  keys?: ApiKeyStatus[]
  error?: string
}> {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'No tenés permisos para realizar esta acción.' }
    }

    const supabase = await createClient()
    const { data: settings } = await supabase
      .from('site_settings')
      .select('api_keys')
      .limit(1)
      .single()

    const apiKeys = (settings?.api_keys as Record<string, string>) || {}

    const keys: ApiKeyStatus[] = API_KEY_DEFINITIONS.map((def) => {
      const dbValue = apiKeys[def.key]
      const envValue = process.env[def.envVar] || ''

      const hasDbValue = typeof dbValue === 'string' && dbValue.trim() !== ''
      const hasEnvValue = envValue.trim() !== ''
      const rawValue = hasDbValue ? dbValue : envValue

      return {
        key: def.key,
        label: def.label,
        category: def.category,
        masked: hasDbValue || hasEnvValue ? maskKey(rawValue) : '••••••••',
        source: hasDbValue ? 'database' : hasEnvValue ? 'env' : 'none',
        configured: hasDbValue || hasEnvValue,
      }
    })

    return { success: true, keys }
  } catch (err) {
    return { success: false, error: 'Error al obtener las API keys.' }
  }
}

/**
 * Actualiza o inserta una API key en la columna api_keys de site_settings.
 * Si el valor está vacío, elimina la clave del JSONB.
 */
export async function updateApiKeyAction(
  keyName: string,
  newValue: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'No tenés permisos para realizar esta acción.' }
    }

    // Validar que la key esté en la lista de keys permitidas
    type AllowedKey = (typeof API_KEY_DEFINITIONS)[number]['key']
    const allowedKeys: string[] = API_KEY_DEFINITIONS.map((d) => d.key)
    if (!allowedKeys.includes(keyName)) {
      return { success: false, error: 'Nombre de clave no válido.' }
    }
    const validKey = keyName as AllowedKey

    // Sanitizar: remover caracteres peligrosos para JSONB
    const sanitized = newValue.replace(/[\x00-\x1f\x7f]/g, '').trim()

    const supabase = await createClient()

    // Obtener el registro actual
    const { data: currentSettings } = await supabase
      .from('site_settings')
      .select('id, api_keys')
      .limit(1)
      .single()

    if (!currentSettings) {
      return { success: false, error: 'No se encontró la configuración del sitio.' }
    }

    const currentKeys = (currentSettings.api_keys as Record<string, string>) || {}

    // Actualizar o eliminar la key
    let updatedKeys: Record<string, string>
    if (sanitized === '') {
      const { [validKey]: _, ...rest } = currentKeys
      updatedKeys = rest
    } else {
      updatedKeys = { ...currentKeys, [validKey]: sanitized }
    }

    const { error } = await supabase
      .from('site_settings')
      .update({
        api_keys: updatedKeys,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSettings.id)

    if (error) {
      console.error('[updateApiKey] Error:', error.message)
      return { success: false, error: 'Error al guardar la API key.' }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Ocurrió un error inesperado.' }
  }
}
