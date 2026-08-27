'use client'

import { useState, useTransition, useCallback, useMemo } from 'react'
import {
  saveGroupAction, deleteGroupAction, setGroupContactsAction,
  getGroupWithContactsAction
} from '@/app/dashboard/whatsapp/actions'
import type { WhatsAppContact, WhatsAppGroup, WhatsAppGroupWithContacts } from '@/app/dashboard/whatsapp/actions'
import { normalizeArgentinaPhone, buildWaLink, WhatsAppIcon } from './WhatsAppLinkGenerator'
import {
  Plus, Pencil, Trash2, X, Save, Loader2, Users, Search,
  CheckSquare, Square, ChevronRight, Copy, ExternalLink
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────

const GROUP_COLORS = [
  '#25d366', '#128c7e', '#075e54',
  '#a855f7', '#6366f1', '#3b82f6',
  '#f59e0b', '#ef4444', '#ec4899',
]

function replacePlaceholders(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

// ─── Props ──────────────────────────────────────────────────

interface Props {
  groups: WhatsAppGroup[]
  contacts: WhatsAppContact[]
  templates: Array<{ id: string; titulo: string; cuerpo: string }>
  onGroupsChanged: (groups: WhatsAppGroup[]) => void
}

// ─── Componente principal ────────────────────────────────────

export function ContactGroupManager({ groups, contacts, templates, onGroupsChanged }: Props) {
  const [selectedGroup, setSelectedGroup] = useState<WhatsAppGroupWithContacts | null>(null)
  const [editingGroup, setEditingGroup] = useState<Partial<WhatsAppGroup> | null>(null)
  const [loadingGroupId, setLoadingGroupId] = useState<string | null>(null)
  const [showSender, setShowSender] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  const showFeedback = (type: 'ok' | 'err', msg: string) => {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 3500)
  }

  // Cargar un grupo con todos sus contactos
  const loadGroup = useCallback(async (g: WhatsAppGroup) => {
    if (selectedGroup?.id === g.id) { setSelectedGroup(null); setShowSender(false); return }
    setLoadingGroupId(g.id)
    const full = await getGroupWithContactsAction(g.id)
    setSelectedGroup(full)
    setLoadingGroupId(null)
    setShowSender(false)
  }, [selectedGroup])

  // Guardar grupo (create/update)
  const handleSaveGroup = useCallback(() => {
    if (!editingGroup?.nombre?.trim()) return
    startTransition(async () => {
      const res = await saveGroupAction({
        id: editingGroup.id,
        nombre: editingGroup.nombre!,
        descripcion: editingGroup.descripcion ?? '',
        color: editingGroup.color ?? '#25d366',
      })
      if (res.success) {
        showFeedback('ok', editingGroup.id ? 'Grupo actualizado.' : 'Grupo creado.')
        const newGroup: WhatsAppGroup = {
          id: editingGroup.id ?? res.id ?? crypto.randomUUID(),
          nombre: editingGroup.nombre!,
          descripcion: editingGroup.descripcion ?? null,
          color: editingGroup.color ?? '#25d366',
          creado_por: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          contact_count: editingGroup.id
            ? (groups.find(g => g.id === editingGroup.id)?.contact_count ?? 0)
            : 0,
        }
        onGroupsChanged(
          editingGroup.id
            ? groups.map(g => g.id === editingGroup.id ? newGroup : g)
            : [...groups, newGroup]
        )
        setEditingGroup(null)
      } else {
        showFeedback('err', res.error ?? 'Error al guardar.')
      }
    })
  }, [editingGroup, groups, onGroupsChanged])

  const handleDeleteGroup = useCallback((id: string) => {
    startTransition(async () => {
      const res = await deleteGroupAction(id)
      if (res.success) {
        onGroupsChanged(groups.filter(g => g.id !== id))
        if (selectedGroup?.id === id) setSelectedGroup(null)
        showFeedback('ok', 'Grupo eliminado.')
      } else {
        showFeedback('err', res.error ?? 'Error al eliminar.')
      }
    })
  }, [groups, selectedGroup, onGroupsChanged])

  return (
    <div className="space-y-5">
      {/* Feedback */}
      {feedback && (
        <div className={`px-4 py-2.5 rounded-xl text-sm font-medium border ${
          feedback.type === 'ok'
            ? 'bg-green-500/10 border-green-500/20 text-green-300'
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de grupos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
              Grupos ({groups.length})
            </p>
            {!editingGroup && (
              <button
                type="button"
                onClick={() => setEditingGroup({ nombre: '', color: '#25d366' })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/25 text-[#25d366] text-xs font-semibold transition-all"
              >
                <Plus size={13} /> Nuevo grupo
              </button>
            )}
          </div>

          {/* Form de edición de grupo */}
          {editingGroup && (
            <div className="glass border border-[var(--border-subtle)] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white text-xs font-bold">{editingGroup.id ? 'Editar' : 'Nuevo'} grupo</p>
                <button type="button" onClick={() => setEditingGroup(null)} className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-white">
                  <X size={13} />
                </button>
              </div>
              <input
                type="text"
                value={editingGroup.nombre ?? ''}
                onChange={e => setEditingGroup(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Nombre del grupo"
                className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all"
              />
              <input
                type="text"
                value={editingGroup.descripcion ?? ''}
                onChange={e => setEditingGroup(p => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripción (opcional)"
                className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all"
              />
              {/* Selector de color */}
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-2">Color del grupo</p>
                <div className="flex gap-2">
                  {GROUP_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditingGroup(p => ({ ...p, color: c }))}
                      className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor: editingGroup.color === c ? 'white' : 'transparent',
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveGroup}
                disabled={isPending || !editingGroup.nombre?.trim()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#25d366]/10 border border-[#25d366]/25 text-[#25d366] text-xs font-semibold disabled:opacity-30 transition-all"
              >
                {isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Guardar
              </button>
            </div>
          )}

          {/* Lista */}
          {groups.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[var(--border-subtle)] rounded-2xl text-[var(--text-muted)] text-sm">
              No hay grupos aún.
            </div>
          ) : (
            <div className="space-y-1.5">
              {groups.map(g => (
                <div
                  key={g.id}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all group ${
                    selectedGroup?.id === g.id
                      ? 'bg-white/5 border-white/15'
                      : 'bg-white/2 border-[var(--border-subtle)]/50 hover:border-[var(--border-subtle)]'
                  }`}
                  onClick={() => loadGroup(g)}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: g.color + '25', border: `1px solid ${g.color}40` }}
                  >
                    <Users size={14} style={{ color: g.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{g.nombre}</p>
                    <p className="text-[var(--text-muted)] text-xs">
                      {g.contact_count ?? 0} contacto{g.contact_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {loadingGroupId === g.id && <Loader2 size={13} className="animate-spin text-[var(--text-muted)]" />}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setEditingGroup(g) }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleDeleteGroup(g.id) }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <ChevronRight size={13} className={`text-[var(--text-muted)] transition-transform ${selectedGroup?.id === g.id ? 'rotate-90' : ''}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel del grupo seleccionado */}
        <div>
          {!selectedGroup ? (
            <div className="flex items-center justify-center h-full border border-dashed border-[var(--border-subtle)] rounded-2xl text-[var(--text-muted)] text-sm p-8 text-center">
              Seleccioná un grupo para ver sus contactos y enviar mensajes.
            </div>
          ) : showSender ? (
            <GroupMessageSender
              group={selectedGroup}
              templates={templates}
              onBack={() => setShowSender(false)}
            />
          ) : (
            <GroupContactSelector
              group={selectedGroup}
              allContacts={contacts}
              isPending={isPending}
              onSave={async (ids) => {
                startTransition(async () => {
                  const res = await setGroupContactsAction(selectedGroup.id, ids)
                  if (res.success) {
                    setSelectedGroup(prev => prev ? {
                      ...prev,
                      contacts: contacts.filter(c => ids.includes(c.id))
                    } : prev)
                    onGroupsChanged(groups.map(g =>
                      g.id === selectedGroup.id ? { ...g, contact_count: ids.length } : g
                    ))
                    showFeedback('ok', 'Miembros del grupo actualizados.')
                  } else {
                    showFeedback('err', res.error ?? 'Error al guardar.')
                  }
                })
              }}
              onSendMessage={() => setShowSender(true)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Selector de contactos del grupo ─────────────────────────

function GroupContactSelector({
  group, allContacts, isPending, onSave, onSendMessage
}: {
  group: WhatsAppGroupWithContacts
  allContacts: WhatsAppContact[]
  isPending: boolean
  onSave: (ids: string[]) => void
  onSendMessage: () => void
}) {
  const memberIds = useMemo(() => new Set(group.contacts.map(c => c.id)), [group.contacts])
  const [selected, setSelected] = useState<Set<string>>(new Set(memberIds))
  const [search, setSearch] = useState('')
  const [changed, setChanged] = useState(false)

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setChanged(true)
  }

  const filtered = allContacts.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.telefono.includes(search)
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-bold">{group.nombre}</p>
          <p className="text-[var(--text-muted)] text-xs">{selected.size} contactos seleccionados</p>
        </div>
        <button
          type="button"
          onClick={onSendMessage}
          disabled={selected.size === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/25 text-[#25d366] text-xs font-semibold disabled:opacity-30 transition-all"
        >
          <WhatsAppIcon size={13} /> Enviar al grupo
        </button>
      </div>

      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar contacto…"
          className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-lg pl-7 pr-3 py-2 text-white text-xs placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all"
        />
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
        {allContacts.length === 0 ? (
          <p className="text-center text-[var(--text-muted)] text-xs py-6">
            Primero importá contactos en el tab "Contactos".
          </p>
        ) : filtered.map(c => {
          const isSelected = selected.has(c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                isSelected
                  ? 'bg-[#25d366]/8 border-[#25d366]/25 text-white'
                  : 'bg-white/2 border-[var(--border-subtle)]/40 hover:border-[var(--border-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              {isSelected ? (
                <CheckSquare size={14} className="text-[#25d366] shrink-0" />
              ) : (
                <Square size={14} className="text-[var(--text-muted)] shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.nombre}</p>
                <p className="text-xs text-[var(--text-muted)] font-mono">{c.telefono}</p>
              </div>
            </button>
          )
        })}
      </div>

      {changed && (
        <button
          type="button"
          onClick={() => { onSave([...selected]); setChanged(false) }}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/25 text-[#25d366] text-sm font-semibold disabled:opacity-30 transition-all"
        >
          {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Guardar miembros del grupo
        </button>
      )}
    </div>
  )
}

// ─── Enviador de mensajes al grupo ────────────────────────────

function GroupMessageSender({
  group, templates, onBack
}: {
  group: WhatsAppGroupWithContacts
  templates: Array<{ id: string; titulo: string; cuerpo: string }>
  onBack: () => void
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; cuerpo: string } | null>(null)
  const [customText, setCustomText] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const getMsg = (c: WhatsAppContact) => {
    const base = customText.trim() || selectedTemplate?.cuerpo || ''
    return replacePlaceholders(base, { nombre: c.nombre.split(' ')[0], email: c.email ?? '' })
  }

  const handleCopyAll = async () => {
    const lines = group.contacts.map(c =>
      `${c.nombre}: ${buildWaLink(c.telefono, getMsg(c) || undefined)}`
    ).join('\n')
    try { await navigator.clipboard.writeText(lines) } catch { /* ignore */ }
  }

  const handleCopyOne = async (idx: number, link: string) => {
    try { await navigator.clipboard.writeText(link) } catch { /* ignore */ }
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-all"
        >
          <X size={14} />
        </button>
        <div>
          <p className="text-white text-sm font-bold">Enviar a: {group.nombre}</p>
          <p className="text-[var(--text-muted)] text-xs">{group.contacts.length} destinatarios</p>
        </div>
      </div>

      {/* Selector de plantilla */}
      {templates.length > 0 && (
        <select
          value={selectedTemplate?.id ?? ''}
          onChange={e => {
            const t = templates.find(t => t.id === e.target.value)
            setSelectedTemplate(t ? { id: t.id, cuerpo: t.cuerpo } : null)
            setCustomText('')
          }}
          className="w-full appearance-none bg-white/5 border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-white text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
        >
          <option value="" className="bg-[#0f0f0f]">— Usar plantilla (opcional) —</option>
          {templates.map(t => (
            <option key={t.id} value={t.id} className="bg-[#0f0f0f]">{t.titulo}</option>
          ))}
        </select>
      )}

      <textarea
        value={customText}
        onChange={e => { setCustomText(e.target.value); setSelectedTemplate(null) }}
        placeholder={selectedTemplate ? 'Dejá vacío para usar la plantilla…' : 'Mensaje para todo el grupo (soporta {{nombre}})…'}
        rows={3}
        className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-[var(--text-muted)]/50 focus:border-[var(--accent-primary)] outline-none transition-all resize-none"
      />

      <div className="flex items-center justify-between">
        <p className="text-[var(--text-muted)] text-xs">{group.contacts.length} links generados</p>
        <button
          type="button"
          onClick={handleCopyAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--text-muted)] hover:text-white text-xs font-medium transition-all"
        >
          <Copy size={12} /> Copiar todos
        </button>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {group.contacts.map((c, idx) => {
          const msg = getMsg(c)
          const link = buildWaLink(c.telefono, msg || undefined)
          return (
            <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 border border-[var(--border-subtle)]/50 group">
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{c.nombre}</p>
                <p className="text-[var(--text-muted)] text-[10px] font-mono">+{normalizeArgentinaPhone(c.telefono)}</p>
              </div>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/20 text-[#25d366] text-xs font-medium transition-all"
              >
                <WhatsAppIcon size={11} /> Abrir
              </a>
              <button
                type="button"
                onClick={() => handleCopyOne(idx, link)}
                className={`p-1.5 rounded-lg border text-xs transition-all ${
                  copiedIdx === idx
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'border-transparent hover:bg-white/10 text-[var(--text-muted)] hover:text-white'
                }`}
              >
                <Copy size={11} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
