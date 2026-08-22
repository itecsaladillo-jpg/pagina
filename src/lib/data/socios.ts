import { createClient } from '@supabase/supabase-js'
import type { SponsorTier } from '@/types/database'

export interface SocioSponsor {
  id: string
  name: string
  tier: SponsorTier | null
  logo_color_url: string | null
  resena: string | null
  website_url: string | null
  email: string | null
}

export interface SocioAlianza {
  id: string
  name: string
  category: string | null
  actions_description: string | null
  logo_url: string | null
}

export interface SocioCanalDifusion {
  id: string
  nombre_medio: string
  tipo_medio: string | null
  url_web: string | null
  email: string | null
}

export interface SociosData {
  sponsors: SocioSponsor[]
  alianzas: SocioAlianza[]
  canalesDifusion: SocioCanalDifusion[]
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getSociosData(): Promise<SociosData> {
  const [sponsorsResult, alianzasResult, canalesResult] = await Promise.all([
    supabase.rpc('obtener_sponsors_publicos'),
    supabase
      .from('strategic_partners')
      .select('id, name, category, actions_description, logo_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('medios_prensa')
      .select('id, nombre_medio, tipo_medio, url_web, email')
      .not('nombre_medio', 'is', null)
      .order('nombre_medio', { ascending: true }),
  ])

  if (sponsorsResult.error) {
    console.error('[socios] Error obteniendo sponsors:', sponsorsResult.error.message)
  }
  if (alianzasResult.error) {
    console.error('[socios] Error obteniendo alianzas:', alianzasResult.error.message)
  }
  if (canalesResult.error) {
    console.error('[socios] Error obteniendo canales de difusión:', canalesResult.error.message)
  }

  return {
    sponsors: (sponsorsResult.data as SocioSponsor[] | null) ?? [],
    alianzas: (alianzasResult.data as SocioAlianza[] | null) ?? [],
    canalesDifusion: (canalesResult.data as SocioCanalDifusion[] | null) ?? [],
  }
}
