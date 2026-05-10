import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MeetingRoom } from './MeetingRoom'

export const metadata: Metadata = {
  title: 'Sala de Reuniones — ITEC',
}

// ─── Link fijo de Google Meet por comisión (configurar según corresponda) ───
const MEET_LINKS: Record<string, string> = {
  default: 'https://meet.google.com/itec-reunion',
  // 'uuid-de-comision': 'https://meet.google.com/xxx-yyy-zzz',
}

export default async function ReunionesPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')

  const supabase = await createClient()

  // Obtener la primera comisión del miembro
  const { data: memberCommissions } = await supabase
    .from('commission_members')
    .select('commission_id, is_coordinator, commissions(id, name)')
    .eq('member_id', member.id)
    .limit(1)
    .single()

  const commission = (memberCommissions?.commissions as any)

  // Sin comisión asignada
  if (!commission) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Sala de Reuniones</h1>
        <div className="glass border border-white/5 rounded-2xl p-12 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            Todavía no estás asignado a ninguna comisión. Un administrador lo configurará próximamente.
          </p>
        </div>
      </div>
    )
  }

  const commissionId = commission.id || commission[0]?.id
  const commissionName = commission.name || commission[0]?.name || 'Mi Comisión'

  // Cargar notas activas de la sesión actual
  const today = new Date().toISOString().split('T')[0]
  const { data: notes } = await supabase
    .from('meeting_notes')
    .select('content')
    .eq('commission_id', commissionId)
    .eq('session_date', today)
    .eq('is_active', true)
    .single()

  const meetLink = MEET_LINKS[commissionId] || MEET_LINKS.default
  const canFinalize = ['admin', 'coordinador'].includes(member.role)

  return (
    <div className="space-y-8">
      {/* Header con estado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sala de Reuniones</h1>
          <p className="text-[var(--text-secondary)] text-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {commissionName} · Sesión del {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Badge de Sala de Control */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
          Centro de Operaciones
        </div>
      </div>

      {/* Componente Principal */}
      <MeetingRoom
        commissionId={commissionId}
        commissionName={commissionName}
        initialContent={notes?.content || ''}
        meetLink={meetLink}
        canFinalize={canFinalize}
        memberName={member.full_name}
      />
    </div>
  )
}
