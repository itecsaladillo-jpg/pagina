import { getCurrentMember } from '@/services/auth'
import { getAllMembersWithCommissions } from '@/services/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberManagementTable } from './MemberManagementTable'

export default async function MiembrosAdminPage() {
  const member = await getCurrentMember()

  // Seguridad: Solo los miembros activos pueden ver esta página
  if (!member) redirect('/login')
  if (member.status !== 'activo') redirect('/acceso-pendiente')

  const isAdminUser = member.role === 'admin'

  const members = await getAllMembersWithCommissions()
  
  // Obtener lista de comisiones para los dropdowns
  const supabase = await createClient()
  const { data: commissions } = await supabase
    .from('commissions')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const pendingCount = members.filter(m => m.status === 'pendiente').length
  const activeCount = members.filter(m => m.status === 'activo' || m.status === 'pre-aprobado').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {isAdminUser ? 'Gestión de Miembros' : 'Directorio de Miembros'}
        </h1>
        <p className="text-[var(--text-secondary)] text-sm">
          {isAdminUser 
            ? 'Aprobá nuevos ingresos, asigná comisiones y gestioná roles de la organización.' 
            : 'Conocé a los miembros del ITEC Saladillo, sus roles y comisiones.'}
        </p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass border border-[var(--border-subtle)] rounded-xl p-5">
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest mb-1">
            {isAdminUser ? 'Total Miembros' : 'Miembros Activos'}
          </p>
          <p className="text-2xl font-bold text-white">
            {isAdminUser ? members.length : activeCount}
          </p>
        </div>
        
        {isAdminUser ? (
          <div className="glass border border-amber-500/20 rounded-xl p-5">
            <p className="text-amber-400/60 text-xs uppercase tracking-widest mb-1">Pendientes de Aprobación</p>
            <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
          </div>
        ) : (
          <div className="glass border border-[var(--accent-primary)]/20 rounded-xl p-5">
            <p className="text-[var(--accent-primary-2)] text-xs uppercase tracking-widest mb-1">Tu Rol</p>
            <p className="text-2xl font-bold text-white capitalize">{member.role}</p>
          </div>
        )}

        <div className="glass border border-[var(--accent-primary)]/20 rounded-xl p-5">
          <p className="text-[var(--accent-primary-2)] text-xs uppercase tracking-widest mb-1">Comisiones Activas</p>
          <p className="text-2xl font-bold text-white">{commissions?.length || 0}</p>
        </div>
      </div>

      {/* Tabla de gestión / directorio */}
      <div className="glass border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[var(--border-subtle)] bg-white/5">
          <h2 className="text-lg font-semibold text-white">
            {isAdminUser ? 'Listado de Usuarios' : 'Nuestros Miembros'}
          </h2>
        </div>
        <MemberManagementTable 
          members={members} 
          commissions={commissions || []}
          currentUserRole={member.role}
        />
      </div>
    </div>
  )
}
