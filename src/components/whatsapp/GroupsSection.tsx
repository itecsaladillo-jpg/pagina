'use client'

import { useState, useTransition, useRef } from 'react'
import type { WhatsAppContact } from '@/app/dashboard/whatsapp/types'
import type { WhatsAppGroupWithCount } from '@/app/dashboard/whatsapp/types'
import {
  saveGroupAction,
  deleteGroupAction,
  getGroupWithContactsAction,
  setGroupContactsAction,
  saveContactAction,
  deleteContactAction,
  importMembersToAgendaAction,
  getContactsAction,
} from '@/app/dashboard/whatsapp/actions'
import { useToast } from './shared/Toast'
import { ConfirmDialog } from './shared/ConfirmDialog'
import {
  Search, Users, Plus, Check, Loader2, Pencil, Trash2, X, Save, Phone, Mail, UserPlus,
  DownloadCloud,
} from 'lucide-react'

interface Props {
  groups: WhatsAppGroupWithCount[]
  contacts: WhatsAppContact[]
  onGroupsChange: (groups: WhatsAppGroupWithCount[]) => void
  onContactsChange: (contacts: WhatsAppContact[]) => void
}

export function GroupsSection({ groups, contacts, onGroupsChange, onContactsChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [isLoadingGroup, setIsLoadingGroup] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [renameTarget, setRenameTarget] = useState<WhatsAppGroupWithCount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppGroupWithCount | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [editContact, setEditContact] = useState<WhatsAppContact | null>(null)
  const [deleteContactTarget, setDeleteContactTarget] = useState<WhatsAppContact | null>(null)
  const toast = useToast()
  const reqIdRef = useRef(0)
  const [isImporting, setIsImporting] = useState(false)

  const selectedGroup = groups.find((g) => g.id === selectedId) ?? null

  const handleImportMembers = () => {
    if (isImporting) return
    setIsImporting(true)
    importMembersToAgendaAction()
      .then(async (res) => {
        if (res.success && res.data) {
          const { imported, updated, skipped, reasons, samples } = res.data
          const fresh = await getContactsAction()
          if (fresh.success && fresh.data) onContactsChange(fresh.data)
          const parts: string[] = []
          if (imported) parts.push(`${imported} nuevos`)
          if (updated) parts.push(`${updated} actualizados`)
          toast('success', parts.length ? `Miembros importados: ${parts.join(', ')}.` : 'Agenda ya al día.')
          if (skipped > 0) {
            const detail: string[] = []
            if (reasons.no_phone) detail.push(`${reasons.no_phone} sin teléfono`)
            if (reasons.no_name) detail.push(`${reasons.no_name} sin nombre`)
            if (reasons.invalid_phone) detail.push(`${reasons.invalid_phone} teléfono inválido`)
            toast('info', `Omitidos ${skipped}: ${detail.join(', ')}.`)
            if (samples.length) toast('info', samples[0])
          }
        } else {
          toast('error', res.error ?? 'Error al importar miembros')
        }
      })
      .finally(() => setIsImporting(false))
  }

  // Seleccionar grupo → cargar y pre-seleccionar sus contactos
  const selectGroup = (id: string | null) => {
    const reqId = ++reqIdRef.current
    setSelectedId(id)
    setSelection(new Set())
    setDirty(false)
    if (!id) return
    setIsLoadingGroup(true)
    getGroupWithContactsAction(id).then((res) => {
      if (reqId !== reqIdRef.current) return
      if (res.success && res.data) {
        setSelection(new Set(res.data.contacts.map((c) => c.id)))
      } else {
        toast('error', res.error ?? 'Error al cargar el grupo')
      }
      setIsLoadingGroup(false)
    })
  }

  const filtered = contacts.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) || c.telefono.includes(search)
  )

  const toggle = (id: string) => {
    const next = new Set(selection)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelection(next)
    setDirty(true)
  }

  const selectAllFiltered = () => {
    setSelection(new Set(filtered.map((c) => c.id)))
    setDirty(true)
  }

  const clearAll = () => {
    setSelection(new Set())
    setDirty(true)
  }

  // ── Guardar selección en el grupo ──
  const saveSelection = () => {
    if (!selectedId) return
    startTransition(async () => {
      const res = await setGroupContactsAction(selectedId, [...selection])
      if (res.success) {
        setDirty(false)
        onGroupsChange(
          groups.map((g) =>
            g.id === selectedId ? { ...g, contact_count: selection.size } : g
          )
        )
        toast('success', `${selection.size} contactos guardados en "${selectedGroup?.nombre_grupo}".`)
      } else {
        toast('error', res.error ?? 'Error al guardar la selección')
      }
    })
  }

  return (
    <div className="flex h-full min-h-[520px]">
      {/* ── Sidebar: lista de grupos ── */}
      <aside className="w-64 border-r border-[var(--border-subtle)] flex flex-col bg-[#0f0f0f]/50">
        <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Grupos ({groups.length})
          </h3>
          <div className="flex gap-1">
            <button
              onClick={handleImportMembers}
              disabled={isImporting}
              className="p-1.5 rounded-lg bg-[#3b82f6]/15 text-[#3b82f6] hover:bg-[#3b82f6]/25 transition-colors border border-[#3b82f6]/20 disabled:opacity-50"
              title="Importar miembros ITEC a la agenda"
            >
              {isImporting ? <Loader2 size={14} className="animate-spin" /> : <DownloadCloud size={14} />}
            </button>
            <button
              onClick={() => {
                setEditContact(null)
                setShowContactForm(true)
              }}
              className="p-1.5 rounded-lg bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 transition-colors border border-white/10"
              title="Nuevo contacto en la agenda"
            >
              <UserPlus size={14} />
            </button>
            <button
              onClick={() => setShowNewGroup(true)}
              className="p-1.5 rounded-lg bg-[#25d366]/15 text-[#25d366] hover:bg-[#25d366]/25 transition-colors"
              title="Nuevo grupo"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {groups.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] text-center py-6 px-2">
              No hay grupos. Creá uno con el botón +.
            </p>
          )}
          {groups.map((g) => (
            <div
              key={g.id}
              className={`group w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all border ${
                selectedId === g.id
                  ? 'bg-[#25d366]/10 border-[#25d366]/30'
                  : 'border-transparent hover:bg-white/5 hover:border-white/10'
              }`}
              onClick={() => selectGroup(g.id)}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: (g.color || '#25d366') + '20',
                  border: `1px solid ${g.color || '#25d366'}40`,
                }}
              >
                <Users size={14} style={{ color: g.color || '#25d366' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{g.nombre_grupo}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {g.contact_count ?? 0} contactos
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setRenameTarget(g)
                  }}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-white hover:bg-white/10"
                  title="Renombrar"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(g)
                  }}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10"
                  title="Eliminar"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Detalle: selector de contactos ── */}
      <section className="flex-1 flex flex-col min-w-0">
        {!selectedGroup ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] text-sm gap-4">
            <Users size={40} className="opacity-30" />
            <p>Seleccioná un grupo para asignar contactos.</p>
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleImportMembers}
                disabled={isImporting}
                className="px-4 py-2 text-xs font-bold text-black bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isImporting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <DownloadCloud size={14} />
                )}
                Importar miembros ITEC a la agenda
              </button>
              <button
                onClick={() => {
                  setEditContact(null)
                  setShowContactForm(true)
                }}
                className="px-4 py-2 text-xs font-bold text-black bg-[#25d366] hover:bg-[#1fae53] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <UserPlus size={14} /> Nuevo contacto en la agenda
              </button>
            </div>
            {contacts.length > 0 && (
              <p className="text-[11px] text-[var(--text-muted)]">
                {contacts.length} contactos en la agenda
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Header del grupo */}
            <div className="p-4 border-b border-[var(--border-subtle)] bg-[#0f0f0f]/80 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedGroup.color || '#25d366' }}
                    />
                    {selectedGroup.nombre_grupo}
                  </h3>
                  {selectedGroup.descripcion && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {selectedGroup.descripcion}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#25d366] bg-[#25d366]/10 px-2.5 py-1 rounded-full border border-[#25d366]/20">
                    {selection.size} seleccionados
                  </span>
                  <button
                    onClick={handleImportMembers}
                    disabled={isImporting}
                    className="px-2.5 py-1.5 text-xs font-bold text-[#3b82f6] bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 rounded-lg transition-colors border border-[#3b82f6]/20 flex items-center gap-1 disabled:opacity-50"
                    title="Importar miembros ITEC a la agenda"
                  >
                    {isImporting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <DownloadCloud size={12} />
                    )}
                    Miembros
                  </button>
                  <button
                    onClick={() => setShowContactForm(true)}
                    className="px-2.5 py-1.5 text-xs font-bold text-[var(--text-secondary)] bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 flex items-center gap-1"
                  >
                    <Plus size={12} /> Contacto
                  </button>
                </div>
              </div>

              {/* Buscador */}
              <div className="relative mb-2">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-xl pl-9 pr-3 py-2 text-white text-sm placeholder:text-[var(--text-muted)] focus:border-[#25d366]/50 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={selectAllFiltered}
                    className="text-[11px] font-bold text-[#25d366] hover:underline"
                  >
                    Seleccionar todos ({filtered.length})
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-[11px] font-bold text-[var(--text-muted)] hover:text-white"
                  >
                    Limpiar
                  </button>
                </div>
                <button
                  onClick={saveSelection}
                  disabled={isPending || !dirty}
                  className="px-4 py-2 bg-[#25d366] text-black font-bold text-xs rounded-lg hover:bg-[#1fae53] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                >
                  {isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  Guardar Selección
                </button>
              </div>
            </div>

            {/* Lista de contactos con checkboxes */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {isLoadingGroup ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin text-[var(--text-muted)]" size={24} />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">
                  No hay contactos. Agregá con el botón + Contacto.
                </p>
              ) : (
                filtered.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-all ${
                      selection.has(c.id)
                        ? 'bg-[#25d366]/5 border-[#25d366]/20'
                        : 'border-transparent hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selection.has(c.id)}
                      onChange={() => toggle(c.id)}
                      className="w-4 h-4 accent-[#25d366] rounded cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{c.nombre}</p>
                      <p className="text-xs text-[var(--text-muted)] font-mono flex items-center gap-1">
                        <Phone size={10} /> {c.telefono}
                        {c.email && (
                          <>
                            <span className="mx-1">·</span>
                            <Mail size={10} /> {c.email}
                          </>
                        )}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 shrink-0">
                      {c.fuente}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setEditContact(c)
                          setShowContactForm(true)
                        }}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-white hover:bg-white/10"
                        title="Editar"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setDeleteContactTarget(c)
                        }}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10"
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </label>
                ))
              )}
            </div>
          </>
        )}
      </section>

      {/* ── Modales ── */}
      {showNewGroup && (
        <GroupFormModal
          onClose={() => setShowNewGroup(false)}
          onSave={async (nombre, descripcion, color) => {
            startTransition(async () => {
              const res = await saveGroupAction({ nombre_grupo: nombre, descripcion, color })
              if (res.success && res.data) {
                const newGroup: WhatsAppGroupWithCount = { ...res.data, contact_count: 0 }
                onGroupsChange([...groups, newGroup])
                selectGroup(newGroup.id)
                setShowNewGroup(false)
                toast('success', 'Grupo creado.')
              } else {
                toast('error', res.error ?? 'Error al crear grupo')
              }
            })
          }}
          isPending={isPending}
        />
      )}

      {renameTarget && (
        <GroupFormModal
          initial={renameTarget}
          onClose={() => setRenameTarget(null)}
          onSave={async (nombre, descripcion, color) => {
            startTransition(async () => {
              const res = await saveGroupAction({
                id: renameTarget.id,
                nombre_grupo: nombre,
                descripcion,
                color,
              })
              if (res.success && res.data) {
                onGroupsChange(
                  groups.map((g) =>
                    g.id === renameTarget.id
                      ? { ...g, nombre_grupo: nombre, descripcion, color }
                      : g
                  )
                )
                setRenameTarget(null)
                toast('success', 'Grupo actualizado.')
              } else {
                toast('error', res.error ?? 'Error al actualizar')
              }
            })
          }}
          isPending={isPending}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar grupo"
          message={`¿Eliminar el grupo "${deleteTarget.nombre_grupo}"? Sus contactos no se borran, solo la relación.`}
          confirmLabel="Eliminar"
          variant="danger"
          isPending={isPending}
          onConfirm={() => {
            startTransition(async () => {
              const res = await deleteGroupAction(deleteTarget.id)
              if (res.success) {
                onGroupsChange(groups.filter((g) => g.id !== deleteTarget.id))
                if (selectedId === deleteTarget.id) selectGroup(null)
                setDeleteTarget(null)
                toast('success', 'Grupo eliminado.')
              } else {
                toast('error', res.error ?? 'Error al eliminar')
              }
            })
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showContactForm && (
        <ContactFormModal
          initial={editContact}
          onClose={() => {
            setShowContactForm(false)
            setEditContact(null)
          }}
          onSave={async (data) => {
            startTransition(async () => {
              const res = await saveContactAction({ ...data, id: editContact?.id })
              if (res.success && res.data) {
                if (editContact) {
                  onContactsChange(
                    contacts.map((c) => (c.id === editContact.id ? res.data! : c))
                  )
                  toast('success', 'Contacto actualizado.')
                } else {
                  onContactsChange([...contacts, res.data])
                  // Si hay un grupo abierto, pre-seleccionar el contacto nuevo
                  if (selectedId) {
                    setSelection((prev) => {
                      const next = new Set(prev)
                      next.add(res.data!.id)
                      return next
                    })
                    setDirty(true)
                  }
                  toast('success', 'Contacto dado de alta en la agenda.')
                }
                setShowContactForm(false)
                setEditContact(null)
              } else {
                toast('error', res.error ?? 'Error al guardar contacto')
              }
            })
          }}
          isPending={isPending}
        />
      )}

      {deleteContactTarget && (
        <ConfirmDialog
          title="Eliminar contacto"
          message={`¿Eliminar a "${deleteContactTarget.nombre}"? Se quitará de todos los grupos.`}
          confirmLabel="Eliminar"
          variant="danger"
          isPending={isPending}
          onConfirm={() => {
            startTransition(async () => {
              const res = await deleteContactAction(deleteContactTarget.id)
              if (res.success) {
                onContactsChange(contacts.filter((c) => c.id !== deleteContactTarget.id))
                setSelection((prev) => {
                  const next = new Set(prev)
                  next.delete(deleteContactTarget.id)
                  return next
                })
                setDeleteContactTarget(null)
                toast('success', 'Contacto eliminado.')
              } else {
                toast('error', res.error ?? 'Error al eliminar')
              }
            })
          }}
          onCancel={() => setDeleteContactTarget(null)}
        />
      )}
    </div>
  )
}

// ── Modal: crear / renombrar grupo ──────────────────────────

const PRESET_COLORS = ['#25d366', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

function GroupFormModal({
  initial,
  onClose,
  onSave,
  isPending,
}: {
  initial?: WhatsAppGroupWithCount
  onClose: () => void
  onSave: (nombre: string, descripcion: string | null, color: string) => void
  isPending: boolean
}) {
  const [nombre, setNombre] = useState(initial?.nombre_grupo ?? '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '')
  const [color, setColor] = useState(initial?.color ?? '#25d366')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="glass border border-[var(--border-subtle)] rounded-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            {initial ? 'Editar grupo' : 'Nuevo grupo'}
          </h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
          Nombre *
        </label>
        <input
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Capacitación IA 2026"
          className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#25d366] mb-3"
        />

        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
          Descripción (opcional)
        </label>
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: Docentes de informática"
          className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#25d366] mb-3"
        />

        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
          Color
        </label>
        <div className="flex gap-2 flex-wrap mb-5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-all ${
                color === c
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f0f] scale-110'
                  : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(nombre.trim(), descripcion.trim() || null, color)}
            disabled={isPending || !nombre.trim()}
            className="px-4 py-2 bg-[#25d366] text-black font-bold text-sm rounded-lg hover:bg-[#1fae53] disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {initial ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: nuevo / editar contacto ─────────────────────────

function ContactFormModal({
  initial,
  onClose,
  onSave,
  isPending,
}: {
  initial?: WhatsAppContact | null
  onClose: () => void
  onSave: (data: {
    nombre: string
    telefono: string
    email: string | null
    es_agenda_itec: boolean
  }) => void
  isPending: boolean
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [telefono, setTelefono] = useState(initial?.telefono ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [esAgenda, setEsAgenda] = useState(initial?.es_agenda_itec ?? true)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="glass border border-[var(--border-subtle)] rounded-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus size={18} className="text-[#25d366]" />
            {initial ? 'Editar contacto' : 'Nuevo contacto en la agenda'}
          </h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white">
            <X size={20} />
          </button>
        </div>

        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
          Nombre *
        </label>
        <input
          autoFocus
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre y apellido"
          className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#25d366] mb-3"
        />

        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
          Teléfono *
        </label>
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="+54 9 11 1234-5678"
          className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#25d366] font-mono mb-3"
        />

        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
          Email (opcional)
        </label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@ejemplo.com"
          className="w-full bg-black/40 border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#25d366] mb-4"
        />

        <label className="flex items-center gap-2.5 cursor-pointer mb-5 select-none">
          <input
            type="checkbox"
            checked={esAgenda}
            onChange={(e) => setEsAgenda(e.target.checked)}
            className="w-4 h-4 accent-[#25d366] rounded cursor-pointer"
          />
          <span className="text-sm text-white">Parte de la agenda ITEC</span>
        </label>

        <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              onSave({
                nombre: nombre.trim(),
                telefono: telefono.trim(),
                email: email.trim() || null,
                es_agenda_itec: esAgenda,
              })
            }
            disabled={isPending || !nombre.trim() || !telefono.trim()}
            className="px-4 py-2 bg-[#25d366] text-black font-bold text-sm rounded-lg hover:bg-[#1fae53] disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {initial ? 'Actualizar' : 'Dar de alta'}
          </button>
        </div>
      </div>
    </div>
  )
}
