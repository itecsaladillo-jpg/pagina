import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { NewsWallMulticanal } from '@/components/comunicacion/NewsWallMulticanal'
import type { NotaPublico, NotaMiembro } from '@/services/news'

export const metadata: Metadata = {
  title: 'Muro — ITEC',
  description: 'Novedades y comunicaciones del Instituto',
}

async function getPublicNotas() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notas_publico')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[public-muro] getPublicNotas error:', error.message)
    return []
  }
  return (data ?? []) as NotaPublico[]
}

async function getMemberNotas() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('notas_miembros')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[public-muro] getMemberNotas error:', error.message)
    return null
  }
  return (data ?? []) as NotaMiembro[]
}

export default async function MuroPage() {
  const notasPublico = await getPublicNotas()
  const notasMiembros = await getMemberNotas()

  const publicFlashes = notasPublico.map((n) => ({
    id: n.id,
    created_at: n.created_at,
    updated_at: n.updated_at,
    autor_id: n.autor_id,
    titulo: n.titulo,
    datos_crudos: '',
    texto_publico: n.contenido,
    texto_miembros: '',
    texto_sponsors: '',
    texto_medios: '',
    is_published: n.is_published,
    para_publico: true,
    para_miembros: false,
    para_sponsors: false,
    para_medios: false,
  }))

  const memberFlashes = notasMiembros?.map((n) => ({
    id: n.id,
    created_at: n.created_at,
    updated_at: n.updated_at,
    autor_id: n.autor_id,
    titulo: n.titulo,
    datos_crudos: '',
    texto_publico: '',
    texto_miembros: n.contenido,
    texto_sponsors: '',
    texto_medios: '',
    is_published: n.is_published,
    para_publico: false,
    para_miembros: true,
    para_sponsors: false,
    para_medios: false,
  })) ?? null

  return (
    <main className='min-h-screen bg-[#020617] pt-32 pb-20 px-6'>
      <div className='max-w-4xl mx-auto space-y-16'>
        <div className='text-center space-y-6'>
          <h1 className='text-4xl md:text-5xl font-bold text-white'>
            Muro de Noticias
          </h1>
          <p className='text-white/60 max-w-2xl mx-auto'>
            Contenido publico y comentarios internos del ecosistema ITEC
          </p>
        </div>

        <NewsWallMulticanal
          publicFlashes={publicFlashes}
          memberFlashes={memberFlashes}
        />
      </div>
    </main>
  )
}