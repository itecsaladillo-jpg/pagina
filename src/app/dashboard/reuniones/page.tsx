import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GeneralMeetingRoom } from '@/components/reuniones/GeneralMeetingRoom'

export const metadata: Metadata = {
  title: 'Sala de Reuniones General — ITEC',
}

const MEET_LINK = process.env.NEXT_PUBLIC_MEET_LINK ?? 'https://meet.google.com/itec-general'

export default async function ReunionesPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // 1. Cargar nota activa (General)
  const { data: notes } = await supabase
    .from('meeting_notes')
    .select('content')
    .is('commission_id', null)
    .eq('session_date', today)
    .eq('is_active', true)
    .single()

  // 2. Cargar historial de reuniones (General)
  const { data: history } = await supabase
    .from('news_flashes')
    .select('*')
    .is('commission_id', null)
    .eq('source_type', 'reunion')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(6)

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
        meetLink={MEET_LINK}
        history={history || []}
      />
    </div>
  )
}
