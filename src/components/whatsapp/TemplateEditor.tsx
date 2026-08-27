'use client'

import { useState, useTransition, useCallback } from 'react'
import { saveTemplateAction, deleteTemplateAction } from '@/app/dashboard/whatsapp/actions'
import type { WhatsAppTemplate } from '@/app/dashboard/whatsapp/actions'
import { Loader2, Plus, Pencil, Trash2, X, Save, ChevronDown, Eye } from 'lucide-react'

const CATEGORIAS: { value: WhatsAppTemplate['categoria']; label: string; color: string }[] = [
  { value: 'general',  label: 'General',  color: 'text-slate-300 bg-slate-500/15 border-slate-500/25' },
  { value: 'evento',   label: 'Evento',   color: 'text-purple-300 bg-purple-500/15 border-purple-500/25' },
  { value: 'socio',    label: 'Socio',    color: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/25' },
  { value: 'sponsor',  label: 'Sponsor',  color: 'text-amber-300 bg-amber-500/15 border-amber-500/25' },
  { value: 'medio',    label: 'Medio',    color: 'text-green-300 bg-green-500/15 border-green-500/25' },
]

// Variables disponibles para usar en las plantillas
const VARIABLES = ['{{nombre}}', '{{evento}}', '{{fecha}}', '{{link}}', '{{email}}', '{{contenido}}']

interface Props {
  templates: WhatsAppTemplate[]
}

export function TemplateEditor({ templates: initialTemplates }: Props) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [editing, setEditing] = useState<Partial<WhatsAppTemplate> | null>(null)
  const [preview, setPreview] = useState<WhatsAppTemplate | null>(null)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  const showFeedback = (type: 'ok' | 'err', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 3500)
  }

  const handleSave = useCallback(() => {
    if (!editing || !editing.titulo?.trim() || !editing.cuerpo?.trim()) return
    startTransition(async () => {
      const res = await saveTemplateAction({
        id: editing.id,
        titulo: editing.titulo!,
        cuerpo: editing.cuerpo!,
        categoria: editing.categoria ?? 'general',
      })
      if (res.success) {
        showFeedback('ok', editing.id ? 'Plantilla actualizada.' : 'Plantilla creada.')
        setEditing(null)
        // Optimistic update (se va a revalidar en server)
        if (editing.id) {
          setTemplates(prev => prev.map(t => t.id === editing.id
            ? { ...t, titulo: editing.titulo!, cuerpo: editing.cuerpo!, categoria: editing.categoria ?? 'general' }
            : t
          ))
        } else {
          setTemplates(prev => [...prev, {
            id: res.id ?? crypto.randomUUID(),
            titulo: editing.titulo!,
            cuerpo: editing.cuerpo!,
            categoria: editing.categoria ?? 'general',
            autor_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
        }
      } else {
        showFeedback('err', res.error ?? 'Error al guardar.')
      }
    })
  }, [editing])

  const handleDelete = useCallback((id: string) => {
    startTransition(async () => {
      const res = await deleteTemplateAction(id)
      if (res.success) {
        setTemplates(prev => prev.filter(t => t.id !== id))
        showFeedback('ok', 'Plantilla eliminada.')
      } else {
        showFeedback('err', res.error ?? 'Error al eliminar.')
      }
    })
  }, [])

  const insertVar = (v: string) => {
    setEditing(prev => prev
      ? { ...prev, cuerpo: (prev.cuerpo ?? '') + v }
      : prev
    )
  }

  const categoriaInfo = (cat: WhatsAppTemplate['categoria']) =>
    CATEGORIAS.find(c => c.value === cat) ?? CATEGORIAS[0]

  return (
    <div className="space-y-6">
      {/* Feedback toast */}
      {feedback && (
        <div className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${
          feedback.type === 'ok'
            ? 'bg-green-500/10 border-green-500/20 text-green-300'
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          {feedback.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-muted)] text-sm">
          {templates.length} plantilla{templates.length !== 1 ? 's' : ''} guardada{templates.length !== 1 ? 's' : ''}
        </p>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing({ titulo: '', cuerpo: '', categoria: 'general' })}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/25 hover:border-[#25d366]/40 text-[#25d366] text-sm font-semibold transition-all"
          >
            <Plus size={15} />
            Nueva plantilla
          </button>
        )}
      </div>

      {/* Formulario de edición */}
      {editing && (
        <div className="glass border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-sm">
              {editing.id ? 'Editar plantilla' : 'Nueva plantilla'}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Título</label>
            <input
              type="text"
              value={editing.titulo ?? ''}
              onChange={e => setEditing(prev => prev ? { ...prev, titulo: e.target.value } : prev)}
              placeholder="Ej: Convocatoria a evento mensual"
              className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Categoría</label>
            <div className="relative">
              <select
                value={editing.categoria ?? 'general'}
                onChange={e => setEditing(prev => prev
                  ? { ...prev, categoria: e.target.value as WhatsAppTemplate['categoria'] }
                  : prev
                )}
                className="w-full appearance-none bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all pr-8 cursor-pointer"
              >
                {CATEGORIAS.map(c => (
                  <option key={c.value} value={c.value} className="bg-[#0f0f0f]">{c.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>
          </div>

          {/* Cuerpo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[var(--text-muted)] font-medium">Mensaje</label>
              <span className="text-[10px] text-[var(--text-muted)]">{editing.cuerpo?.length ?? 0} caracteres</span>
            </div>
            <textarea
              value={editing.cuerpo ?? ''}
              onChange={e => setEditing(prev => prev ? { ...prev, cuerpo: e.target.value } : prev)}
              placeholder="Escribí el mensaje aquí. Usá {{nombre}}, {{evento}}, etc. para insertar variables dinámicas."
              rows={5}
              className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all resize-none font-mono"
            />
          </div>

          {/* Variables rápidas */}
          <div>
            <p className="text-[10px] text-[var(--text-muted)] mb-2 font-medium uppercase tracking-wider">Insertar variable</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVar(v)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--text-muted)] hover:text-white text-[11px] font-mono transition-all"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !editing.titulo?.trim() || !editing.cuerpo?.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/25 text-[#25d366] text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isPending ? 'Guardando…' : 'Guardar plantilla'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--text-muted)] hover:text-white text-sm transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de plantillas */}
      {templates.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <p className="text-sm">No hay plantillas aún.</p>
          <p className="text-xs mt-1">Creá la primera usando el botón de arriba.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {CATEGORIAS.map(cat => {
            const catTemplates = templates.filter(t => t.categoria === cat.value)
            if (catTemplates.length === 0) return null
            return (
              <div key={cat.value}>
                <p className={`text-[10px] font-bold uppercase tracking-[0.15em] px-1 mb-2 ${cat.color.split(' ')[0]}`}>
                  {cat.label}
                </p>
                <div className="space-y-2">
                  {catTemplates.map(t => (
                    <div
                      key={t.id}
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-[var(--border-subtle)]/60 hover:border-[var(--border-subtle)] transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white text-sm font-semibold truncate">{t.titulo}</span>
                          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cat.color}`}>
                            {cat.label}
                          </span>
                        </div>
                        <p className="text-[var(--text-muted)] text-xs leading-relaxed line-clamp-2 font-mono">
                          {t.cuerpo}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setPreview(preview?.id === t.id ? null : t)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all"
                          title="Vista previa"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(t)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Vista previa expandida */}
                {preview && templates.find(t => t.id === preview.id)?.categoria === cat.value && (
                  <div className="mt-2 p-4 rounded-xl bg-[#25d366]/5 border border-[#25d366]/15">
                    <p className="text-[10px] text-[#25d366]/70 font-bold uppercase tracking-wider mb-2">Vista previa</p>
                    <p className="text-white text-sm whitespace-pre-wrap font-mono leading-relaxed">{preview.cuerpo}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
