'use client'

import { useState } from 'react'
import type { WhatsAppTemplate } from '@/app/dashboard/whatsapp/actions'
import { useToast } from './Toast'
import { BookOpen, X, Copy, ChevronRight, ChevronDown } from 'lucide-react'

const CATEGORIAS: { value: WhatsAppTemplate['categoria']; label: string; color: string }[] = [
  { value: 'general',  label: 'General',  color: 'text-slate-300' },
  { value: 'evento',   label: 'Evento',   color: 'text-purple-300' },
  { value: 'socio',    label: 'Socio',    color: 'text-cyan-300' },
  { value: 'sponsor',  label: 'Sponsor',  color: 'text-amber-300' },
  { value: 'medio',    label: 'Medio',    color: 'text-green-300' },
]

interface Props {
  templates: WhatsAppTemplate[]
  onSelect?: (template: WhatsAppTemplate) => void
  onManageClick?: () => void
}

export function PlantillaSidebar({ templates, onSelect, onManageClick }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const toggleCategory = (cat: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  const handleCopy = async (t: WhatsAppTemplate) => {
    try {
      await navigator.clipboard.writeText(t.cuerpo)
      toast('success', `"${t.titulo}" copiada al portapapeles.`)
    } catch {
      toast('error', 'No se pudo copiar.')
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-[#25d366] text-black font-bold text-sm rounded-2xl shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:bg-[#1fae53] transition-all hover:scale-105"
      >
        <BookOpen size={18} />
        Plantillas
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 max-h-[70vh] glass border border-[var(--border-subtle)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] bg-[#0f0f0f]/80 flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2 text-sm">
          <BookOpen size={16} className="text-[#25d366]" /> Plantillas
        </h3>
        <div className="flex items-center gap-1">
          {onManageClick && (
            <button
              onClick={() => { onManageClick(); setIsOpen(false) }}
              className="text-xs text-[var(--text-muted)] hover:text-[#25d366] px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              Gestionar
            </button>
          )}
          <button onClick={() => setIsOpen(false)} className="text-[var(--text-muted)] hover:text-white p-1 rounded-lg hover:bg-white/5">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {templates.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)] text-xs">
            No hay plantillas creadas.
          </div>
        ) : (
          CATEGORIAS.map(cat => {
            const catTemplates = templates.filter(t => t.categoria === cat.value)
            if (catTemplates.length === 0) return null
            const isExpanded = expanded.has(cat.value)

            return (
              <div key={cat.value} className="mb-1">
                <button
                  onClick={() => toggleCategory(cat.value)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  {isExpanded ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : <ChevronRight size={14} className="text-[var(--text-muted)]" />}
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${cat.color}`}>{cat.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)] ml-auto">{catTemplates.length}</span>
                </button>

                {isExpanded && (
                  <div className="space-y-1 pl-2">
                    {catTemplates.map(t => (
                      <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group">
                        <button
                          onClick={() => onSelect?.(t)}
                          className="flex-1 text-left min-w-0"
                          title="Seleccionar plantilla"
                        >
                          <p className="text-sm text-white font-medium truncate">{t.titulo}</p>
                          <p className="text-[10px] text-[var(--text-muted)] truncate font-mono">{t.cuerpo}</p>
                        </button>
                        <button
                          onClick={() => handleCopy(t)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[#25d366] opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title="Copiar al portapapeles"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
