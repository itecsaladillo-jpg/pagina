'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'
import type { HerramientasActivas } from '@/types/database'

export type { HerramientasActivas }

export type ModoPantalla = 'bienvenida' | 'nube' | 'encuestas' | 'preguntas'

/**
 * Actualiza los switches individuales de herramientas activas.
 */
export async function actualizarHerramientasActivasAction(
  eventoId: string,
  herramientas: HerramientasActivas
) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('eventos')
    .update({ herramientas_activas: herramientas })
    .eq('id', eventoId)

  if (error) {
    console.error('[actualizarHerramientasActivasAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Actualiza el modo de proyección en pantalla gigante.
 */
export async function actualizarModoPantallaAction(
  eventoId: string,
  modo: ModoPantalla
) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('eventos')
    .update({ modo_pantalla_gigante: modo })
    .eq('id', eventoId)

  if (error) {
    console.error('[actualizarModoPantallaAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Actualiza el concepto de la Nube de Ideas para un evento.
 */
export async function actualizarConceptoNube(
  eventoId: string,
  concepto: string
) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('eventos')
    .update({ nube_concepto: concepto })
    .eq('id', eventoId)

  if (error) {
    console.error('[actualizarConceptoNube] Error:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}
