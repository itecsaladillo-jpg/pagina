import { createClient } from '@/lib/supabase/server'
import type { Member, Commission } from '@/types/database'

/**
 * Aprueba a un miembro pendiente cambiándole el estado a 'activo'.
 */
export async function approveMember(memberId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .update({ status: 'activo' })
    .eq('id', memberId)
    .select()

  if (error) {
    console.error('[adminService] approveMember error:', error.message)
    return { success: false, error: error.message }
  }
  
  return { success: true, data: data?.[0] || null }
}

/**
 * Deshabilita a un miembro (estado inactivo).
 */
export async function deactivateMember(memberId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .update({ status: 'inactivo' })
    .eq('id', memberId)
    .select()

  if (error) {
    console.error('[adminService] deactivateMember error:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true, data: data?.[0] || null }
}

/**
 * Cambia el rol de un miembro.
 */
export async function updateMemberRole(memberId: string, role: Member['role']) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('members')
    .update({ role })
    .eq('id', memberId)

  if (error) {
    console.error('[adminService] updateMemberRole error:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}

/**
 * Asigna un miembro a una comisión.
 * Si ya estaba en una, se puede manejar como upsert o eliminar previas.
 */
export async function assignToCommission(memberId: string, commissionId: string, isCoordinator: boolean = false) {
  const supabase = await createClient()
  
  // Primero eliminamos asignaciones previas si el modelo es 1 miembro -> 1 comisión
  // (Omitir este paso si un miembro puede estar en varias comisiones)
  await supabase
    .from('commission_members')
    .delete()
    .eq('member_id', memberId)

  const { error } = await supabase
    .from('commission_members')
    .insert({
      member_id: memberId,
      commission_id: commissionId,
      is_coordinator: isCoordinator
    })

  if (error) {
    console.error('[adminService] assignToCommission error:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}

/**
 * Obtiene todos los miembros con su información de comisión (si tienen).
 */
export async function getAllMembersWithCommissions() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      commission_members (
        commission_id,
        is_coordinator,
        commissions ( id, name )
      )
    `)
    .order('status', { ascending: false }) // Primero pendientes/activos
    .order('full_name')

  if (error) {
    console.error('[adminService] getAllMembers error:', error.message)
    return []
  }
  return data ?? []
}

/**
 * Crea una nueva comisión.
 */
export async function createCommission(commission: Omit<Commission, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('commissions')
    .insert(commission)
    .select()
    .single()

  if (error) {
    console.error('[adminService] createCommission error:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true, data }
}

/**
 * Actualiza una comisión existente.
 */
export async function updateCommission(id: string, updates: Partial<Commission>) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('commissions')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('[adminService] updateCommission error:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}
