import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { HISTORICAL_ACTIONS_DATA, type HistoricalAction } from '@/data/historicalActions'
import type { ArchivoAccion } from '@/types/database'

export async function getHistoricalActions(): Promise<Record<number, HistoricalAction[]>> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return HISTORICAL_ACTIONS_DATA
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase
      .from('archivo_acciones')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      return HISTORICAL_ACTIONS_DATA
    }

    // Convertir registros de BD al formato HistoricalAction
    const dbActions: HistoricalAction[] = (data as ArchivoAccion[]).map(item => ({
      id: item.id,
      title: item.title,
      year: item.year,
      date: item.created_at ? new Date(item.created_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : undefined,
      category: item.category || 'General',
      socialUrl: item.social_url,
      platform: item.social_url.includes('instagram.com') ? 'instagram' : 'web',
      description: item.description || undefined
    }))

    // Inicializar con los años requeridos
    const grouped: Record<number, HistoricalAction[]> = {
      2025: [],
      2024: [],
      2023: [],
      2022: []
    }

    // Agregar primero las acciones de la BD
    for (const item of dbActions) {
      if (!grouped[item.year]) grouped[item.year] = []
      grouped[item.year].push(item)
    }

    // Complementar con las acciones base si no existen en BD (evitar duplicados por título exacto)
    for (const [yearStr, baseItems] of Object.entries(HISTORICAL_ACTIONS_DATA)) {
      const year = Number(yearStr)
      if (!grouped[year]) grouped[year] = []
      for (const baseItem of baseItems) {
        const exists = grouped[year].some(
          existing => existing.title.trim().toLowerCase() === baseItem.title.trim().toLowerCase()
        )
        if (!exists) {
          grouped[year].push(baseItem)
        }
      }
    }

    return grouped
  } catch (err) {
    console.error('[historicalActionsService] Error fetching actions from Supabase:', err)
    return HISTORICAL_ACTIONS_DATA
  }
}
