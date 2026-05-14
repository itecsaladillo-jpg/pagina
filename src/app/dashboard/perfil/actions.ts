'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(data: { full_name: string, email: string, phone: string }) {
  try {
    const member = await getCurrentMember()
    if (!member) return { success: false, error: 'No autenticado' }

    const supabase = await createClient()
    const { error } = await supabase
      .from('members')
      .update({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', member.id)

    if (error) {
      console.error('[profileAction] Error updating profile:', error.message)
      return { success: false, error: 'No se pudo actualizar el perfil.' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/perfil')
    
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Error inesperado al procesar la solicitud.' }
  }
}
