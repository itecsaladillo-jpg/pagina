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
 * Aprueba a un miembro buscando por email. 
 * Si el usuario ya existe, lo activa. 
 * Si no existe, lo agrega a la lista de pre-aprobados (allowed_emails).
 */
export async function approveMemberByEmail(email: string) {
  const supabase = await createClient()
  
  // 1. Intentar buscar si el usuario ya se registró
  const { data: member } = await supabase
    .from('members')
    .select('id, status')
    .eq('email', email)
    .maybeSingle()

  if (member) {
    if (member.status === 'activo') {
      return { success: false, error: 'El usuario ya se encuentra activo.' }
    }
    // Si existe y está pendiente, lo aprobamos
    const { data, error } = await supabase
      .from('members')
      .update({ status: 'activo' })
      .eq('id', member.id)
      .select()

    if (error) return { success: false, error: error.message }
    return { success: true, message: 'Usuario existente aprobado con éxito.', data: data?.[0] }
  }

  // 2. Si no existe, lo agregamos a la lista de pre-aprobados
  const { error: preError } = await supabase
    .from('allowed_emails')
    .upsert({ email: email.toLowerCase().trim() })

  if (preError) {
    console.error('[adminService] pre-approval error:', preError.message)
    // Si falla porque no existe la tabla (migración no corrida), informamos
    if (preError.message.includes('relation "public.allowed_emails" does not exist')) {
      return { success: false, error: 'Error técnico: Se requiere ejecutar la migración 011 en Supabase.' }
    }
    return { success: false, error: 'No se pudo pre-aprobar el correo.' }
  }

  return { 
    success: true, 
    message: 'Correo pre-aprobado. El usuario será "activo" automáticamente cuando se registre.',
    isPreApproved: true 
  }
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
 * Cambia el rol de un miembro registrado.
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
 * Cambia el rol de un correo pre-aprobado (que aún no se registró).
 */
export async function updatePreApprovedRole(email: string, role: Member['role']) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('allowed_emails')
    .update({ role })
    .eq('email', email)

  if (error) {
    console.error('[adminService] updatePreApprovedRole error:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}

/**
 * Cambia la comisión de un correo pre-aprobado.
 */
export async function updatePreApprovedCommission(email: string, commissionId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('allowed_emails')
    .update({ commission_id: commissionId || null })
    .eq('email', email)

  if (error) {
    console.error('[adminService] updatePreApprovedCommission error:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}

/**
 * Cambia el nombre de un correo pre-aprobado.
 */
export async function updatePreApprovedName(email: string, fullName: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('allowed_emails')
    .update({ full_name: fullName })
    .eq('email', email)

  if (error) {
    console.error('[adminService] updatePreApprovedName error:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}

/**
 * Cambia el teléfono de un miembro registrado.
 */
export async function updateMemberPhone(memberId: string, phone: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('members')
    .update({ phone })
    .eq('id', memberId)

  if (error) {
    console.error('[adminService] updateMemberPhone error:', error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}

/**
 * Cambia el teléfono de un correo pre-aprobado.
 */
export async function updatePreApprovedPhone(email: string, phone: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('allowed_emails')
    .update({ phone })
    .eq('email', email)

  if (error) {
    console.error('[adminService] updatePreApprovedPhone error:', error.message)
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
 * También incluye los correos de la tabla allowed_emails como 'pre-aprobado'.
 */
export async function getAllMembersWithCommissions() {
  const supabase = await createClient()
  
  // 1. Obtener miembros registrados
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select(`
      *,
      commission_members (
        commission_id,
        is_coordinator,
        commissions ( id, name )
      )
    `)
    .order('status', { ascending: false }) 
    .order('full_name')

  // 2. Obtener correos pre-aprobados (pueden fallar si la tabla no existe aún)
  const { data: preApproved, error: preError } = await supabase
    .from('allowed_emails')
    .select('*')

  if (membersError) {
    console.error('[adminService] getAllMembers error:', membersError.message)
    return []
  }

  const results = [...(members ?? [])]

  // Integrar pre-aprobados que no estén ya en la tabla de miembros
  if (preApproved && !preError) {
    preApproved.forEach(pa => {
      const alreadyExists = results.find(m => m.email.toLowerCase() === pa.email.toLowerCase())
      if (!alreadyExists) {
        // Extraer nombre del email (antes del @) y capitalizar
        const emailName = pa.email.split('@')[0]
        const formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1)

        results.push({
          id: pa.email,
          email: pa.email,
          full_name: pa.full_name || `${formattedName} (Pre-aprobado)`,
          phone: pa.phone || '',
          status: 'pre-aprobado',
          role: pa.role || 'miembro',
          created_at: pa.created_at,
          commission_members: pa.commission_id ? [{
            commission_id: pa.commission_id,
            commissions: { id: pa.commission_id, name: 'Cargando...' } // El frontend buscará el nombre en la lista de comisiones
          }] : []
        })
      }
    })
  }

  return results
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
