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

    const currentPayload: Record<string, unknown> = {
      nombre: input.nombre?.trim(),
      nombre_empresa: input.nombre?.trim(),
      rubro: input.rubro?.trim(),
      sector: input.rubro?.trim(),
      email: input.email?.trim().toLowerCase(),
      telefono: input.telefono?.trim() || null,
      oferta: input.oferta?.trim(),
      descripcion_oferta: input.oferta?.trim(),
      oferta_producto_servicio: input.oferta?.trim(),
      demanda: Array.isArray(input.demanda) ? input.demanda : [],
      detalles_demanda: input.detalles_demanda?.trim() || null,
      descripcion_demanda: input.detalles_demanda?.trim() || null,
      desafio_tecnologico: input.desafio_tecnologico?.trim() || null,
      direccion: input.direccion?.trim() || 'Saladillo, Buenos Aires',
      latitud,
      longitud,
      is_active: true,
    }

    let lastError: { code?: string; message?: string; details?: string } = {}

    for (let intento = 0; intento < 8; intento++) {
      const { data, error } = await supabase
        .from('mapa_empresas')
        .insert(currentPayload)
        .select()

      if (!error) {
        return { success: true, data }
      }

      lastError = error
      console.warn(`[registrarEmpresaAction] Intento ${intento + 1} falló (${error.code}): ${error.message}`)

      // 1. Caso: Columna no existe en el schema cache (PGRST204)
      const matchCol = error.message?.match(/Could not find the '([^']+)' column/i)
      if (matchCol && matchCol[1]) {
        const missingCol = matchCol[1]
        console.log(`[registrarEmpresaAction] Removiendo columna inexistente '${missingCol}' del payload`)
        delete currentPayload[missingCol]
        continue
      }

      // 2. Caso: Columna NOT NULL violada (23502) -> autocompletar con el dato correspondiente
      const matchNotNull = error.message?.match(/null value in column "([^"]+)"/i)
      if (matchNotNull && matchNotNull[1]) {
        const col = matchNotNull[1].toLowerCase()
        console.warn(`[registrarEmpresaAction] Auto-llenando columna NOT NULL requerida: ${col}`)

        if (col.includes('oferta')) {
          currentPayload[matchNotNull[1]] = input.oferta?.trim() || 'Servicios y productos generales'
        } else if (col.includes('demanda')) {
          const val = Array.isArray(input.demanda) && input.demanda.length > 0
            ? input.demanda.join(', ')
            : (input.detalles_demanda?.trim() || 'Innovación y vinculación técnica')
          currentPayload[matchNotNull[1]] = val
        } else if (col.includes('rubro') || col.includes('sector') || col.includes('actividad')) {
          currentPayload[matchNotNull[1]] = input.rubro?.trim() || 'General'
        } else if (col.includes('nombre') || col.includes('empresa') || col.includes('razon')) {
          currentPayload[matchNotNull[1]] = input.nombre?.trim() || 'Empresa Local'
        } else if (col.includes('desafio')) {
          currentPayload[matchNotNull[1]] = input.desafio_tecnologico?.trim() || 'Desafíos de innovación productiva'
        } else if (col.includes('mail') || col.includes('correo')) {
          currentPayload[matchNotNull[1]] = input.email?.trim().toLowerCase() || 'contacto@empresa.com'
        } else if (col.includes('tel')) {
          currentPayload[matchNotNull[1]] = input.telefono?.trim() || 'Sin teléfono'
        } else if (col.includes('dir')) {
          currentPayload[matchNotNull[1]] = input.direccion?.trim() || 'Saladillo, Buenos Aires'
        } else if (col.includes('lat')) {
          currentPayload[matchNotNull[1]] = -35.6738
        } else if (col.includes('lon') || col.includes('lng')) {
          currentPayload[matchNotNull[1]] = -59.7781
        } else if (col === 'is_active' || col === 'activo') {
          currentPayload[matchNotNull[1]] = true
        } else if (col === 'id') {
          currentPayload[matchNotNull[1]] = crypto.randomUUID()
        } else {
          currentPayload[matchNotNull[1]] = input.nombre?.trim() || 'General'
        }
        continue
      }

      // 3. Caso: demanda espera TEXT simple en lugar de array TEXT[]
      if (error.code === '22P02' || error.message?.includes('array') || error.message?.includes('syntax for type text')) {
        if (Array.isArray(currentPayload.demanda)) {
          console.log('[registrarEmpresaAction] Convirtiendo demanda array a string plano...')
          currentPayload.demanda = (currentPayload.demanda as string[]).join(', ')
          continue
        }
      }

      // 4. Caso: la tabla usa nombres alternativos
      if (currentPayload.nombre && !currentPayload.nombre_empresa && error.message?.includes('nombre')) {
        currentPayload.nombre_empresa = currentPayload.nombre
        delete currentPayload.nombre
        continue
      }
      if (currentPayload.rubro && !currentPayload.sector && error.message?.includes('rubro')) {
        currentPayload.sector = currentPayload.rubro
        delete currentPayload.rubro
        continue
      }
      if (currentPayload.oferta && !currentPayload.descripcion_oferta && error.message?.includes('oferta')) {
        currentPayload.descripcion_oferta = currentPayload.oferta
        delete currentPayload.oferta
        continue
      }

      // Si es otro error no recuperable, salir informando el detalle
      return {
        success: false,
        error: `Error de base de datos (${error.code || '400'}): ${error.message}`,
        details: error.details,
      }
    }

    return {
      success: false,
      error: `Error al registrar empresa (${lastError.code || 'BD'}): ${lastError.message || 'Error desconocido'}`,
      details: lastError.details,
    }
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
