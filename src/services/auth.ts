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
 * Inicia sesión con Google OAuth.
 * Usar en Client Components con el cliente browser.
 */
export async function signInWithGoogle(redirectTo?: string) {
  const { createClient: createBrowserClient } = await import('@/lib/supabase/client')
  const supabase = createBrowserClient()

  const callbackUrl = `${window.location.origin}/auth/callback${
    redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''
  }`

  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
}

/**
 * Cierra la sesión del usuario actual.
 */
export async function signOut() {
  const { createClient: createBrowserClient } = await import('@/lib/supabase/client')
  const supabase = createBrowserClient()
  return supabase.auth.signOut()
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

/**
 * Verifica si el miembro tiene acceso (activo).
 */
export function isActiveMember(member: Member | null): boolean {
  return member?.status === 'activo'
}
