import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notas_sponsors')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json([])
  }

  const flaques = (data ?? []).map((n: any) => ({
    id: n.id,
    created_at: n.created_at,
    updated_at: n.updated_at,
    autor_id: n.autor_id,
    titulo: n.titulo,
    datos_crudos: '',
    texto_publico: '',
    texto_miembros: '',
    texto_sponsors: n.contenido,
    texto_medios: '',
    media_urls: n.media_urls ?? [],
    is_published: n.is_published,
    para_publico: false,
    para_miembros: false,
    para_sponsors: true,
    para_medios: false,
  }))

  return NextResponse.json(flaques)
}
