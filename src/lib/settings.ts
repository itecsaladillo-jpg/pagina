import { createClient } from '@/lib/supabase/server'

/**
 * Caché a nivel de request para evitar queries repetidas a site_settings
 * durante el ciclo de vida de una sola petición server-side.
 */
let _settingsCache: Record<string, unknown> | null = null

async function getSiteSettings(): Promise<Record<string, unknown>> {
  if (_settingsCache) return _settingsCache

  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('api_keys')
    .limit(1)
    .single()

  _settingsCache = (data?.api_keys as Record<string, unknown>) || {}
  return _settingsCache
}

/**
 * Resuelve un valor de configuración con estrategia de fallback:
 * 1. Busca en la columna `api_keys` de la tabla `site_settings` (Supabase).
 * 2. Si no existe o está vacío, retorna `process.env[envVarName]`.
 * 3. Si no hay envVarName, retorna cadena vacía.
 *
 * @param key - Nombre de la clave en el JSONB api_keys (ej: "OPENROUTER_API_KEY")
 * @param envVarName - Nombre de la variable de entorno como fallback (ej: "OPENROUTER_API_KEY")
 * @returns El valor resuelto, o cadena vacía si no se encuentra.
 *
 * @example
 * const apiKey = await getSettingValue('OPENROUTER_API_KEY', 'OPENROUTER_API_KEY')
 */
export async function getSettingValue(
  key: string,
  envVarName?: string
): Promise<string> {
  const settings = await getSiteSettings()
  const dbValue = settings[key]

  if (typeof dbValue === 'string' && dbValue.trim() !== '') {
    return dbValue
  }

  if (envVarName && process.env[envVarName]) {
    return process.env[envVarName]!
  }

  return ''
}

/**
 * Invalida la caché de settings. Útil después de un update
 * para que la siguiente lectura obtenga los valores frescos.
 */
export function invalidateSettingsCache(): void {
  _settingsCache = null
}
