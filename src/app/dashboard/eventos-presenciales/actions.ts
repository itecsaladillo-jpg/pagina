'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentMember } from '@/services/auth'
import { revalidatePath } from 'next/cache'

export type VotoSemaforo = 'positivo' | 'negativo'

export interface SemaforoStatus {
  positivos: number
  negativos: number
  total: number
  lastResetAt: string | null
}

/**
 * Obtiene el estado actual del semáforo (conteo de votos + último reseteo).
 */
export async function getSemaforoStatusAction(eventoId: string): Promise<SemaforoStatus> {
  const supabase = await createClient()

  const { data: evento } = await supabase
    .from('eventos')
    .select('semaforo_last_reset_at')
    .eq('id', eventoId)
    .single()

  const { data: votos } = await supabase
    .from('evento_semaforo_votos')
    .select('voto')
    .eq('evento_id', eventoId)

  const positivos = votos?.filter(v => v.voto === 'positivo').length ?? 0
  const negativos = votos?.filter(v => v.voto === 'negativo').length ?? 0

  return {
    positivos,
    negativos,
    total: positivos + negativos,
    lastResetAt: evento?.semaforo_last_reset_at ?? null,
  }
}

/**
 * Resetea el semáforo: limpia todos los votos y actualiza la marca de tiempo.
 */
export async function resetSemaforoAction(eventoId: string) {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') throw new Error('No autorizado')

  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from('evento_semaforo_votos')
    .delete()
    .eq('evento_id', eventoId)

  if (deleteError) {
    console.error('[resetSemaforoAction] Error al eliminar votos:', deleteError.message)
    return { success: false, error: deleteError.message }
  }

  const { error: updateError } = await supabase
    .from('eventos')
    .update({ semaforo_last_reset_at: new Date().toISOString() })
    .eq('id', eventoId)

  if (updateError) {
    console.error('[resetSemaforoAction] Error al actualizar reset:', updateError.message)
    return { success: false, error: updateError.message }
  }

  revalidatePath(`/dashboard/eventos-presenciales/${eventoId}`)
  return { success: true }
}

/**
 * Registra o actualiza el voto de un asistente en el semáforo.
 */
export async function votarSemaforoAction(
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
    console.error('[votarSemaforoAction] Error:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}
