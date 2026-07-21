import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { NewsWallMulticanal } from '@/components/comunicacion/NewsWallMulticanal'
import { createClient } from '@/lib/supabase/server'
import type { NotaMedio } from '@/services/news'

export const metadata: Metadata = {
  title: 'Prensa — ITEC',
}

async function getPressNotas() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notas_medios')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[pressNews] getPressNotas error:', error.message)
    return []
  }
  return (data ?? []) as NotaMedio[]
}

export default async function PressNewsPage() {
  const member = await getCurrentMember()
  if (!member || member.role !== 'admin') redirect('/dashboard')

  const notas = await getPressNotas()
  const pressFlashes = notas.map((n) => ({
    id: n.id,
    created_at: n.created_at,
    updated_at: n.updated_at,
    autor_id: n.autor_id,
    titulo: n.titulo,
    datos_crudos: '',
    texto_publico: '',
    texto_miembros: '',
    texto_sponsors: '',
    texto_medios: n.contenido,
    is_published: n.is_published,
    para_publico: false,
    para_miembros: false,
    para_sponsors: false,
    para_medios: true,
  }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Prensa</h1>
        <p className="text-white/60 text-sm">
          Gacetillas y comunicados para medios de comunicación
        </p>
      </div>

      <NewsWallMulticanal
        publicFlashes={[]}
        memberFlashes={null}
        sponsorFlashes={null}
        pressFlashes={pressFlashes}
      />
    </div>
  )
}