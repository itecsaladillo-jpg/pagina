import type { Metadata } from 'next'
import { getCurrentMember } from '@/services/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Plus, Users, Calendar, ArrowUpRight, Filter } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Gestión de Acciones de Impacto — ITEC',
}

export default async function AccionesDashboardPage() {
  const member = await getCurrentMember()
  if (!member || member.status !== 'activo') redirect('/acceso-pendiente')

  const supabase = await createClient()
  const { data: actions } = await supabase
    .from('itec_actions')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      {/* Header con Acción Principal */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Centro de Gestión de Eventos</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Administrá las capacitaciones y acciones de impacto institucional hacia la comunidad.
          </p>
        </div>
        
        <Link 
          href="/dashboard/acciones/nueva"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
        >
          <Plus size={18} />
          Nueva Acción de Impacto
        </Link>
      </div>

      {/* Stats Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Acciones Activas', value: actions?.filter(a => a.status === 'en_curso').length || 0, icon: Calendar, color: 'text-blue-400' },
          { label: 'Total Inscriptos (Mes)', value: '124', icon: Users, color: 'text-purple-400' },
          { label: 'Impacto Regional', value: 'Saladillo +3', icon: ArrowUpRight, color: 'text-green-400' },
        ].map((stat, i) => (
          <div key={i} className="glass border border-white/5 rounded-2xl p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Listado de Acciones */}
      <div className="glass border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Cronograma de Impacto</h2>
          <button className="text-[var(--text-muted)] hover:text-white transition-colors">
            <Filter size={18} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest border-b border-white/5">
                <th className="px-8 py-4">Acción / Título</th>
                <th className="px-8 py-4">Tipo</th>
                <th className="px-8 py-4">Estado</th>
                <th className="px-8 py-4">Inscriptos</th>
                <th className="px-8 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {actions?.map((action) => (
                <tr key={action.id} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-sm font-bold text-white mb-1">{action.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {action.start_date ? new Date(action.start_date).toLocaleDateString('es-AR') : 'Sin fecha'}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                      {action.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`
                      text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded
                      ${action.status === 'en_curso' ? 'bg-blue-500/10 text-blue-400' : 
                        action.status === 'finalizada' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-[var(--text-muted)]'}
                    `}>
                      {action.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-[var(--text-muted)]" />
                      <span className="text-sm text-white font-medium">--</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link 
                      href={`/dashboard/acciones/${action.id}`}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
                    >
                      Gestionar
                    </Link>
                  </td>
                </tr>
              ))}
              {(!actions || actions.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-[var(--text-muted)] italic text-sm">
                    No hay acciones registradas. Comenzá creando una nueva acción de impacto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
