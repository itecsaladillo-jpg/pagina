'use client'

import { useState } from 'react'
import { updateIdeaStatusAction, deleteIdeaAction } from './actions'
import type { Idea } from '@/types/database'

const statusLabels: Record<string, { label: string, color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  en_revision: { label: 'En revisión', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  aprobada: { label: 'Aprobada', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  descartada: { label: 'Descartada', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export function IdeasManagementClient({ ideas, isAdmin }: { ideas: Idea[], isAdmin: boolean }) {
  const [filter, setFilter] = useState<string>('todas')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [localIdeas, setLocalIdeas] = useState(ideas)

  const filtered = filter === 'todas' ? localIdeas : localIdeas.filter(i => i.status === filter)

  const handleStatus = async (id: string, status: string) => {
    setLoadingId(id)
    const res = await updateIdeaStatusAction(id, status)
    if (res.success) {
      setLocalIdeas(prev => prev.map(i => i.id === id ? { ...i, status: status as any } : i))
    }
    setLoadingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta idea definitivamente?')) return
    setLoadingId(id)
    await deleteIdeaAction(id)
    setLocalIdeas(prev => prev.filter(i => i.id !== id))
    setLoadingId(null)
  }

  const counts = {
    todas: localIdeas.length,
    pendiente: localIdeas.filter(i => i.status === 'pendiente').length,
    en_revision: localIdeas.filter(i => i.status === 'en_revision').length,
    aprobada: localIdeas.filter(i => i.status === 'aprobada').length,
    descartada: localIdeas.filter(i => i.status === 'descartada').length,
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'todas', label: 'Todas' },
          { id: 'pendiente', label: 'Pendientes' },
          { id: 'en_revision', label: 'En revisión' },
          { id: 'aprobada', label: 'Aprobadas' },
          { id: 'descartada', label: 'Descartadas' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
              filter === tab.id
                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary-2)] border border-[var(--accent-primary)]/30'
                : 'text-[var(--text-muted)] hover:text-white border border-transparent'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-[10px] opacity-60">({counts[tab.id as keyof typeof counts]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass border border-[var(--border-subtle)] rounded-2xl p-12 text-center">
          <p className="text-[var(--text-muted)] text-sm">No hay ideas en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(idea => {
            const st = statusLabels[idea.status] || statusLabels.pendiente
            return (
              <div key={idea.id} className="glass border border-[var(--border-subtle)] rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${st.color}`}>
                        {st.label}
                      </span>
                      {idea.is_anonymous && (
                        <span className="text-[10px] text-[var(--text-muted)]">Anónimo</span>
                      )}
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {new Date(idea.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-white text-sm whitespace-pre-wrap">{idea.idea_text}</p>

                    {!idea.is_anonymous && (idea.author_name || idea.author_email) && (
                      <div className="flex gap-3 mt-2 text-[11px] text-[var(--text-muted)]">
                        {idea.author_name && <span>{idea.author_name}</span>}
                        {idea.author_email && <span>{idea.author_email}</span>}
                        {idea.author_phone && <span>{idea.author_phone}</span>}
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {idea.status !== 'pendiente' && (
                        <button
                          onClick={() => handleStatus(idea.id, 'pendiente')}
                          disabled={loadingId === idea.id}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-amber-400/60 hover:text-amber-400 transition-all"
                          title="Marcar como pendiente"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      {idea.status !== 'en_revision' && (
                        <button
                          onClick={() => handleStatus(idea.id, 'en_revision')}
                          disabled={loadingId === idea.id}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-blue-400/60 hover:text-blue-400 transition-all"
                          title="En revisión"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </button>
                      )}
                      {idea.status !== 'aprobada' && (
                        <button
                          onClick={() => handleStatus(idea.id, 'aprobada')}
                          disabled={loadingId === idea.id}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-green-400/60 hover:text-green-400 transition-all"
                          title="Aprobar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      {idea.status !== 'descartada' && (
                        <button
                          onClick={() => handleStatus(idea.id, 'descartada')}
                          disabled={loadingId === idea.id}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-red-400/60 hover:text-red-400 transition-all"
                          title="Descartar"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(idea.id)}
                        disabled={loadingId === idea.id}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all"
                        title="Eliminar"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
