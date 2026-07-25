'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

/**
 * Crea un nuevo evento presencial.
 */
export async function crearEventoPresencialAction(data: {
  nombre_evento: string
  slug_qr: string
  fecha: string
  modalidad: 'presencial' | 'virtual'
}) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()

  const { data: evento, error } = await supabase
    .from('eventos')
    .insert({
      nombre_evento: data.nombre_evento,
      slug_qr: data.slug_qr,
      fecha: data.fecha,
      estado_activo: true,
      modalidad: data.modalidad,
      herramienta_activa: 'encuestas',
    })
    .select()
    .single()

  if (error) {
    console.error('[crearEventoPresencialAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/eventos-presenciales')
  return { success: true, data: evento }
}

/**
 * Actualiza el estado activo de un evento.
 */
export async function toggleEstadoEventoAction(eventoId: string, activo: boolean) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('eventos')
    .update({ estado_activo: activo })
    .eq('id', eventoId)

  if (error) {
    console.error('[toggleEstadoEventoAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/eventos-presenciales')
  return { success: true }
}

/**
 * Elimina un evento presencial y toda su interactividad asociada.
 */
export async function eliminarEventoPresencialAction(eventoId: string) {
  const member = await getCurrentMember()
  if (!member || !['admin', 'coordinador'].includes(member.role)) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('eventos')
    .delete()
    .eq('id', eventoId)

  if (error) {
    console.error('[eliminarEventoPresencialAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/eventos-presenciales')
  revalidatePath('/dashboard/eventos')
  return { success: true }
}
