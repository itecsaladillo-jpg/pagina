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

    const latitud = typeof input.latitud === 'number' && !isNaN(input.latitud) ? input.latitud : -35.6738
    const longitud = typeof input.longitud === 'number' && !isNaN(input.longitud) ? input.longitud : -59.7781

    // Payload inicial con las columnas estándar
    const currentPayload: Record<string, unknown> = {
      nombre: input.nombre?.trim(),
      rubro: input.rubro?.trim(),
      email: input.email?.trim().toLowerCase(),
      telefono: input.telefono?.trim() || null,
      oferta: input.oferta?.trim(),
      demanda: Array.isArray(input.demanda) ? input.demanda : [],
      detalles_demanda: input.detalles_demanda?.trim() || null,
      desafio_tecnologico: input.desafio_tecnologico?.trim() || null,
      direccion: input.direccion?.trim() || null,
      latitud,
      longitud,
    }

    // Intentos adaptativos automáticos para ajustarse al esquema exacto de Supabase
    for (let intento = 0; intento < 6; intento++) {
      const { data, error } = await supabase
        .from('mapa_empresas')
        .insert(currentPayload)
        .select()

      if (!error) {
        return { success: true, data }
      }

      console.warn(`[registrarEmpresaAction] Intento ${intento + 1} falló (${error.code}): ${error.message}`)

      // 1. Caso: Columna no existe en el schema cache (PGRST204 o 42703)
      const matchCol = error.message?.match(/Could not find the '([^']+)' column/i)
      if (matchCol && matchCol[1]) {
        const missingCol = matchCol[1]
        console.log(`[registrarEmpresaAction] Removiendo columna inexistente '${missingCol}' del payload`)
        delete currentPayload[missingCol]
        continue
      }

      // 2. Caso: demanda espera tipo TEXT en lugar de array TEXT[]
      if (error.code === '22P02' || error.message?.includes('array') || error.message?.includes('syntax for type text')) {
        if (Array.isArray(currentPayload.demanda)) {
          console.log('[registrarEmpresaAction] Convirtiendo demanda array a string plano...')
          currentPayload.demanda = (currentPayload.demanda as string[]).join(', ')
          continue
        }
      }

      // 3. Caso: la tabla usa nombre_empresa / sector en lugar de nombre / rubro
      if (currentPayload.nombre && !currentPayload.nombre_empresa && (error.message?.includes('nombre') || error.code === 'PGRST204')) {
        currentPayload.nombre_empresa = currentPayload.nombre
        delete currentPayload.nombre
        continue
      }
      if (currentPayload.rubro && !currentPayload.sector && (error.message?.includes('rubro') || error.code === 'PGRST204')) {
        currentPayload.sector = currentPayload.rubro
        delete currentPayload.rubro
        continue
      }
      if (currentPayload.oferta && !currentPayload.descripcion_oferta && (error.message?.includes('oferta') || error.code === 'PGRST204')) {
        currentPayload.descripcion_oferta = currentPayload.oferta
        delete currentPayload.oferta
        continue
      }

      // 4. Asegurar que latitud y longitud nunca se pierdan si hay un error NOT NULL
      if (error.code === '23502') {
        if (!currentPayload.latitud) currentPayload.latitud = -35.6738
        if (!currentPayload.longitud) currentPayload.longitud = -59.7781
        continue
      }

      // Si no es un error recuperable, retornar detalle
      return {
        success: false,
        error: `Error de base de datos (${error.code || '400'}): ${error.message}`,
        details: error.details,
      }
    }

    return { success: false, error: 'No se pudo completar el registro después de los reintentos de compatibilidad.' }
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
