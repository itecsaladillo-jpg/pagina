'use server'

import { createClient } from '@/lib/supabase/server'
import type { ModometroEstado, SemaforoColor } from '@/types/database'

// ─────────────────────────────────────────
// ACCIONES DEL DOCENTE / MODERADOR
// ─────────────────────────────────────────

export async function updateClaseMeetUrlAction(claseId: string, meetUrl: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('clases_virtuales')
      .update({ meet_url: meetUrl || null })
      .eq('id', claseId)

    if (error) {
      console.error('[updateClaseMeetUrl] Error:', error.message)
      return { success: false, error: 'Error al actualizar enlace Meet.' }
    }
    return { success: true }
  } catch (e) {
    console.error('[updateClaseMeetUrl] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function updateClaseModalidadAction(claseId: string, modalidad: 'presencial' | 'virtual') {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('clases_virtuales')
      .update({ modalidad })
      .eq('id', claseId)

    if (error) {
      console.error('[updateClaseModalidad] Error:', error.message)
      return { success: false, error: 'Error al actualizar modalidad.' }
    }
    return { success: true }
  } catch (e) {
    console.error('[updateClaseModalidad] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function crearEncuestaAction(
  claseId: string,
  pregunta: string,
  opciones: string[]
) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('clase_encuestas')
      .insert({
        clase_id: claseId,
        pregunta,
        opciones
      })

    if (error) {
      console.error('[crearEncuesta] Error:', error.message)
      return { success: false, error: 'Error al crear encuesta.' }
    }
    return { success: true }
  } catch (e) {
    console.error('[crearEncuesta] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function toggleEncuestaActivaAction(encuestaId: string, activa: boolean) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('clase_encuestas')
      .update({ activa })
      .eq('id', encuestaId)

    if (error) {
      console.error('[toggleEncuesta] Error:', error.message)
      return { success: false, error: 'Error al actualizar encuesta.' }
    }
    return { success: true }
  } catch (e) {
    console.error('[toggleEncuesta] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function marcarPreguntaResueltaAction(preguntaId: string, resuelta: boolean) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('clase_preguntas')
      .update({ resuelta })
      .eq('id', preguntaId)

    if (error) {
      console.error('[marcarPreguntaResuelta] Error:', error.message)
      return { success: false, error: 'Error al actualizar pregunta.' }
    }
    return { success: true }
  } catch (e) {
    console.error('[marcarPreguntaResuelta] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function atenderManoAlzadaAction(manoId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('clase_mano_alzada')
      .update({ estado: 'atendido' })
      .eq('id', manoId)

    if (error) {
      console.error('[atenderManoAlzada] Error:', error.message)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e) {
    console.error('[atenderManoAlzada] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function bajarManoAlzadaAction(manoId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('clase_mano_alzada')
      .delete()
      .eq('id', manoId)

    if (error) {
      console.error('[bajarManoAlzada] Error:', error.message)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e) {
    console.error('[bajarManoAlzada] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function reiniciarSemaforoAction(claseId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('reiniciar_semaforo_clase', {
      p_clase_id: claseId
    })

    if (error) {
      console.error('[reiniciarSemaforo] Error:', error.message)
      return { success: false, error: 'Error al reiniciar semáforo.' }
    }
    return { success: true }
  } catch (e) {
    console.error('[reiniciarSemaforo] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

// ─────────────────────────────────────────
// ACCIONES DEL ALUMNO / PARTICIPANTE
// ─────────────────────────────────────────

export async function votarModometroAction(
  claseId: string,
  memberUserId: string | null,
  nombreCompleto: string,
  estado: ModometroEstado
) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('clase_modometro_votos')
      .upsert(
        {
          clase_id: claseId,
          member_id: memberUserId,
          nombre_completo: nombreCompleto,
          estado,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'clase_id,member_id' }
      )

    if (error) {
      console.error('[votarModometro] Error:', error.message)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e) {
    console.error('[votarModometro] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function levantarManoAction(
  claseId: string,
  memberUserId: string | null,
  nombreCompleto: string
) {
  try {
    const supabase = await createClient()

    const { data: existente } = await supabase
      .from('clase_mano_alzada')
      .select('id, estado')
      .eq('clase_id', claseId)
      .eq('member_id', memberUserId)
      .single()

    if (existente && existente.estado === 'esperando') {
      const { error } = await supabase
        .from('clase_mano_alzada')
        .delete()
        .eq('id', existente.id)
      if (error) return { success: false, error: error.message }
      return { success: true, data: 'bajada' }
    }

    if (existente && existente.estado === 'atendido') {
      const { error } = await supabase
        .from('clase_mano_alzada')
        .delete()
        .eq('id', existente.id)
      if (error) return { success: false, error: error.message }
    }

    const { error } = await supabase
      .from('clase_mano_alzada')
      .insert({
        clase_id: claseId,
        member_id: memberUserId,
        nombre_completo: nombreCompleto,
        estado: 'esperando'
      })

    if (error) {
      console.error('[levantarMano] Error:', error.message)
      return { success: false, error: error.message }
    }
    return { success: true, data: 'levantada' }
  } catch (e) {
    console.error('[levantarMano] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function publicarPreguntaAction(
  claseId: string,
  memberUserId: string | null,
  nombreCompleto: string,
  pregunta: string
) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('clase_preguntas')
      .insert({
        clase_id: claseId,
        member_id: memberUserId,
        nombre_completo: nombreCompleto,
        pregunta
      })

    if (error) {
      console.error('[publicarPregunta] Error:', error.message)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e) {
    console.error('[publicarPregunta] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function toggleVotoPreguntaAction(
  preguntaId: string,
  memberUserId: string,
  nombreCompleto: string
) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('toggle_pregunta_voto', {
      p_pregunta_id: preguntaId,
      p_member_id: memberUserId,
      p_nombre_completo: nombreCompleto
    })

    if (error) {
      console.error('[toggleVotoPregunta] Error:', error.message)
      return { success: false, error: error.message }
    }
    return { success: true, votado: data as boolean }
  } catch (e) {
    console.error('[toggleVotoPregunta] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function responderEncuestaAction(
  encuestaId: string,
  memberUserId: string,
  nombreCompleto: string,
  opcionIndex: number
) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('clase_encuesta_respuestas')
      .upsert(
        {
          encuesta_id: encuestaId,
          member_id: memberUserId,
          nombre_completo: nombreCompleto,
          opcion_index: opcionIndex
        },
        { onConflict: 'encuesta_id,member_id' }
      )

    if (error) {
      console.error('[responderEncuesta] Error:', error.message)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e) {
    console.error('[responderEncuesta] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}

export async function votarSemaforoAction(
  claseId: string,
  memberUserId: string | null,
  nombreCompleto: string,
  color: SemaforoColor
) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('clase_semaforo_votos')
      .upsert(
        {
          clase_id: claseId,
          member_id: memberUserId,
          nombre_completo: nombreCompleto,
          color,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'clase_id,member_id' }
      )

    if (error) {
      console.error('[votarSemaforo] Error:', error.message)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (e) {
    console.error('[votarSemaforo] Excepción:', e)
    return { success: false, error: 'Error inesperado.' }
  }
}
