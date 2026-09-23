import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GeneralMeetingRoom } from '@/components/reuniones/GeneralMeetingRoom'
import { getGeneralMeetUrlAction } from './actions'

export const metadata: Metadata = {
  title: 'Sala de Reuniones — ITEC',
}

export default async function ReunionesPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // ago 2026: las 3 consultas son independientes → en paralelo (antes en serie)
  const [meetUrl, { data: notes }, { data: history }] = await Promise.all([
    getGeneralMeetUrlAction(),
    supabase
      .from('meeting_notes')
      .select('content')
      .is('commission_id', null)
      .eq('session_date', today)
      .eq('is_active', true)
      .single(),
    supabase
      .from('meeting_notes')
      .select('id, content, session_date, created_at')
      .is('commission_id', null)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Sala de Reuniones</h1>
          <p className="text-[var(--text-muted)] text-sm">Espacio de encuentro institucional y memoria colaborativa</p>
        </div>
      </div>

      <GeneralMeetingRoom
        member={member}
        initialContent={notes?.content || ''}
        history={history || []}
        meetUrl={meetUrl}
      />
    </div>
  )
}
