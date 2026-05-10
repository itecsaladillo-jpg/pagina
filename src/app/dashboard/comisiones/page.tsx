import { getCurrentMember } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateCommissionForm } from './CreateCommissionForm'
import { toggleCommissionStatusAction } from './actions'
import { MeetLinkEditor } from './MeetLinkEditor'

export default async function ComisionesAdminPage() {
  const admin = await getCurrentMember()

  if (!admin || admin.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: commissions } = await supabase
    .from('commissions')
    .select(`
      *,
      commission_members ( count )
    `)
    .order('name')

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Comisiones</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Gestioná los grupos de trabajo y áreas operativas del ITEC.
          </p>
        </div>
        <CreateCommissionForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {commissions?.map((c) => (
          <div 
            key={c.id} 
            className={`glass border transition-all ${
              c.is_active ? 'border-[var(--border-subtle)]' : 'border-red-900/30 opacity-60'
            } rounded-2xl p-6 flex flex-col`}
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${c.color}20`, border: `1px solid ${c.color}40` }}
              >
                {c.icon || '👥'}
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  c.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {c.is_active ? 'Activa' : 'Inactiva'}
                </span>
                <span className="text-[var(--text-muted)] text-[10px] mt-1">
                  {c.commission_members?.[0]?.count || 0} miembros
                </span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{c.name}</h3>
            <p className="text-[var(--text-secondary)] text-xs mb-6 flex-1 line-clamp-3">
              {c.description || 'Sin descripción.'}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
              <span className="text-[var(--text-muted)] text-[10px] font-mono">
                /{c.slug}
              </span>
              <form action={async () => {
                'use server'
                await toggleCommissionStatusAction(c.id, !c.is_active)
              }}>
                <button 
                  type="submit"
                  className={`text-[10px] font-bold uppercase transition-colors ${
                    c.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                  }`}
                >
                  {c.is_active ? 'Desactivar' : 'Activar'}
                </button>
              </form>
            </div>

            {/* Editor de Link de Meet — solo visible para admin */}
            <MeetLinkEditor
              commissionId={c.id}
              commissionName={c.name}
              currentLink={c.meet_link || null}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
