import { createClient } from '@/lib/supabase/server'

/**
 * Helper centralizado de servidor para resolver valores de configuración.
 * Estrategia FALLBACK HYBRID:
 * 1. Consulta la tabla `site_settings` (tabla genérica clave/valor).
 * 2. Si no existe o está vacía → retorna `process.env[envVarName]`.
 * 3. Caché a nivel de request para no saturar la BD en llamadas consecutivas.
 */

// Caché por request (AsyncLocalStorage o Map global per-request).
// Usamos un Map global que se limpia por invocación de getSettingValue
// cuando se llama con `resetCache`. Para requests server-side esto es seguro.
let _settingsCache: Map<string, string> | null = null

function getCache(): Map<string, string> {
  if (!_settingsCache) {
    _settingsCache = new Map()
  }
  return _settingsCache
}

export function resetSettingsCache(): void {
  _settingsCache = null
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

/**
 * Versión batch: obtiene múltiples valores en una sola query para reducir round-trips.
 * Devuelve un Map<key, value>.
 */
export async function getSettingValues(
  keys: { key: string; envVarName?: string }[]
): Promise<Map<string, string>> {
  const cache = getCache()
  const result = new Map<string, string>()
  const missingFromCache: { key: string; envVarName?: string }[] = []

  for (const entry of keys) {
    if (cache.has(entry.key)) {
      result.set(entry.key, cache.get(entry.key)!)
    } else {
      missingFromCache.push(entry)
    }
  }

  if (missingFromCache.length > 0) {
    try {
      const supabase = await createClient()
      const keyNames = missingFromCache.map((e) => e.key)
      const { data, error } = await supabase
        .from('api_settings')
        .select('key, value')
        .in('key', keyNames)

      const dbMap = new Map<string, string>()
      if (!error && data) {
        for (const row of data) {
          if (row.value && typeof row.value === 'string' && row.value.trim() !== '') {
            dbMap.set(row.key, row.value)
          }
        }
      }

      for (const entry of missingFromCache) {
        const value = dbMap.get(entry.key) || (entry.envVarName ? (process.env[entry.envVarName] || '') : '')
        cache.set(entry.key, value)
        result.set(entry.key, value)
      }
    } catch {
      for (const entry of missingFromCache) {
        const value = entry.envVarName ? (process.env[entry.envVarName] || '') : ''
        cache.set(entry.key, value)
        result.set(entry.key, value)
      }
    }
  }

  return result
}

/**
 * Enmascara un valor sensible para mostrarlo en UI.
 * Ejemplo: "sk-or-v1-abc123xyz789" → "sk-or-v1-••••••••••••789"
 */
export function maskValue(value: string): string {
  if (!value) return ''
  if (value.length <= 8) return '•'.repeat(value.length)
  const visibleStart = value.slice(0, 6)
  const visibleEnd = value.slice(-3)
  const masked = '•'.repeat(Math.min(value.length - 9, 16))
  return `${visibleStart}${masked}${visibleEnd}`
}
