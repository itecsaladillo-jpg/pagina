import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDriveFolderBySlug } from '@/lib/drive'

export const metadata: Metadata = {
  title: 'Mi Comisión — ITEC',
}

export default async function MiComisionPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')

  const supabase = await createClient()

  // Obtener comisiones del miembro con info completa
  const { data: memberCommissions } = await supabase
    .from('commission_members')
    .select(`
      is_coordinator,
      joined_at,
      commissions (
        id, name, slug, description, icon, color, is_active,
        members!commissions_coordinator_id_fkey ( id, full_name, avatar_url )
      )
    `)
    .eq('member_id', member.id)

  // Obtener compañeros de la primera comisión
  const firstCommissionId = memberCommissions?.[0]?.commissions?.id ?? null
  const firstCommissionSlug = memberCommissions?.[0]?.commissions?.slug ?? null

  const { data: companions } = firstCommissionId
    ? await supabase
        .from('commission_members')
        .select('members(id, full_name, avatar_url, role, join_date)')
        .eq('commission_id', firstCommissionId)
        .neq('member_id', member.id)
        .limit(10)
    : { data: null }

  const driveFolder = getDriveFolderBySlug(firstCommissionSlug)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Mi Comisión</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Información sobre tu comisión, compañeros y recursos compartidos
        </p>
      </div>

      {!memberCommissions || memberCommissions.length === 0 ? (
        <div className="glass border border-[var(--border-subtle)] rounded-xl p-12 text-center">
          <p className="text-[var(--text-muted)] text-sm">
            Aún no estás asignado a ninguna comisión. Un administrador te asignará próximamente.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {memberCommissions.map((mc) => {
            const commission = mc.commissions
            if (!commission) return null
            return (
              <div key={commission.id} className="glass border border-[var(--border-subtle)] rounded-xl p-6">
                {/* Header comisión */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-white">{commission.name}</h2>
                      {mc.is_coordinator && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium">
                          Coordinador/a
                        </span>
                      )}
                    </div>
                    {commission.description && (
                      <p className="text-[var(--text-secondary)] text-sm">{commission.description}</p>
                    )}
                  </div>
                  <span className="text-[var(--text-muted)] text-xs">
                    Desde {new Date(mc.joined_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {/* Compañeros */}
                {companions && companions.length > 0 && (
                  <div>
                    <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">
                      Miembros de la comisión
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {companions.map((c) => {
                        const m = c.members as { id: string; full_name: string; avatar_url: string | null; role: string } | null
                        if (!m) return null
                        return (
                          <div key={m.id} className="flex items-center gap-2 bg-black/30 border border-[var(--border-subtle)] rounded-lg px-3 py-2">
                            {m.avatar_url ? (
                              <img src={m.avatar_url} alt={m.full_name} className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-xs text-[var(--accent-primary-2)] font-bold">
                                {m.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-white text-xs font-medium">{m.full_name}</p>
                              <p className="text-[var(--text-muted)] text-[10px] capitalize">{m.role}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Google Drive */}
          <div className="glass border border-[var(--border-subtle)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.433 22.396l2.664-4.615H22l-2.664 4.615H4.433zm3.895-6.943L5.664 11h14.172l2.664 4.453H8.328zm3.84-6.7L8.504 4h7.164l3.664 6.346-3.664.407z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Google Drive — {driveFolder.commissionName}</h3>
                <p className="text-[var(--text-muted)] text-xs">{driveFolder.description}</p>
              </div>
            </div>
            <a
              href={driveFolder.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-xs py-2 px-4 inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Abrir carpeta de Drive
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
