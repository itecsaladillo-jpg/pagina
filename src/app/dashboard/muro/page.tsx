import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { getNewsFlashes } from '@/services/news'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewsFeed } from './NewsFeed'

export const metadata: Metadata = {
  title: 'Muro de Noticias — ITEC',
}

export default async function MuroPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')

  const supabase = await createClient()

  // Cargar comisiones para el filtro
  const { data: commissions } = await supabase
    .from('commissions')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name')

  // Cargar comisión del miembro
  const { data: memberCommissions } = await supabase
    .from('commission_members')
    .select('commission_id, commissions(id, name, slug)')
    .eq('member_id', member.id)
    .limit(1)
    .single()

  const memberCommissionId = memberCommissions?.commission_id ?? null

  // Cargar noticias filtradas por la comisión del miembro (+ generales)
  const flashes = await getNewsFlashes(memberCommissionId ?? undefined)

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
            Resúmenes e información generada por IA sobre las actividades del ITEC
          </p>
        </div>

        {['admin', 'coordinador'].includes(member.role) && (
          <a href="/dashboard/ai" className="btn-primary text-xs px-4 py-2.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
            <span>Nuevo Flash IA</span>
          </a>
        )}
      </div>

      <NewsFeed
        initialFlashes={flashes}
        commissions={commissions ?? []}
        memberCommissionId={memberCommissionId}
      />
    </div>
  )
}
