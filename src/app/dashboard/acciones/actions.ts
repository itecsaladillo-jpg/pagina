'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import type { ItecAction } from '@/types/database'

/**
 * Crea una nueva Acción de Impacto.
 */
export async function createActionAction(formData: Partial<ItecAction>) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) throw new Error('No autorizado')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('itec_actions')
    .insert([{
      ...formData,
      responsible_id: member.id,
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('[createActionAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/acciones')
  revalidatePath('/acciones')
  return { success: true, data }
}

/**
 * Actualiza el estado de una acción.
 */
export async function updateActionStatusAction(actionId: string, status: ItecAction['status']) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('itec_actions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', actionId)

  if (error) {
    console.error('[updateActionStatusAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/acciones')
  revalidatePath('/acciones')
  return { success: true }
}

/**
 * Obtiene los inscriptos de una acción.
 */
export async function getActionAttendees(actionId: string) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) throw new Error('No autorizado')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('action_registrations')
    .select('*')
    .eq('action_id', actionId)
    .order('registered_at', { ascending: false })

  if (error) {
    console.error('[getActionAttendees] Error:', error.message)
    return []
  }
  return data
}

/**
 * Registra a un ciudadano externo en una acción (Server Action).
 */
export async function registerToActionAction(registration: {
  action_id: string
  full_name: string
  email: string
  phone: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('action_registrations')
    .insert([registration])
    .select()
    .single()

  if (error) {
    console.error('[registerToActionAction] error:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true, data }
}

export async function deleteActionAction(id: string) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) throw new Error('No autorizado')

  const supabase = await createClient()
  const { error } = await supabase
    .from('itec_actions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[deleteActionAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/acciones')
  revalidatePath('/acciones')
  revalidatePath('/')
  return { success: true }
}
