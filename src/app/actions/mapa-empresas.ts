'use server'

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Variables de entorno de Supabase no configuradas.')
  }

  return createClient(url, key)
}

export interface RegistrarEmpresaInput {
  nombre: string
  rubro: string
  email: string
  telefono?: string
  oferta: string
  demanda: string[]
  detalles_demanda?: string
  desafio_tecnologico?: string
  direccion?: string
  latitud?: number
  longitud?: number
}

export async function registrarEmpresaAction(input: RegistrarEmpresaInput) {
  try {
    const supabase = getSupabase()

    // Intentar inserción con payload primario
    const payload = {
      nombre: input.nombre?.trim(),
      nombre_empresa: input.nombre?.trim(),
      rubro: input.rubro?.trim(),
      sector: input.rubro?.trim(),
      email: input.email?.trim().toLowerCase(),
      telefono: input.telefono?.trim() || null,
      oferta: input.oferta?.trim(),
      descripcion_oferta: input.oferta?.trim(),
      demanda: Array.isArray(input.demanda) ? input.demanda : [],
      detalles_demanda: input.detalles_demanda?.trim() || null,
      descripcion_demanda: input.detalles_demanda?.trim() || null,
      desafio_tecnologico: input.desafio_tecnologico?.trim() || null,
      direccion: input.direccion?.trim() || null,
      latitud: input.latitud ?? -35.6738,
      longitud: input.longitud ?? -59.7781,
    }

    const { data, error } = await supabase
      .from('mapa_empresas')
      .insert(payload)
      .select()

    if (error) {
      console.error('[registrarEmpresaAction] Error inicial al insertar:', error)

      // Fallback si la tabla no tiene las columnas duales (error de columna inexistente PGRST204 o 42703)
      if (error.code === 'PGRST204' || error.message?.includes('column') || error.code === '42703') {
        console.warn('[registrarEmpresaAction] Reintentando con payload mínimo compatible...')
        
        // Determinar si la columna que falla es un campo duplicado
        const fallbackPayload: Record<string, unknown> = {
          nombre: input.nombre?.trim(),
          rubro: input.rubro?.trim(),
          email: input.email?.trim().toLowerCase(),
          telefono: input.telefono?.trim() || null,
          oferta: input.oferta?.trim(),
          desafio_tecnologico: input.desafio_tecnologico?.trim() || null,
        }

        const { error: fallbackError } = await supabase
          .from('mapa_empresas')
          .insert(fallbackPayload)

        if (fallbackError) {
          // Último fallback con nombre_empresa / sector
          const altPayload: Record<string, unknown> = {
            nombre_empresa: input.nombre?.trim(),
            sector: input.rubro?.trim(),
            email: input.email?.trim().toLowerCase(),
            telefono: input.telefono?.trim() || null,
            descripcion_oferta: input.oferta?.trim(),
            desafio_tecnologico: input.desafio_tecnologico?.trim() || null,
          }
          const { error: altError } = await supabase.from('mapa_empresas').insert(altPayload)
          if (altError) {
            console.error('[registrarEmpresaAction] Fallback final también falló:', altError)
            return {
              success: false,
              error: `Error de base de datos (${altError.code || '400'}): ${altError.message}`,
              details: altError.details,
            }
          }
          return { success: true }
        }
        return { success: true }
      }

      return {
        success: false,
        error: `Error al registrar empresa (${error.code || '400'}): ${error.message}`,
        details: error.details,
      }
    }

    return { success: true, data }
  } catch (err: unknown) {
    console.error('[registrarEmpresaAction] Excepción:', err)
    const msg = err instanceof Error ? err.message : 'Error inesperado al registrar empresa.'
    return { success: false, error: msg }
  }
}

export interface RegistrarAlumnoInput {
  escuela: string
  especialidad: string
  habilidades: string[]
}

export async function registrarAlumnoAction(input: RegistrarAlumnoInput) {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('alumnos_talentos')
      .insert({
        escuela: input.escuela?.trim(),
        especialidad: input.especialidad?.trim(),
        habilidades: Array.isArray(input.habilidades) ? input.habilidades : [],
      })
      .select()

    if (error) {
      console.error('[registrarAlumnoAction] Error al insertar:', error)
      return {
        success: false,
        error: `Error al registrar alumno (${error.code || '400'}): ${error.message}`,
        details: error.details,
      }
    }

    return { success: true, data }
  } catch (err: unknown) {
    console.error('[registrarAlumnoAction] Excepción:', err)
    const msg = err instanceof Error ? err.message : 'Error inesperado al registrar alumno.'
    return { success: false, error: msg }
  }
}
