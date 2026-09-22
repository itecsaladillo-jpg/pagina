import { createClient } from '@/lib/supabase/server'

/**
 * Helper centralizado de servidor para resolver valores de configuración.
 * Estrategia FALLBACK HYBRID:
 * 1. Consulta la tabla `api_settings` (tabla genérica clave/valor).
 * 2. Si no existe o está vacía → retorna `process.env[envVarName]`.
 * 3. Caché a nivel de request para no saturar la BD en llamadas consecutivas.
 */

let _settingsCache: Map<string, string> | null = null

function getCache(): Map<string, string> {
  if (!_settingsCache) {
    _settingsCache = new Map()
  }
  return _settingsCache
}

export async function getSettingValue(
  key: string,
  envVarName?: string
): Promise<string> {
  const cache = getCache()
  if (cache.has(key)) return cache.get(key)!

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('api_settings')
      .select('key, value')
      .eq('key', key)
      .single()

    if (!error && data && data.value && typeof data.value === 'string' && data.value.trim() !== '') {
      cache.set(key, data.value)
      return data.value
    }
  } catch {
    // Si la tabla no existe o hay error, caemos al fallback de env
  }

  const envValue = envVarName ? (process.env[envVarName] || '') : ''
  cache.set(key, envValue)
  return envValue
}
