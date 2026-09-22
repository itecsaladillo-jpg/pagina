import { createClient } from '@supabase/supabase-js'

export interface TestimonioSaladilloExport {
  id: string
  nombre: string
  foto_url: string
  ciudad_residencia: string
  pais_residencia: string
  escuela_origen: string
  profesion_rol: string
  mensaje_gratitud: string
  es_embajador: boolean
  orden_embajador: number | null
  estado: string
  created_at: string
}

export interface SaladilloExportData {
  embajadores: TestimonioSaladilloExport[]
  testimonios: TestimonioSaladilloExport[]
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getSaladilloExportData(): Promise<SaladilloExportData> {
  const [embajadoresResult, testimoniosResult] = await Promise.all([
    supabase
      .from('saladillo_for_export')
      .select('*')
      .eq('es_embajador', true)
      .eq('estado', 'aprobado')
      .not('orden_embajador', 'is', null)
      .order('orden_embajador', { ascending: true }),
    supabase
      .from('saladillo_for_export')
      .select('*')
      .eq('es_embajador', false)
      .eq('estado', 'aprobado')
      .order('created_at', { ascending: false }),
  ])

  if (embajadoresResult.error) {
    console.error('[saladillo-export] Error obteniendo embajadores:', embajadoresResult.error.message)
  }
  if (testimoniosResult.error) {
    console.error('[saladillo-export] Error obteniendo testimonios:', testimoniosResult.error.message)
  }

  return {
    embajadores: (embajadoresResult.data as TestimonioSaladilloExport[] | null) ?? [],
    testimonios: (testimoniosResult.data as TestimonioSaladilloExport[] | null) ?? [],
  }
}
