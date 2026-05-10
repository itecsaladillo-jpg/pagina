import { createClient } from '@/lib/supabase/server'
import type { ItecAction, ActionRegistration } from '@/types/database'

/**
 * Obtiene todas las acciones de impacto (públicas).
 */
export async function getPublicActions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('itec_actions')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) {
    console.error('[actionsService] getPublicActions error:', error.message)
    return []
  }
  return data as ItecAction[]
}

/**
 * Obtiene el detalle de una acción específica.
 */
export async function getActionById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('itec_actions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[actionsService] getActionById error:', error.message)
    return null
  }
  return data as ItecAction
}

/**
 * Registra a un ciudadano externo en una acción.
 */
export async function registerToAction(registration: Omit<ActionRegistration, 'id' | 'registered_at' | 'attended'>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('action_registrations')
    .insert([registration])
    .select()
    .single()

  if (error) {
    console.error('[actionsService] registerToAction error:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true, data }
}
