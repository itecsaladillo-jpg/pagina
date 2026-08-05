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

const ENV_FALLBACKS: Record<string, string> = {
  openrouter_api_key: 'OPENROUTER_API_KEY',
  gemini_api_key: 'GEMINI_APY_KEY',
  resend_api_key: 'RESEND_API_KEY',
  groq_api_key: 'GROQ_API_KEY',
  hf_api_key: 'HF_API_KEY',
}

export async function getSettingsAction(): Promise<Record<string, string>> {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') return {}

  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')

  const map: Record<string, string> = {}

  for (const [settingKey, envVar] of Object.entries(ENV_FALLBACKS)) {
    const dbRow = data?.find((r) => r.key === settingKey)
    const dbValue = dbRow?.value?.trim() || ''
    const envValue = process.env[envVar] || ''
    map[settingKey] = dbValue || envValue
  }

  return map
}

export async function updateSettingAction(
  key: string,
  value: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await getCurrentMember()
  if (!admin || admin.role !== 'admin') {
    return { success: false, error: 'No tenés permisos para realizar esta acción.' }
  }

  const allowedKeys = [
    'openrouter_api_key',
    'gemini_api_key',
    'resend_api_key',
    'groq_api_key',
    'hf_api_key',
  ]

  if (!allowedKeys.includes(key)) {
    return { success: false, error: 'Clave no válida.' }
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from('site_settings')
    .select('id')
    .eq('key', key)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('site_settings')
      .update({ value, updated_at: now })
      .eq('key', key)

    if (error) {
      console.error('[updateSetting] Error updating:', error.message)
      return { success: false, error: 'Error al actualizar.' }
    }
  } else {
    const { error } = await supabase
      .from('site_settings')
      .insert({ key, value, updated_at: now })

    if (error) {
      console.error('[updateSetting] Error inserting:', error.message)
      return { success: false, error: 'Error al crear.' }
    }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
