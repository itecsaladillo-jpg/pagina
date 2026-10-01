import { createClient } from '@/lib/supabase/server'
import type { ProximaActividad } from '@/types/database'

/**
 * Obtiene el listado de próximas actividades activas para la pizarra pública y panel administrativo.
 */
export async function getProximasActividades(): Promise<ProximaActividad[]> {
  const supabase = await createClient()

  // 1. Intentar consultar la tabla dedicada proximas_actividades
  const { data, error } = await supabase
    .from('proximas_actividades')
    .select('*')
    .eq('is_active', true)
    .order('fecha', { ascending: true })

  if (!error && data) {
    return data as ProximaActividad[]
  }

  // 2. Fallback resiliente a itec_actions si la tabla proximas_actividades aún no existe o falló
  const isTableMissing = error?.code === '42P01' || error?.message?.includes('does not exist')
  try {
    const { data: actions, error: actionsError } = await supabase
      .from('itec_actions')
      .select('id, title, location, start_date, created_at, updated_at')
      .not('start_date', 'is', null)
      .order('start_date', { ascending: true })

    if (!actionsError && actions && actions.length > 0) {
      return actions.map((a: any) => ({
        id: a.id,
        titulo: a.title || 'Actividad ITEC',
        lugar: a.location || 'Saladillo',
        fecha: a.start_date,
        created_at: a.created_at || new Date().toISOString(),
        updated_at: a.updated_at || new Date().toISOString(),
        is_active: true,
      }))
    }
  } catch (err) {
    console.error('[proximasActividades] Fallback error:', err)
  }

  if (error && !isTableMissing) {
    console.error('[proximasActividades] getProximasActividades error:', error.message)
  }

  return []
}

/**
 * Crea una nueva actividad.
 */
export async function createProximaActividad(input: {
  titulo: string
  lugar: string
  fecha: string
}): Promise<{ success: boolean; data?: ProximaActividad; error?: string }> {
  const supabase = await createClient()

  // Intentar en proximas_actividades
  const { data, error } = await supabase
    .from('proximas_actividades')
    .insert([
      {
        titulo: input.titulo.trim(),
        lugar: input.lugar.trim(),
        fecha: input.fecha,
        is_active: true,
      },
    ])
    .select()
    .single()

  if (!error && data) {
    return { success: true, data: data as ProximaActividad }
  }

  // Fallback a itec_actions si no existe la tabla
  if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
    const { data: actionData, error: actionError } = await supabase
      .from('itec_actions')
      .insert([
        {
          title: input.titulo.trim(),
          location: input.lugar.trim(),
          start_date: input.fecha,
          type: 'divulgacion',
          status: 'planificacion',
          tags: ['proxima_actividad'],
        },
      ])
      .select()
      .single()

    if (actionError) {
      return { success: false, error: actionError.message }
    }

    return {
      success: true,
      data: {
        id: actionData.id,
        titulo: actionData.title,
        lugar: actionData.location || input.lugar,
        fecha: actionData.start_date || input.fecha,
        created_at: actionData.created_at,
        updated_at: actionData.updated_at,
        is_active: true,
      },
    }
  }

  return { success: false, error: error?.message || 'Error al guardar la actividad' }
}

/**
 * Actualiza una actividad existente.
 */
export async function updateProximaActividad(
  id: string,
  input: {
    titulo: string
    lugar: string
    fecha: string
  }
): Promise<{ success: boolean; data?: ProximaActividad; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proximas_actividades')
    .update({
      titulo: input.titulo.trim(),
      lugar: input.lugar.trim(),
      fecha: input.fecha,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (!error && data) {
    return { success: true, data: data as ProximaActividad }
  }

  // Fallback a itec_actions
  if (error?.code === '42P01' || error?.message?.includes('does not exist') || !data) {
    const { data: actionData, error: actionError } = await supabase
      .from('itec_actions')
      .update({
        title: input.titulo.trim(),
        location: input.lugar.trim(),
        start_date: input.fecha,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (!actionError && actionData) {
      return {
        success: true,
        data: {
          id: actionData.id,
          titulo: actionData.title,
          lugar: actionData.location || input.lugar,
          fecha: actionData.start_date || input.fecha,
          created_at: actionData.created_at,
          updated_at: actionData.updated_at,
          is_active: true,
        },
      }
    }

    if (actionError && actionError.code !== 'PGRST116') {
      return { success: false, error: actionError.message }
    }
  }

  return { success: false, error: error?.message || 'Error al actualizar la actividad' }
}

/**
 * Elimina una actividad existente.
 */
export async function deleteProximaActividad(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from('proximas_actividades').delete().eq('id', id)

  if (!error) {
    return { success: true }
  }

  // Fallback a itec_actions
  if (error.code === '42P01' || error.message.includes('does not exist')) {
    const { error: actionError } = await supabase.from('itec_actions').delete().eq('id', id)
    if (actionError) {
      return { success: false, error: actionError.message }
    }
    return { success: true }
  }

  return { success: false, error: error.message }
}
