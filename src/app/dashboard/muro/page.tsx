import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { NewsWallMulticanal } from '@/components/comunicacion/NewsWallMulticanal'
import { createClient } from '@/lib/supabase/server'
import type { NotaMiembro } from '@/services/news'

export const metadata: Metadata = {
  title: 'Muro de Noticias — ITEC',
}

async function getMemberNotas() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notas_miembros')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[dashboard-muro] getMemberNotas error:', error.message)
    return []
  }
  return (data ?? []) as NotaMiembro[]
}

export default async function MuroPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')

  const notas = await getMemberNotas()
  const memberFlashes = notas.map((n) => ({
    id: n.news_flash_id ?? n.id,
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
    media_urls: n.media_urls,
  }))

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-[var(--accent-primary-2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Muro de Noticias</h1>
          </div>
          <p className="text-[var(--text-secondary)] text-sm">
            Noticias internas del ecosistema ITEC
          </p>
        </div>

        {['admin', 'coordinador'].includes(member.role) && (
          <a href="/dashboard/comunicacion" className="btn-primary text-xs px-4 py-2.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 21.118a7.5 7.0 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span>Comunicación Estratégica</span>
          </a>
        )}
      </div>

      <NewsWallMulticanal
        publicFlashes={[]}
        memberFlashes={memberFlashes}
        defaultTab="interno"
        hideTabs={true}
      />
    </div>
  )
}
