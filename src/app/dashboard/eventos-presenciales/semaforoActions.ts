'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'

// ============================================================
// Tipos
// ============================================================

export type EstadoSemaforo = 'verde' | 'amarillo' | 'rojo'

export interface EstadoSemaforoResult {
  totalAcreditados: number
  votosNegativos: number
  porcentajeNegativo: number
  estado: EstadoSemaforo
}

// ============================================================
// Helpers
// ============================================================

function calcularEstado(porcentajeNegativo: number): EstadoSemaforo {
  if (porcentajeNegativo >= 50) return 'rojo'
  if (porcentajeNegativo >= 30) return 'amarillo'
  return 'verde'
}

// ============================================================
// Server Actions
// ============================================================

/**
 * Registra un voto negativo anónimo ("No entiendo, me perdí").
 * No requiere autenticación ni rastreo de identidad.
 */
export async function registrarVotoNegativo(
  eventoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('evento_semaforo_votos')
      .insert({ evento_id: eventoId })

    if (error) {
      console.error('[registrarVotoNegativo] Error:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[registrarVotoNegativo] Exception:', err)
    return { success: false, error: 'Error inesperado al registrar el voto.' }
  }
}

/**
 * Obtiene el estado actual del semáforo para un evento:
 * - totalAcreditados: COUNT de rows en eventos_asistentes
 * - votosNegativos: COUNT de votos desde semaforo_last_reset_at
 * - porcentajeNegativo: ratio calculado
 * - estado: 'verde' | 'amarillo' | 'rojo'
 */
export async function obtenerEstadoSemaforo(
  eventoId: string
): Promise<EstadoSemaforoResult> {
  const empty: EstadoSemaforoResult = {
    totalAcreditados: 0,
    votosNegativos: 0,
    porcentajeNegativo: 0,
    estado: 'verde',
  }

  try {
    const supabase = await createClient()

    // 1. Obtener semaforo_last_reset_at del evento
    const { data: eventoData, error: eventoError } = await supabase
      .from('eventos')
      .select('semaforo_last_reset_at')
      .eq('id', eventoId)
      .single()

    if (eventoError || !eventoData) {
      console.error('[obtenerEstadoSemaforo] Evento no encontrado:', eventoError?.message)
      return empty
    }

    const resetAt: string = eventoData.semaforo_last_reset_at ?? new Date(0).toISOString()

    // 2. COUNT de acreditados
    const { count: totalAcreditados, error: asistError } = await supabase
      .from('eventos_asistentes')
      .select('id', { count: 'exact', head: true })
      .eq('evento_id', eventoId)

    if (asistError) {
      console.error('[obtenerEstadoSemaforo] Error asistentes:', asistError.message)
      return empty
    }

    // 3. COUNT de votos negativos desde la última ventana de tiempo
    const { count: votosNegativos, error: votosError } = await supabase
      .from('evento_semaforo_votos')
      .select('id', { count: 'exact', head: true })
      .eq('evento_id', eventoId)
      .gte('created_at', resetAt)

    if (votosError) {
      console.error('[obtenerEstadoSemaforo] Error votos:', votosError.message)
      return empty
    }

    const total = totalAcreditados ?? 0
    const votos = votosNegativos ?? 0
    const porcentajeNegativo = total > 0 ? Math.round((votos / total) * 100) : 0
    const estado = calcularEstado(porcentajeNegativo)

    return { totalAcreditados: total, votosNegativos: votos, porcentajeNegativo, estado }
  } catch (err) {
    console.error('[obtenerEstadoSemaforo] Exception:', err)
    return empty
  }
}

/**
 * Reinicia el semáforo actualizando semaforo_last_reset_at = now().
 * Requiere rol admin o coordinador.
 */
export async function resetearSemaforo(
  eventoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getCurrentMember()
    if (!member || !['admin', 'coordinador'].includes(member.role)) {
      return { success: false, error: 'No autorizado. Se requiere rol admin o coordinador.' }
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
  } catch (err) {
    console.error('[resetearSemaforo] Exception:', err)
    return { success: false, error: 'Error inesperado al reiniciar el semáforo.' }
  }
}
