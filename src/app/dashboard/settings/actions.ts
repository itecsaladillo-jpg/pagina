'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import { maskValue } from '@/lib/settings'

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
    revalidatePath('/')
    
    return { success: true }
  } catch {
    return { success: false, error: 'Ocurrió un error inesperado.' }
  }
}

const API_KEY_DEFINITIONS = [
  { key: 'openrouter_api_key', envVar: 'OPENROUTER_API_KEY', label: 'OpenRouter API Key', category: 'ai' },
  { key: 'gemini_api_key', envVar: 'GEMINI_API_KEY', label: 'Gemini API Key', category: 'ai' },
  { key: 'gemini_api_key_2', envVar: 'GEMINI_API_KEY_2', label: 'Gemini API Key 2', category: 'ai' },
  { key: 'gemini_api_key_3', envVar: 'GEMINI_API_KEY_3', label: 'Gemini API Key 3', category: 'ai' },
  { key: 'gemini_api_key_4', envVar: 'GEMINI_API_KEY_4', label: 'Gemini API Key 4', category: 'ai' },
  { key: 'groq_api_key', envVar: 'GROQ_API_KEY', label: 'Groq API Key', category: 'ai' },
  { key: 'hf_api_key', envVar: 'HF_API_KEY', label: 'HuggingFace API Key', category: 'ai' },
  { key: 'ollama_base_url', envVar: 'OLLAMA_API_BASE_URL', label: 'Ollama Base URL', category: 'ai' },
  { key: 'ollama_model', envVar: 'OLLAMA_MODEL', label: 'Ollama Model', category: 'ai' },
  { key: 'resend_api_key', envVar: 'RESEND_API_KEY', label: 'Resend API Key', category: 'email' },
  { key: 'resend_from_email', envVar: 'RESEND_FROM_EMAIL', label: 'Resend From Email', category: 'email' },
]

export interface ApiKeyInfo {
  key: string
  label: string
  category: string
  maskedValue: string
  source: 'database' | 'env'
  hasValue: boolean
}

export async function getApiKeysAction(): Promise<{ success: boolean; keys?: ApiKeyInfo[]; error?: string }> {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'No tenés permisos para realizar esta acción.' }
    }

    const supabase = await createClient()
    const keyNames = API_KEY_DEFINITIONS.map(d => d.key)

    const { data: dbSettings } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', keyNames)

    const dbMap = new Map<string, string>()
    if (dbSettings) {
      for (const row of dbSettings) {
        if (row.value && row.value.trim() !== '') {
          dbMap.set(row.key, row.value)
        }
      }
    }

    const keys: ApiKeyInfo[] = API_KEY_DEFINITIONS.map(def => {
      const dbValue = dbMap.get(def.key)
      const envValue = process.env[def.envVar] || ''
      const resolvedValue = dbValue || envValue
      const fromDb = !!dbValue

      return {
        key: def.key,
        label: def.label,
        category: def.category,
        maskedValue: resolvedValue ? maskValue(resolvedValue) : '',
        source: fromDb ? 'database' : 'env',
        hasValue: !!resolvedValue,
      }
    })

    return { success: true, keys }
  } catch (err) {
    console.error('[getApiKeys] Error:', err)
    return { success: false, error: 'Error al obtener las API keys.' }
  }
}

export async function updateApiKeyAction(
  keyName: string,
  newValue: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await getCurrentMember()
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'No tenés permisos para realizar esta acción.' }
    }

    const validKeys = API_KEY_DEFINITIONS.map(d => d.key)
    if (!validKeys.includes(keyName)) {
      return { success: false, error: 'Nombre de clave inválido.' }
    }

    const sanitized = newValue.trim()

    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('key', keyName)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: sanitized, updated_at: new Date().toISOString() })
        .eq('key', keyName)

      if (error) {
        console.error('[updateApiKey] Update error:', error.message)
        return { success: false, error: 'Error al actualizar la API key.' }
      }
    } else {
      const { error } = await supabase
        .from('site_settings')
        .insert({ key: keyName, value: sanitized, updated_at: new Date().toISOString() })

      if (error) {
        console.error('[updateApiKey] Insert error:', error.message)
        return { success: false, error: 'Error al crear la API key.' }
      }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (err) {
    console.error('[updateApiKey] Error:', err)
    return { success: false, error: 'Ocurrió un error inesperado.' }
  }
}
