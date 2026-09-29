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

    const latitud = typeof input.latitud === 'number' && !isNaN(input.latitud) ? input.latitud : -35.637
    const longitud = typeof input.longitud === 'number' && !isNaN(input.longitud) ? input.longitud : -59.778

    // Lista de demandas como array estándar
    const demandaArray = Array.isArray(input.demanda) ? input.demanda : (input.demanda ? [input.demanda] : [])
    const demandaString = demandaArray.join(', ') || input.detalles_demanda?.trim() || 'Innovación'

    // Payload inicial con columnas canónicas
    let currentPayload: Record<string, unknown> = {
      nombre: input.nombre?.trim(),
      rubro: input.rubro?.trim(),
      email: input.email?.trim().toLowerCase(),
      telefono: input.telefono?.trim() || null,
      oferta: input.oferta?.trim(),
      demanda: demandaArray, // Por defecto array TEXT[] como define el esquema de Supabase
      detalles_demanda: input.detalles_demanda?.trim() || null,
      desafio_tecnologico: input.desafio_tecnologico?.trim() || null,
      direccion: input.direccion?.trim() || 'Saladillo, Buenos Aires',
      latitud,
      longitud,
      is_active: true,
    }

    let lastError: { code?: string; message?: string; details?: string } = {}
    const estrategiasAplicadas = new Set<string>()

    for (let intento = 0; intento < 10; intento++) {
      const { data, error } = await supabase
        .from('mapa_empresas')
        .insert(currentPayload)
        .select()

      if (!error) {
        return { success: true, data }
      }

      lastError = error
      console.warn(`[registrarEmpresaAction] Intento ${intento + 1} falló (${error.code}): ${error.message}`)

      // 1. Caso: Columna no existe en la tabla en Supabase (PGRST204)
      const matchCol = error.message?.match(/Could not find the '([^']+)' column/i)
      if (matchCol && matchCol[1]) {
        const missingCol = matchCol[1]
        console.log(`[registrarEmpresaAction] Removiendo columna inexistente '${missingCol}'`)
        
        // Si falta una columna principal, migrar al nombre alternativo antes de borrar
        if (missingCol === 'nombre' && !currentPayload.nombre_empresa) {
          currentPayload.nombre_empresa = input.nombre?.trim()
        } else if (missingCol === 'rubro' && !currentPayload.sector) {
          currentPayload.sector = input.rubro?.trim()
        } else if (missingCol === 'oferta' && !currentPayload.descripcion_oferta) {
          currentPayload.descripcion_oferta = input.oferta?.trim()
        } else if (missingCol === 'detalles_demanda' && !currentPayload.descripcion_demanda) {
          currentPayload.descripcion_demanda = input.detalles_demanda?.trim() || demandaString
        } else if (missingCol === 'demanda' && !currentPayload.descripcion_demanda) {
          currentPayload.descripcion_demanda = demandaString
        }

        delete currentPayload[missingCol]
        continue
      }

      // 2. Caso: Error de array malformado (22P02: malformed array literal: "xxx")
      // Esto ocurre cuando una columna en PostgreSQL es de tipo ARRAY (TEXT[]) pero recibió un string plano,
      // o un trigger intentó asignar un string a una columna de tipo array.
      const matchArrayLit = error.message?.match(/malformed array literal: "([^"]+)"/i)
      if (matchArrayLit && matchArrayLit[1]) {
        const literalVal = matchArrayLit[1].trim()
        console.warn(`[registrarEmpresaAction] Corrigiendo error 22P02 con literal: "${literalVal}"`)

        let corregido = false

        // A. Buscar en currentPayload cualquier columna string cuyo valor coincida total o parcialmente con literalVal
        const matchingKeys = Object.entries(currentPayload)
          .filter(([_, v]) => typeof v === 'string' && (
            (v as string).trim().toLowerCase() === literalVal.toLowerCase() ||
            (v as string).trim().toLowerCase().includes(literalVal.toLowerCase()) ||
            literalVal.toLowerCase().includes((v as string).trim().toLowerCase())
          ))
          .map(([k]) => k)

        for (const k of matchingKeys) {
          const strategyKey = `array_${k}_${literalVal}`
          if (!estrategiasAplicadas.has(strategyKey)) {
            estrategiasAplicadas.add(strategyKey)
            console.log(`[registrarEmpresaAction] Convirtiendo campo '${k}' a array JS: [${JSON.stringify(currentPayload[k])}]`)
            currentPayload[k] = [currentPayload[k]]
            corregido = true
          } else {
            // Si ya se intentó convertir a array y la base de datos sigue fallando (por ejemplo por trigger conflictivo),
            // removemos la columna de la inserción directa o la unificamos
            const removeKey = `remove_${k}`
            if (!estrategiasAplicadas.has(removeKey)) {
              estrategiasAplicadas.add(removeKey)
              console.log(`[registrarEmpresaAction] Removiendo campo conflictivo '${k}' de la inserción directa`)
              if (k.includes('demanda')) {
                if (Array.isArray(currentPayload.demanda)) {
                  currentPayload.demanda = [...(currentPayload.demanda as string[]), literalVal]
                } else {
                  currentPayload.demanda = [literalVal]
                }
              }
              delete currentPayload[k]
              corregido = true
            }
          }
        }

        // B. Si ninguna clave de currentPayload coincidió directamente con literalVal
        if (!corregido) {
          if (typeof currentPayload.demanda === 'string') {
            currentPayload.demanda = demandaArray.length > 0 ? demandaArray : [literalVal]
            corregido = true
          } else if (Array.isArray(currentPayload.demanda)) {
            const nativeKey = 'demanda_native_format'
            if (!estrategiasAplicadas.has(nativeKey)) {
              estrategiasAplicadas.add(nativeKey)
              const elementos = (currentPayload.demanda as string[]).map(s => `"${s.replace(/"/g, '\\"')}"`).join(',')
              currentPayload.demanda = `{${elementos}}`
              corregido = true
            } else {
              const dropDemanda = 'drop_demanda_array'
              if (!estrategiasAplicadas.has(dropDemanda)) {
                estrategiasAplicadas.add(dropDemanda)
                delete currentPayload.demanda
                if (!currentPayload.descripcion_demanda) {
                  currentPayload.descripcion_demanda = demandaString
                }
                corregido = true
              }
            }
          }
        }

        // C. Fallback para posibles triggers en Supabase: si detalles_demanda está presente y causó conflicto
        if (!corregido && currentPayload.detalles_demanda) {
          console.warn('[registrarEmpresaAction] Removiendo detalles_demanda para evitar fallo de trigger con demanda')
          if (!currentPayload.descripcion_demanda) {
            currentPayload.descripcion_demanda = currentPayload.detalles_demanda
          }
          delete currentPayload.detalles_demanda
          corregido = true
        }

        if (corregido) continue
      }

      // 3. Caso: Incompatibilidad inversa: la columna en la BD es TEXT plano y no acepta array (42804 o mensaje de type mismatch)
      if (
        error.code === '42804' ||
        error.message?.includes('cannot cast type text[] to text') ||
        error.message?.includes('is of type text but expression is of type text[]')
      ) {
        if (Array.isArray(currentPayload.demanda)) {
          console.log('[registrarEmpresaAction] La columna demanda es TEXT plano; convirtiendo array a string...')
          currentPayload.demanda = demandaString
          continue
        }
        if (Array.isArray(currentPayload.rubro)) {
          currentPayload.rubro = input.rubro?.trim() || 'General'
          continue
        }
        if (Array.isArray(currentPayload.sector)) {
          currentPayload.sector = input.rubro?.trim() || 'General'
          continue
        }
      }

      // 4. Caso: Violación de NOT NULL (23502) -> autocompletar respetando tipos
      const matchNotNull = error.message?.match(/null value in column "([^"]+)"/i)
      if (matchNotNull && matchNotNull[1]) {
        const col = matchNotNull[1].toLowerCase()
        const colExact = matchNotNull[1]
        console.warn(`[registrarEmpresaAction] Auto-llenando columna NOT NULL: ${colExact}`)

        if (col === 'demanda') {
          // Si la columna demanda es NOT NULL, verificar si es array o text
          currentPayload[colExact] = Array.isArray(currentPayload.demanda) ? demandaArray : demandaString
        } else if (col.includes('demanda')) {
          currentPayload[colExact] = input.detalles_demanda?.trim() || demandaString
        } else if (col.includes('oferta')) {
          currentPayload[colExact] = input.oferta?.trim() || 'Servicios y productos generales'
        } else if (col.includes('rubro') || col.includes('sector')) {
          currentPayload[colExact] = input.rubro?.trim() || 'General'
        } else if (col.includes('nombre') || col.includes('empresa') || col.includes('razon')) {
          currentPayload[colExact] = input.nombre?.trim() || 'Empresa Local'
        } else if (col.includes('desafio')) {
          currentPayload[colExact] = input.desafio_tecnologico?.trim() || 'Desafíos de innovación productiva'
        } else if (col.includes('mail') || col.includes('correo')) {
          currentPayload[colExact] = input.email?.trim().toLowerCase() || 'contacto@empresa.com'
        } else if (col.includes('tel')) {
          currentPayload[colExact] = input.telefono?.trim() || 'Sin teléfono'
        } else if (col.includes('dir')) {
          currentPayload[colExact] = input.direccion?.trim() || 'Saladillo, Buenos Aires'
        } else if (col.includes('lat')) {
          currentPayload[colExact] = latitud
        } else if (col.includes('lon') || col.includes('lng')) {
          currentPayload[colExact] = longitud
        } else if (col === 'is_active' || col === 'activo') {
          currentPayload[colExact] = true
        } else if (col === 'id') {
          currentPayload[colExact] = crypto.randomUUID()
        } else {
          currentPayload[colExact] = input.nombre?.trim() || 'General'
        }
        continue
      }

      // 5. Caso: nombres alternativos clásicos
      if (currentPayload.nombre && !currentPayload.nombre_empresa && error.message?.includes('nombre_empresa')) {
        currentPayload.nombre_empresa = currentPayload.nombre
        delete currentPayload.nombre
        continue
      }
      if (currentPayload.rubro && !currentPayload.sector && error.message?.includes('sector')) {
        currentPayload.sector = currentPayload.rubro
        delete currentPayload.rubro
        continue
      }
      if (currentPayload.oferta && !currentPayload.descripcion_oferta && error.message?.includes('descripcion_oferta')) {
        currentPayload.descripcion_oferta = currentPayload.oferta
        delete currentPayload.oferta
        continue
      }

      // Si no es un error recuperable, salir informando el detalle
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
