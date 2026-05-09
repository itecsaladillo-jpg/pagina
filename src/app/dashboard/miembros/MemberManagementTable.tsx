'use client'

import { useState } from 'react'
import { approveMemberAction, updateRoleAction, assignCommissionAction, deactivateMemberAction } from './actions'
import type { Member, Commission } from '@/types/database'

interface Props {
  members: any[]
  commissions: Commission[]
}

export function MemberManagementTable({ members, commissions }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'all'>('pending')

  const handleApprove = async (id: string, isNew: boolean = true) => {
    setLoadingId(id)
    try {
      const res = await approveMemberAction(id, isNew) as any
      if (res.success) {
        if (isNew) {
          if (res.emailStatus === 'sent') {
            alert('¡Miembro aprobado y correo enviado con éxito!')
          } else {
            alert(`Miembro aprobado, pero el correo falló: ${res.emailError || 'Verificar dominio en Resend'}`)
          }
        } else {
          // Si no es nuevo, no mostramos lo del mail
          alert('¡Miembro re-habilitado con éxito!')
        }
      } else {
        alert('Error: ' + (res.error || 'No se pudo aprobar al miembro'))
      }
    } catch (err) {
      alert('Error crítico de conexión')
    }
    setLoadingId(null)
  }

  const handleRoleChange = async (id: string, role: string) => {
    setLoadingId(id)
    const res = await updateRoleAction(id, role as any)
    if (!res.success) alert('Error: ' + (res.error || 'No se pudo cambiar el rol'))
    setLoadingId(null)
  }

  const handleCommissionChange = async (id: string, commissionId: string) => {
    setLoadingId(id)
    const res = await assignCommissionAction(id, commissionId, false)
    if (!res.success) alert('Error: ' + (res.error || 'No se pudo asignar la comisión'))
    setLoadingId(null)
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Estás seguro de que querés deshabilitar a este miembro? Perderá el acceso al panel.')) return
    setLoadingId(id)
    const res = await deactivateMemberAction(id)
    if (!res.success) alert('Error: ' + (res.error || 'No se pudo deshabilitar'))
    setLoadingId(null)
  }

  const filteredMembers = members.filter(m => {
    if (activeTab === 'pending') return m.status === 'pendiente'
    if (activeTab === 'active') return m.status === 'activo'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas */}
      <div className="flex gap-4 border-b border-[var(--border-subtle)] pb-px">
        {[
          { id: 'pending', label: 'Pendientes', count: members.filter(m => m.status === 'pendiente').length },
          { id: 'active', label: 'Aprobados', count: members.filter(m => m.status === 'activo').length },
          { id: 'all', label: 'Todos', count: members.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-2 text-sm font-medium transition-all relative ${
              activeTab === tab.id ? 'text-[var(--accent-primary-2)]' : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                tab.id === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white'
              }`}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)] shadow-[0_0_10px_var(--accent-primary)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        {filteredMembers.length === 0 ? (
          <div className="py-20 text-center text-[var(--text-muted)] text-sm italic">
            No hay miembros en esta categoría.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[var(--text-secondary)] text-[10px] uppercase tracking-widest border-b border-[var(--border-subtle)]">
                <th className="py-4 px-4 font-medium">Miembro</th>
                <th className="py-4 px-4 font-medium">Estado</th>
                <th className="py-4 px-4 font-medium">Rol</th>
                <th className="py-4 px-4 font-medium">Comisión</th>
                <th className="py-4 px-4 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredMembers.map((m) => {
                const currentCommission = m.commission_members?.[0]?.commissions?.id || ''
                
                return (
                  <tr key={m.id} className="border-b border-[var(--border-subtle)] hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary-2)] font-bold text-xs">
                          {m.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{m.full_name}</p>
                          <p className="text-[var(--text-muted)] text-[11px]">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        m.status === 'activo' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <select 
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        disabled={loadingId === m.id}
                        className="bg-transparent text-[var(--text-secondary)] text-xs focus:text-white outline-none cursor-pointer hover:underline"
                      >
                        <option value="miembro">Miembro</option>
                        <option value="coordinador">Coordinador</option>
                        <option value="admin">Admin</option>
                        <option value="colaborador">Colaborador</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <select 
                        value={currentCommission}
                        onChange={(e) => handleCommissionChange(m.id, e.target.value)}
                        disabled={loadingId === m.id}
                        className="bg-transparent text-[var(--text-secondary)] text-xs focus:text-white outline-none cursor-pointer max-w-[140px] truncate hover:underline"
                      >
                        <option value="">Sin asignar</option>
                        {commissions.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {m.status === 'pendiente' ? (
                        <button
                          onClick={() => handleApprove(m.id)}
                          disabled={loadingId === m.id}
                          className="btn-primary text-[10px] py-1.5 px-4 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        >
                          {loadingId === m.id ? '...' : 'Aprobar e informar'}
                        </button>
                      ) : m.status === 'activo' ? (
                        <button
                          onClick={() => handleDeactivate(m.id)}
                          disabled={loadingId === m.id}
                          className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          {loadingId === m.id ? '...' : 'Deshabilitar'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprove(m.id, false)}
                          disabled={loadingId === m.id}
                          className="text-green-400 hover:text-green-300 text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          {loadingId === m.id ? '...' : 'Re-habilitar'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
