'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'

export type VotoSemaforo = 'positivo' | 'negativo'
export type EstadoSemaforo = 'VERDE' | 'AMARILLO' | 'ROJO'

export interface EstadoSemaforoResponse {
  totalAcreditados: number
  votosNegativos: number
  porcentajeNegativo: number
  estado: EstadoSemaforo
}

/**
 * Registra o actualiza el voto de un asistente en el semáforo.
 * Si el visitor_id ya votó en este evento, actualiza su voto existente.
 */
export async function registrarVotoSemaforo(
  eventoId: string,
  visitorId: string,
  voto: VotoSemaforo
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('evento_semaforo_votos')
    .upsert(
      {
        evento_id: eventoId,
        visitor_id: visitorId,
        voto,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'evento_id, visitor_id',
        ignoreDuplicates: false,
      }
    )

  if (error) {
    console.error('[registrarVotoSemaforo] Error:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Resetea el semáforo: actualiza la marca de tiempo de reinicio.
 * Solo disponible para miembros autenticados.
 */
export async function resetearSemaforo(eventoId: string) {
  const member = await getCurrentMember()
  if (!member) {
    return { success: false, error: 'No autorizado' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('eventos')
    .update({ semaforo_last_reset_at: new Date().toISOString() })
    .eq('id', eventoId)

  if (error) {
    console.error('[resetearSemaforo] Error:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Obtiene el estado actual del semáforo calculado a partir de:
 * - Total de asistentes acreditados
 * - Votos negativos registrados después del último reseteo
 * - Porcentaje de votos negativos sobre acreditados
 * - Estado semafórico (VERDE/AMARILLO/ROJO)
 */
export async function obtenerEstadoSemaforo(eventoId: string): Promise<EstadoSemaforoResponse> {
  const supabase = await createClient()

  const { count: totalAcreditados } = await supabase
    .from('eventos_asistentes')
    .select('*', { count: 'exact', head: true })
    .eq('evento_id', eventoId)

  const { data: evento } = await supabase
    .from('eventos')
    .select('semaforo_last_reset_at')
    .eq('id', eventoId)
    .single()

  const lastResetAt = evento?.semaforo_last_reset_at

  let votosNegativos = 0
  if (lastResetAt) {
    const { count } = await supabase
      .from('evento_semaforo_votos')
      .select('*', { count: 'exact', head: true })
      .eq('evento_id', eventoId)
      .eq('voto', 'negativo')
      .gte('created_at', lastResetAt)

    votosNegativos = count ?? 0
  }

  const total = totalAcreditados ?? 0
  const porcentajeNegativo = total === 0
    ? 0
    : Math.round((votosNegativos / total) * 100)

  let estado: EstadoSemaforo
  if (porcentajeNegativo < 30) {
    estado = 'VERDE'
  } else if (porcentajeNegativo < 50) {
    estado = 'AMARILLO'
  } else {
    estado = 'ROJO'
  }

  return {
    totalAcreditados: total,
    votosNegativos,
    porcentajeNegativo,
    estado,
  }
}
