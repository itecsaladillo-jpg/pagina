import { createClient } from '@/lib/supabase/server'
import type { Member } from '@/types/database'

/**
 * Obtiene el usuario autenticado + su perfil de miembro en una sola llamada.
 * Usar en Server Components y Server Actions.
 */
export async function getCurrentMember(): Promise<Member | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[authService] getCurrentMember error:', error.message)
    return null
  }

  return member
}

/**
 * Verifica si el miembro tiene un rol específico.
 */
export function hasRole(member: Member | null, roles: Member['role'][]): boolean {
  if (!member) return false
  return roles.includes(member.role)
}

/**
 * Verifica si el miembro es un admin.
 */
export function isAdmin(member: Member | null): boolean {
  return hasRole(member, ['admin'])
}
