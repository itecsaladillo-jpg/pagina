import { getCurrentMember } from '@/services/auth'
import { getAllMembersWithCommissions } from '@/services/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberManagementTable } from './MemberManagementTable'

export default async function MiembrosAdminPage() {
  const admin = await getCurrentMember()

  // Seguridad: Solo el admin puede ver esta página
  if (!admin || admin.role !== 'admin') {
    redirect('/dashboard')
  }

  const members = await getAllMembersWithCommissions()
  
  // Obtener lista de comisiones para los dropdowns
  const supabase = await createClient()
  const { data: commissions } = await supabase
    .from('commissions')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const pendingCount = members.filter(m => m.status === 'pendiente').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Gestión de Miembros</h1>
        <p className="text-[var(--text-secondary)] text-sm">
          Aprobá nuevos ingresos, asigná comisiones y gestioná roles de la organización.
        </p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass border border-[var(--border-subtle)] rounded-xl p-5">
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest mb-1">Total Miembros</p>
          <p className="text-2xl font-bold text-white">{members.length}</p>
        </div>
        <div className="glass border border-amber-500/20 rounded-xl p-5">
          <p className="text-amber-400/60 text-xs uppercase tracking-widest mb-1">Pendientes de Aprobación</p>
          <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
        </div>
        <div className="glass border border-[var(--accent-primary)]/20 rounded-xl p-5">
          <p className="text-[var(--accent-primary-2)] text-xs uppercase tracking-widest mb-1">Comisiones Activas</p>
          <p className="text-2xl font-bold text-white">{commissions?.length || 0}</p>
        </div>
      </div>

      {/* Tabla de gestión */}
      <div className="glass border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[var(--border-subtle)] bg-white/5">
          <h2 className="text-lg font-semibold text-white">Listado de Usuarios</h2>
        </div>
        <MemberManagementTable 
          members={members} 
          commissions={commissions || []} 
        />
      </div>
    </div>
  )
}
