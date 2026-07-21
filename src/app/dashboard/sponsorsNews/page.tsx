import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { NewsWallMulticanal } from '@/components/comunicacion/NewsWallMulticanal'
import { createClient } from '@/lib/supabase/server'
import type { NotaSponsor } from '@/services/news'

export const metadata: Metadata = {
  title: 'Muro Sponsors — ITEC',
}

async function getSponsorNotas() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notas_sponsors')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[sponsorsNews] getSponsorNotas error:', error.message)
    return []
  }
  return (data ?? []) as NotaSponsor[]
}

export default async function SponsorsNewsPage() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') redirect('/dashboard')

  const notas = await getSponsorNotas()
  const sponsorFlashes = notas.map((n) => ({
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
    is_published: n.is_published,
    para_publico: false,
    para_miembros: false,
    para_sponsors: true,
    para_medios: false,
  }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Muro Sponsors</h1>
        <p className="text-white/60 text-sm">
          Noticias y reportes para sponsors del ecosistema ITEC
        </p>
      </div>

      <NewsWallMulticanal
        publicFlashes={[]}
        memberFlashes={null}
        sponsorFlashes={sponsorFlashes}
        pressFlashes={null}
      />
    </div>
  )
}