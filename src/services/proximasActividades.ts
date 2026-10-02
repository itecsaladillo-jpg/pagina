import { createClient } from '@/lib/supabase/server'
import type { ProximaActividad } from '@/types/database'

/**
 * Detecta si el error devuelto por Supabase/PostgREST se debe a que la tabla
 * aún no existe en la base de datos o en el schema cache.
 */
function isMissingTableError(error: any): boolean {
  if (!error) return false
  const msg = (error.message || '').toLowerCase()
  const code = String(error.code || '')
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('relation') ||
    msg.includes('not found')
  )
}

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

  // 2. Fallback resiliente a itec_actions si la tabla proximas_actividades no existe o falló
  if (isMissingTableError(error) || error) {
    try {
      const { data: actions, error: actionsError } = await supabase
        .from('itec_actions')
        .select('id, title, location, start_date, created_at, updated_at, tags')
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
      console.error('[proximasActividades] Fallback get error:', err)
    }
  }

  if (error && !isMissingTableError(error)) {
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

  // 1. Intentar en proximas_actividades
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

  // 2. Fallback inmediato a itec_actions si no se pudo insertar en proximas_actividades (ej. tabla no existe en schema cache)
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
    console.error('[proximasActividades] Fallback create error:', actionError.message)
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

  // Fallback a itec_actions si la tabla no existe en el cache o no encontró el id
  if (isMissingTableError(error) || !data) {
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
    // También asegurar limpieza en itec_actions si coexistiera
    await supabase.from('itec_actions').delete().eq('id', id)
    return { success: true }
  }

  // Fallback a itec_actions si la tabla no existe en cache
  const { error: actionError } = await supabase.from('itec_actions').delete().eq('id', id)
  if (actionError) {
    return { success: false, error: actionError.message }
  }
  return { success: true }
}
