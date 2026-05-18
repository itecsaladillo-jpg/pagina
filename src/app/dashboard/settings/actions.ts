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
