'use client'

import { useState } from 'react'
import type { NewsFlash } from '@/services/news'

interface Commission {
  id: string
  name: string
  slug: string
}

interface Props {
  initialFlashes: NewsFlash[]
  commissions: Commission[]
  memberCommissionId: string | null
}

const SOURCE_LABELS: Record<string, string> = {
  meet: 'Meet',
  capacitacion: 'Capacitación',
  reunion: 'Reunión',
  manual: 'Redacción',
}

const SOURCE_COLORS: Record<string, string> = {
  meet: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  capacitacion: 'bg-green-500/20 text-green-300 border-green-500/30',
  reunion: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  manual: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function NewsFeed({ initialFlashes, commissions, memberCommissionId }: Props) {
  const [filter, setFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = initialFlashes.filter((f) => {
    if (filter === 'all') return true
    if (filter === 'general') return f.commission_id === null
    return f.commission_id === filter
  })

  if (initialFlashes.length === 0) {
    return (
      <div className="glass border border-[var(--border-subtle)] rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--bg-card)] flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
          </svg>
        </div>
        <p className="text-[var(--text-muted)] text-sm">
          No hay noticias publicadas aún. Los administradores pueden generar flashes desde el Procesador IA.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            filter === 'all'
              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary-2)]'
              : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('general')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            filter === 'general'
              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary-2)]'
              : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
          }`}
        >
          General
        </button>
        {commissions.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              filter === c.id
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary-2)]'
                : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {filtered.map((flash) => (
          <article
            key={flash.id}
            className="glass border border-[var(--border-subtle)] rounded-xl p-5 hover:border-[var(--border-glow)] transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${SOURCE_COLORS[flash.source_type]}`}>
                  {SOURCE_LABELS[flash.source_type]}
                </span>
                {flash.commission_id && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-glow)] text-[var(--accent-primary-2)] bg-[var(--accent-primary)]/10">
                    {commissions.find((c) => c.id === flash.commission_id)?.name ?? 'Comisión'}
                  </span>
                )}
              </div>
              <span className="text-[var(--text-muted)] text-xs flex-shrink-0">{formatDate(flash.created_at)}</span>
            </div>

            {/* Título */}
            <h2 className="text-white font-semibold mb-2">{flash.title}</h2>

            {/* Flash text */}
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed border-l-2 border-[var(--accent-primary)]/40 pl-3 mb-3">
              {flash.flash_text}
            </p>

            {/* Expandible */}
            <button
              onClick={() => setExpanded(expanded === flash.id ? null : flash.id)}
              className="text-xs text-[var(--accent-primary-2)] hover:underline flex items-center gap-1"
            >
              {expanded === flash.id ? 'Ocultar detalle' : 'Ver resumen completo'}
              <svg
                className={`w-3 h-3 transition-transform ${expanded === flash.id ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {expanded === flash.id && (
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-4">
                <div>
                  <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Resumen Ejecutivo</span>
                  <p className="text-[var(--text-secondary)] text-sm mt-2 leading-relaxed">{flash.summary}</p>
                </div>
                {flash.action_items.length > 0 && (
                  <div>
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Tareas Pendientes</span>
                    <ul className="mt-2 space-y-1.5">
                      {flash.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                          <span className="text-[var(--accent-primary-2)] mt-0.5 flex-shrink-0">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
