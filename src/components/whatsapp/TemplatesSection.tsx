'use client'

import { useState, useTransition } from 'react'
import type { WhatsAppTemplate, WhatsAppCategory } from '@/app/dashboard/whatsapp/types'
import { saveTemplateAction, deleteTemplateAction } from '@/app/dashboard/whatsapp/actions'
import { useToast } from './shared/Toast'
import { ConfirmDialog } from './shared/ConfirmDialog'
import { Plus, Pencil, Trash2, X, Check, Loader2, FileText, Eye } from 'lucide-react'

interface Props {
  templates: WhatsAppTemplate[]
  onTemplatesChange: (templates: WhatsAppTemplate[]) => void
}

const CATEGORIAS: { value: WhatsAppCategory; label: string; color: string }[] = [
  { value: 'general', label: 'General', color: '#3b82f6' },
  { value: 'evento', label: 'Evento', color: '#8b5cf6' },
  { value: 'socio', label: 'Socio', color: '#25d366' },
  { value: 'sponsor', label: 'Sponsor', color: '#f59e0b' },
  { value: 'medio', label: 'Medio', color: '#ec4899' },
]

export function TemplatesSection({ templates, onTemplatesChange }: Props) {
  const [editing, setEditing] = useState<Partial<WhatsAppTemplate> | null>(null)
  const [preview, setPreview] = useState<WhatsAppTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppTemplate | null>(null)
  const [isPending, startTransition] = useTransition()
  const toast = useToast()

  const handleSave = () => {
    if (!editing?.titulo?.trim() || !editing?.contenido?.trim()) return
    startTransition(async () => {
      const res = await saveTemplateAction({
        id: editing.id,
        titulo: editing.titulo!,
        contenido: editing.contenido!,
        categoria: editing.categoria ?? 'general',
      })
      if (res.success && res.data) {
        if (editing.id) {
          onTemplatesChange(templates.map((t) => (t.id === editing.id ? res.data! : t)))
          toast('success', 'Plantilla actualizada.')
        } else {
          onTemplatesChange([res.data, ...templates])
          toast('success', 'Plantilla creada.')
        }
        setEditing(null)
      } else {
        toast('error', res.error ?? 'Error al guardar')
      }
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deleteTemplateAction(deleteTarget.id)
      if (res.success) {
        onTemplatesChange(templates.filter((t) => t.id !== deleteTarget.id))
        setDeleteTarget(null)
        toast('success', 'Plantilla eliminada.')
      } else {
        toast('error', res.error ?? 'Error al eliminar')
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] bg-[#0f0f0f]/80 backdrop-blur-md flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-2">
          <FileText size={16} className="text-[#25d366]" /> Plantillas
          <span className="text-xs text-[var(--text-muted)] font-normal">({templates.length})</span>
        </h3>
        <button
          onClick={() => setEditing({ categoria: 'general' })}
          className="px-3 py-1.5 text-xs font-bold text-black bg-[#25d366] hover:bg-[#1fae53] rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Plus size={13} /> Nueva Plantilla
        </button>
      </div>

      {/* Formulario de edición */}
      {editing && (
        <div className="p-4 bg-white/5 border-b border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {editing.id ? 'Editar plantilla' : 'Nueva plantilla'}
            </p>
            <button onClick={() => setEditing(null)} className="text-[var(--text-muted)] hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              autoFocus
              value={editing.titulo ?? ''}
              onChange={(e) => setEditing({ ...editing, titulo: e.target.value })}
              placeholder="Título *"
              className="bg-black/40 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#25d366]"
            />
            <select
              value={editing.categoria ?? 'general'}
              onChange={(e) =>
                setEditing({ ...editing, categoria: e.target.value as WhatsAppCategory })
              }
              className="bg-black/40 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#25d366] cursor-pointer"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isPending || !editing.titulo?.trim() || !editing.contenido?.trim()}
                className="flex-1 px-3 py-2 bg-[#25d366] text-black font-bold text-xs rounded-lg hover:bg-[#1fae53] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Guardar
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-3 py-2 text-xs text-[var(--text-muted)] hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>

          <textarea
            value={editing.contenido ?? ''}
            onChange={(e) => setEditing({ ...editing, contenido: e.target.value })}
            placeholder={'Contenido de la plantilla...\nSoporta *negrita*, _cursiva_, emojis y {{nombre}}.'}
            rows={4}
            className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-lg p-3 text-white text-sm custom-scrollbar focus:outline-none focus:border-[#25d366] resize-y"
          />
        </div>
      )}

      {/* Lista de plantillas */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {templates.length === 0 && !editing ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            No hay plantillas. Creá una con el botón superior.
          </div>
        ) : (
          templates.map((t) => {
            const cat = CATEGORIAS.find((c) => c.value === t.categoria)
            return (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0"
                      style={{ backgroundColor: (cat?.color ?? '#3b82f6') + '20', color: cat?.color ?? '#3b82f6' }}
                    >
                      {cat?.label ?? t.categoria}
                    </span>
                    <p className="text-sm font-semibold text-white truncate">{t.titulo}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setPreview(t)}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-white hover:bg-white/10"
                      title="Vista previa"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => setEditing(t)}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-white hover:bg-white/10"
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 whitespace-pre-wrap">
                  {t.contenido}
                </p>
              </div>
            )
          })
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="glass border border-[var(--border-subtle)] rounded-2xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white">{preview.titulo}</h3>
              <button onClick={() => setPreview(null)} className="text-[var(--text-muted)] hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="bg-[#0b141a] border border-[#25d366]/20 rounded-xl p-4 text-sm text-white whitespace-pre-wrap">
              {preview.contenido}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar plantilla"
          message={`¿Eliminar la plantilla "${deleteTarget.titulo}"?`}
          confirmLabel="Eliminar"
          variant="danger"
          isPending={isPending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
